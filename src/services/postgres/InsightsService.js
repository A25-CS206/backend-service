const { Pool } = require("pg");
const axios = (require = "axios");
const InvariantError = (require = "../../exceptions/InvariantError");

// Konstan untuk Mapping Cluster ID (sesuai setting kita sebelumnya)
const LEARNER_MAP = {
  0: { name: "Reflective Learner" },
  1: { name: "Fast Learner" },
  2: { name: "Consistent Learner" },
};

class InsightsService {
  constructor(pool) {
    this._pool = pool; // Menerima pool dari server.js (DI)
  }

  // ==========================================================
  // 1. LEARNING INSIGHTS (/api/insights)
  // ==========================================================
  async getLearningInsights(userId) {
    // Ambil data agregat (all-time/weekly)
    const features = await this._getFeaturesFromDB(userId);

    // Ambil data kuis 3 modul terakhir
    const quizPerformance = await this._getQuizPerformance(userId);

    // 2. Persona: Prioritas 1: Ambil dari Tabel Clustering
    let predictedLabel = await this._getPersonaFromClusterTable(userId);
    let confidence = 0.95; // Default tinggi jika sudah di-cluster

    if (!predictedLabel) {
      // Jika tidak ada di tabel cluster, jalankan prediksi ML atau Fallback
      predictedLabel = LEARNER_MAP[2].name; // Default: Consistent Learner
      confidence = 0.65;

      if (process.env.ML_SERVICE_URL) {
        try {
          const payload = {
            avg_quiz_score: features.avg_quiz_score,
            total_duration: features.total_duration,
            modules_completed: features.modules_count,
          };
          const mlRes = await axios.post(process.env.ML_SERVICE_URL, payload);

          if (mlRes.data.label) {
            predictedLabel = mlRes.data.label;
          } else if (mlRes.data.cluster !== undefined) {
            predictedLabel = this._mapStyle(mlRes.data.cluster).name;
          }
          if (mlRes.data.confidence) confidence = mlRes.data.confidence;
        } catch (error) {
          console.warn("⚠️ ML Service Unreachable, using fallback logic.");
          // Logika Fallback Sederhana Dinamis berdasarkan features
          if (features.active_days >= 4) predictedLabel = LEARNER_MAP[2].name;
          else if (features.avg_quiz_score >= 4.5) predictedLabel = LEARNER_MAP[1].name;
          else predictedLabel = LEARNER_MAP[0].name;
          confidence = 0.7;
        }
      }
    }

    // 3. Generate Data Lengkap
    const styleDetail = this._getStyleDetail(predictedLabel);
    const swAnalysis = this._generateSW(features, predictedLabel);
    const consistencyChart = await this._getConsistencyChart(userId);

    // Hitung total jam belajar per hari (All Time)
    const totalHours = features.total_duration / 3600;
    const daysRegistered = (new Date() - features.registered_at) / (1000 * 3600 * 24);
    const avgStudyTime = daysRegistered > 0 ? (totalHours / daysRegistered).toFixed(1) : "0.0";

    return {
      learning_style_detection: {
        detected_style: predictedLabel,
        model_confidence: `${(confidence * 100).toFixed(0)}%`,
        description: styleDetail.desc,
      },
      weekly_recommendations: styleDetail.recommendations,
      weekly_metrics_summary: {
        // Diubah menjadi jam/hari (All Time)
        average_study_time: `${avgStudyTime} hours/day`,
        modules_completed: `${features.modules_count} modules`,
        // Skor rata-rata all-time
        average_quiz_score: `${(features.avg_quiz_score * 20).toFixed(0)} pts`,
        // Menggunakan Active Days dari query (yang mencakup semua data demo)
        active_days: `${features.active_days} days active`,
      },
      strengths_and_weaknesses: swAnalysis,
      // 🆕 ARRAY INI SUDAH DINAMIS 🆕
      quiz_performance_comparison: quizPerformance,
      consistency_trend: consistencyChart,
    };
  }

  // --- HELPER METHODS ---

  /**
   * Mengambil fitur agregat (AVG Score, Total Durasi, Modul Selesai, Active Days)
   * Mengambil semua waktu (All Time) kecuali Active Days yang difilter
   */
  async _getFeaturesFromDB(userId) {
    // Query metrik All Time (AVG Score, Total Durasi, Modules Completed)
    const queryMetric = {
      text: `
                SELECT 
                    COALESCE(AVG(avg_submission_rating), 0) as avg_score,
                    COALESCE(SUM(study_duration), 0) as total_duration,
                    COUNT(id) as modules_count,
                    (SELECT created_at FROM users WHERE id = $1) as registered_at
                FROM developer_journey_completions 
                WHERE user_id = $1
            `,
      values: [userId],
    };

    // Query Active Days (menggunakan rentang demo 2025-12-01 hingga 7 hari dari NOW)
    // Ini memastikan data demo tercakup dan tidak menjadi 0
    const queryActive = {
      text: `
                SELECT 
                    COUNT(DISTINCT last_viewed::date) as cnt 
                FROM developer_journey_trackings 
                WHERE developer_id = $1 
                AND last_viewed >= '2025-12-01'::date AND last_viewed <= (NOW() + INTERVAL '1 day')::date
            `,
      values: [userId],
    };

    const [resMetric, resActive] = await Promise.all([
      this._pool.query(queryMetric),
      this._pool.query(queryActive),
    ]);

    return {
      avg_quiz_score: parseFloat(resMetric.rows[0].avg_score) || 0,
      total_duration: parseInt(resMetric.rows[0].total_duration) || 0,
      modules_count: parseInt(resMetric.rows[0].modules_count) || 0,
      registered_at: resMetric.rows[0].registered_at, // Tambahkan tanggal registrasi
      active_days: parseInt(resActive.rows[0].cnt) || 0,
    };
  }

