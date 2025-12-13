const { Pool } = require("pg");
const axios = require("axios");
const InvariantError = require("../../exceptions/InvariantError");

class InsightsService {
  constructor(pool) {
    this._pool = pool; // Menerima pool dari server.js (DI)
  }

  // ==========================================================
  // 1. LEARNING INSIGHTS (/api/insights)
  // ==========================================================
  async getLearningInsights(userId) {
    // 1. Ambil Data Agregat User dari DB
    const features = await this._getFeaturesFromDB(userId);

    // 2. Prediksi ML (Default Fallback jika ML mati)
    let predictedLabel = "Consistent Learner";
    let confidence = 0.65;

    if (process.env.ML_SERVICE_URL) {
      try {
        // Payload sesuai yang diminta ML Service
        const payload = {
          avg_quiz_score: features.avg_quiz_score,
          total_duration: features.total_duration,
          modules_completed: features.modules_count,
        };

        // Hit Endpoint ML
        const mlRes = await axios.post(process.env.ML_SERVICE_URL, payload);

        // Handle response (bisa berupa label string atau cluster ID)
        if (mlRes.data.label) {
          predictedLabel = mlRes.data.label;
        } else if (mlRes.data.cluster !== undefined) {
          const mapStyle = this._mapStyle(mlRes.data.cluster);
          predictedLabel = mapStyle.name;
        }

        if (mlRes.data.confidence) confidence = mlRes.data.confidence;
      } catch (error) {
        console.warn("⚠️ ML Service Unreachable, using fallback logic.");
        // Logic Fallback Sederhana
        if (features.avg_quiz_score > 4.5) predictedLabel = "Fast Learner";
        else if (features.active_days >= 4) predictedLabel = "Consistent Learner";
        else predictedLabel = "Reflective Learner";
      }
    }

    // 3. Generate Data Lengkap
    const styleDetail = this._getStyleDetail(predictedLabel);
    const swAnalysis = this._generateSW(features, predictedLabel);
    const consistencyChart = await this._getConsistencyChart(userId);

    return {
      learning_style_detection: {
        detected_style: predictedLabel,
        model_confidence: `${(confidence * 100).toFixed(0)}%`,
        description: styleDetail.desc,
      },
      weekly_recommendations: styleDetail.recommendations,
      weekly_metrics_summary: {
        average_study_time: `${(features.total_duration / 3600 / 7).toFixed(1)} hours/day`,
        modules_completed: `${features.modules_count} modules`,
        average_quiz_score: `${(features.avg_quiz_score * 20).toFixed(0)} pts`,
        active_days: `${features.active_days}/7 days`,
      },
      strengths_and_weaknesses: swAnalysis,
      quiz_performance_comparison: [
        { quiz: "Module 1 Quiz", your_score: 85, average_score: 78 },
        { quiz: "Module 2 Quiz", your_score: 90, average_score: 82 },
        {
          quiz: "Module 3 Quiz",
          your_score: (features.avg_quiz_score * 20).toFixed(0),
          average_score: 75,
        },
      ],
      consistency_trend: consistencyChart,
    };
  }

  // --- HELPER METHODS ---

  async _getFeaturesFromDB(userId) {
    const query = {
      text: `
        SELECT 
          COALESCE(AVG(avg_submission_rating), 0) as avg_score,
          COALESCE(SUM(study_duration), 0) as total_duration,
          COUNT(id) as modules_count
        FROM developer_journey_completions 
        WHERE user_id = $1
      `,
      values: [userId],
    };

    // Fitur Active Days
    const queryActive = {
      text: "SELECT COUNT(DISTINCT last_viewed::date) as cnt FROM developer_journey_trackings WHERE developer_id = $1 AND last_viewed >= NOW() - INTERVAL '7 days'",
      values: [userId],
    };

    const [resMetric, resActive] = await Promise.all([
      this._pool.query(query),
      this._pool.query(queryActive),
    ]);

    return {
      avg_quiz_score: parseFloat(resMetric.rows[0].avg_score) || 0,
      total_duration: parseInt(resMetric.rows[0].total_duration) || 0,
      modules_count: parseInt(resMetric.rows[0].modules_count) || 0,
      active_days: parseInt(resActive.rows[0].cnt) || 0,
    };
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
    return details[labelName] || details["Consistent Learner"];
  }

  _mapStyle(clusterId) {
    const map = {
      0: { name: "Fast Learner" },
      1: { name: "Consistent Learner" },
      2: { name: "Reflective Learner" },
    };
    return map[clusterId] || map[1];
  }

  _generateSW(features, label) {
    const strengths = [];
    const weaknesses = [];

    // Strength Logic
    if (features.avg_quiz_score >= 4.0) {
      strengths.push({
        title: "High Accuracy",
        explanation: "Skor kuis rata-rata tinggi menunjukkan pemahaman konsep yang solid.",
      });
    }
    if (label === "Consistent Learner" || features.active_days >= 4) {
      strengths.push({
        title: "High Consistency",
        explanation: "Frekuensi belajar yang stabil membantu retensi jangka panjang.",
      });
    }

    // Weakness Logic
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

  async _getConsistencyChart(userId) {
    // Generate data 30 hari terakhir
    const query = {
      text: `
            SELECT 
                d.day::date as date,
                CASE WHEN t.id IS NOT NULL THEN true ELSE false END as active,
                COALESCE(COUNT(c.id), 0) as modules_completed
            FROM generate_series(NOW() - INTERVAL '29 days', NOW(), '1 day') d(day)
            LEFT JOIN developer_journey_trackings t ON t.last_viewed::date = d.day::date AND t.developer_id = $1
            LEFT JOIN developer_journey_completions c ON c.created_at::date = d.day::date AND c.user_id = $1
            GROUP BY 1, 2
            ORDER BY 1 ASC
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