  /**
   * 🆕 Mengambil Tipe Persona dari Tabel Clustering 🆕
   */
  async _getPersonaFromClusterTable(userId) {
    const query = {
      text: `SELECT learner_type FROM user_learning_clusters WHERE user_id = $1`,
      values: [userId],
    };
    const result = await this._pool.query(query);
    return result.rows.length > 0 ? result.rows[0].learner_type : null;
  }

  /**
   * 🆕 Mengambil Data Perbandingan Kuis Terakhir (Dinamis) 🆕
   */
  async _getQuizPerformance(userId) {
    const query = {
      text: `
                SELECT
                    dj.name AS journey_name,
                    er.score AS your_score,
                    (
                        SELECT AVG(score) 
                        FROM exam_results 
                        WHERE exam_registration_id IN (
                            SELECT id FROM exam_registrations 
                            WHERE exam_module_id = er_reg.exam_module_id
                        )
                    ) AS average_score
                FROM exam_results er
                JOIN exam_registrations er_reg ON er.exam_registration_id = er_reg.id
                JOIN developer_journeys dj ON er_reg.exam_module_id = 'exam_mod_' || dj.id
                WHERE er_reg.examinees_id = $1
                ORDER BY er.created_at DESC
                LIMIT 3
            `,
      values: [userId],
    };

    const res = await this._pool.query(query);

    return res.rows.map((row) => ({
      quiz: row.journey_name || "Final Exam",
      your_score: parseFloat(row.your_score).toFixed(0),
      average_score: parseFloat(row.average_score).toFixed(0),
    }));
  }

  _getStyleDetail(labelName) {
    const details = {
      "Fast Learner": {
        desc: "You process information quickly and prefer fast-paced content.",
        recommendations: [
          "Challenge yourself with advanced modules immediately.",
          "Take complex quizzes to ensure deep understanding.",
        ],
      },
      "Consistent Learner": {
        desc: "You have a steady study habit and retain information through repetition.",
        recommendations: [
          "Maintain your excellent daily streak.",
          "Try increasing session duration by 10% next week.",
        ],
      },
      "Reflective Learner": {
        desc: "You prefer to dive deep into topics and review materials thoroughly.",
        recommendations: [
          "Focus on summarization after each session.",
          "Break down complex modules into smaller chunks.",
        ],
      },
    };
    return details[labelName] || details[LEARNER_MAP[2].name];
  }

  _mapStyle(clusterId) {
    // Menggunakan konstanta LEARNER_MAP
    return LEARNER_MAP[clusterId] || LEARNER_MAP[2];
  }

  _generateSW(features, label) {
    const strengths = [];
    const weaknesses = [];

    // Strength Logic (Active Days menggunakan data all-time yang difilter)
    if (features.avg_quiz_score >= 4.0) {
      strengths.push({
        title: "High Accuracy",
        explanation: "Skor kuis rata-rata tinggi menunjukkan pemahaman konsep yang solid.",
      });
    }
    if (label === LEARNER_MAP[2].name && features.active_days >= 3) {
      strengths.push({
        title: "High Consistency",
        explanation: "Frekuensi belajar yang stabil membantu retensi jangka panjang.",
      });
    }

    // Weakness Logic
    // Menggunakan active_days yang difilter (bukan 4 hari hardcode)
    if (features.active_days < 3) {
      weaknesses.push({
        title: "Inconsistent Schedule",
        explanation: "Jeda panjang antar sesi dapat menurunkan efektivitas model belajar.",
      });
    }
    if (features.total_duration < 1800) {
      weaknesses.push({
        title: "Low Exposure",
        explanation: "Data input terlalu sedikit untuk analisis maksimal.",
      });
    }

    // Default Filler
    if (strengths.length === 0)
      strengths.push({
        title: "Developing",
        explanation: "Terus belajar untuk membangun profil data yang kuat.",
      });
    if (weaknesses.length === 0)
      weaknesses.push({
        title: "Balanced Profile",
        explanation: "Tidak ada kelemahan signifikan yang terdeteksi minggu ini.",
      });

    return { strengths, weaknesses };
  }

  // Mengubah filter waktu menjadi rentang waktu demo (1 Des 2025 hingga hari ini)
  async _getConsistencyChart(userId) {
    const query = {
      text: `
                WITH DateSeries AS (
                    -- Menggunakan 1 Des 2025 sebagai tanggal mulai demo
                    SELECT generate_series('2025-12-01'::date, NOW()::date, '1 day'::interval) AS day
                )
                SELECT 
                    d.day::date AS date,
                    COALESCE(COUNT(t.id), 0) > 0 AS active,
                    COALESCE(SUM(CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END), 0) AS modules_completed
                FROM DateSeries d
                LEFT JOIN developer_journey_trackings t 
                    ON t.last_viewed::date = d.day::date AND t.developer_id = $1
                LEFT JOIN developer_journey_completions c 
                    ON c.created_at::date = d.day::date AND c.user_id = $1
                GROUP BY d.day
                ORDER BY d.day ASC
            `,
      values: [userId],
    };

    const res = await this._pool.query(query);
    return res.rows.map((row) => ({
      date: row.date.toISOString().split("T")[0], // YYYY-MM-DD
      active: row.active,
      modules_completed: parseInt(row.modules_completed),
    }));
  }
}

module.exports = InsightsService;
