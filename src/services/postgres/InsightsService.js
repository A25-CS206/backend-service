const { Pool } = require("pg");
const axios = require("axios");

class InsightsService {
  constructor() {
    // Inisialisasi Database Pool (Mendukung Vercel/Neon SSL)
    if (process.env.DATABASE_URL) {
      this._pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      this._pool = new Pool();
    }
  }

  // =================================================================
  // METHOD 1: GENERATE INSIGHT (Memicu AI Python & Menyimpan Hasil)
  // =================================================================
  async generateStudentInsight(userId) {
    // 1. QUERY DATABASE: Ambil Data Raw Tracking
    const query = {
      text: `
        SELECT 
          COUNT(id) as total_materials,
          MIN(first_opened_at) as first_active,
          MAX(last_viewed) as last_active,
          COUNT(DISTINCT DATE(last_viewed)) as active_days
        FROM developer_journey_trackings 
        WHERE developer_id = $1
      `,
      values: [userId],
    };

    const result = await this._pool.query(query);
    const stats = result.rows[0];

    // Cek jika data kosong (User baru)
    if (parseInt(stats.total_materials) === 0) {
      return {
        cluster: -1,
        learner_type: "New Learner",
        description: "Belum cukup data aktivitas untuk dianalisis.",
      };
    }

    // 2. FEATURE ENGINEERING (Menyiapkan Data untuk Python)
    const totalMaterials = parseInt(stats.total_materials);

    // Hitung selisih hari (Durasi aktif user dalam hari)
    const start = new Date(stats.first_active);
    const end = new Date(stats.last_active);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Hitung 6 Fitur Utama
    const avgMaterialsPerDay = totalMaterials / diffDays;
    const totalWeeks = Math.ceil(diffDays / 7) || 1;
    const avgLoginsPerWeek = parseInt(stats.active_days) / totalWeeks;
    const loginVariance = 5.0; // Placeholder standar
    const avgDuration = 15.0; // Placeholder standar

    const payloadML = [
      {
        avg_materials_per_day: avgMaterialsPerDay,
        total_materials: totalMaterials,
        avg_duration_per_material: avgDuration,
        total_weeks_active: totalWeeks,
        avg_logins_per_week: avgLoginsPerWeek,
        login_weekly_variance: loginVariance,
      },
    ];

    try {
      // 3. TEMBAK API PYTHON (Render/Railway)
      const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8000/predict";

      const response = await axios.post(mlUrl, payloadML);
      const prediction = response.data[0];

      // 4. SIMPAN HASIL KE TABEL CLUSTER (UPSERT Logic)
      const querySave = {
        text: `
          INSERT INTO user_learning_clusters (user_id, cluster, learner_type, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            cluster = EXCLUDED.cluster, 
            learner_type = EXCLUDED.learner_type,
            updated_at = NOW()
        `,
        values: [userId, prediction.cluster, prediction.learner_type],
      };

      await this._pool.query(querySave);

      return prediction;
    } catch (error) {
      console.error("ML Service Error:", error.message);
      // Fallback response jika ML mati
      return {
        cluster: -99,
        learner_type: "Unidentified",
        description: "Layanan AI sedang tidak dapat dihubungi.",
      };
    }
  }

  // =================================================================
  // METHOD 2: GET DASHBOARD STATS (Data Tampilan Front-End)
  // =================================================================
  async getDashboardStats(userId) {
    // A. Query Insight AI (Ambil status Learner Type dari DB)
    const queryInsight = {
      text: "SELECT learner_type, cluster FROM user_learning_clusters WHERE user_id = $1",
      values: [userId],
    };

    // B. Query Statistik Utama (Jam Belajar, Kelas Selesai, Consistency)
    // Menggunakan COALESCE agar return 0 jika data kosong, bukan NULL
    const queryStats = {
      text: `
        SELECT 
            COUNT(DISTINCT tutorial_id) filter (where status = 'completed') as completed_classes,
            COALESCE(SUM(EXTRACT(EPOCH FROM (last_viewed::timestamp - first_opened_at::timestamp))/3600), 0) as total_hours_all_time,
            COALESCE(SUM(CASE 
                WHEN last_viewed::timestamp >= NOW() - INTERVAL '7 days' 
                THEN EXTRACT(EPOCH FROM (last_viewed::timestamp - first_opened_at::timestamp))/3600 
                ELSE 0 
            END), 0) as total_hours_weekly,
            COUNT(DISTINCT DATE(last_viewed)) filter (where last_viewed::timestamp >= NOW() - INTERVAL '7 days') as active_days_weekly
        FROM developer_journey_trackings
        WHERE developer_id = $1
      `,
      values: [userId],
    };

    // C. Query Rata-rata Nilai Quiz
    const queryScore = {
      text: `
        SELECT COALESCE(AVG(score), 0) as avg_score 
        FROM exam_results r
        JOIN exam_registrations reg ON r.exam_registration_id = reg.id
        WHERE reg.examinees_id = $1
      `,
      values: [userId],
    };

    // D. Query Learning Trend (Grafik Batang Mingguan)
    const queryTrend = {
      text: `
          SELECT 
            TRIM(TO_CHAR(last_viewed::timestamp, 'Day')) as day_name,
            SUM(EXTRACT(EPOCH FROM (last_viewed::timestamp - first_opened_at::timestamp))/3600) as hours
          FROM developer_journey_trackings
          WHERE developer_id = $1 
            AND last_viewed::timestamp >= DATE_TRUNC('week', NOW()) 
          GROUP BY day_name
        `,
      values: [userId],
    };

    // E. Query REKOMENDASI MODUL (Fitur Baru)
    // Mengambil 2 kursus yang BELUM pernah diambil oleh user
    const queryRecs = {
      text: `
            SELECT id, name, difficulty, hours_to_study 
            FROM developer_journeys
            WHERE id NOT IN (
                SELECT DISTINCT journey_id FROM developer_journey_trackings WHERE developer_id = $1
            )
            LIMIT 2
        `,
      values: [userId],
    };

    // Eksekusi Semua Query secara Paralel (Optimasi Performance)
    const [resInsight, resStats, resScore, resTrend, resRecs] = await Promise.all([
      this._pool.query(queryInsight),
      this._pool.query(queryStats),
      this._pool.query(queryScore),
      this._pool.query(queryTrend),
      this._pool.query(queryRecs),
    ]);

    // --- PENGOLAHAN DATA (DATA PROCESSING) ---

    const insight = resInsight.rows[0] || { learner_type: "Unidentified", cluster: -1 };
    const stats = resStats.rows[0];
    const avgScore = parseFloat(resScore.rows[0].avg_score).toFixed(0);

    // 1. Hitung Consistency Percentage
    const activeDays = parseInt(stats.active_days_weekly);
    const consistencyPercentage = Math.round((activeDays / 7) * 100);

    // 2. Format Grafik Trend (Mapping Senin-Minggu)
    const daysMap = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };
    resTrend.rows.forEach((row) => {
      if (daysMap.hasOwnProperty(row.day_name)) {
        daysMap[row.day_name] = parseFloat(row.hours);
      }
    });

    const learningTrend = Object.keys(daysMap).map((day) => ({
      day: day.substring(0, 3),
      value: parseFloat(daysMap[day].toFixed(1)),
    }));

    // 3. Format Rekomendasi Modul
    const recommendations = resRecs.rows.map((row) => ({
      id: row.id,
      title: row.name,
      difficulty: row.difficulty || "beginner", // Fallback value
      estimatedTime: `${row.hours_to_study || 5} hours`, // Fallback value
    }));

    // 4. Format Achievements / Badges (Fitur Baru)
    const badgesList = [
      {
        id: "fast",
        label: "Fast Learner",
        icon: "⚡",
        description: "Finish the module quickly",
        earned: insight.cluster === 0,
      },
      {
        id: "consistent",
        label: "Consistent Learner",
        icon: "📅",
        description: "Regular and scheduled access",
        earned: insight.cluster === 1,
      },
      {
        id: "reflective",
        label: "Reflective Learner",
        icon: "🧠",
        description: "Study in depth",
        earned: insight.cluster === 2,
      },
    ];

    // 5. Buat Kalimat Summary Dinamis
    const totalHoursWeekly = parseFloat(stats.total_hours_weekly).toFixed(1);
    let recommendationText = recommendations[0]
      ? `Try starting "${recommendations[0].title}"`
      : "Keep exploring new modules!";

    const insightSummary = `Your learning style has been detected as ${insight.learner_type}. This week you studied a total of ${totalHoursWeekly} hours. Recommendation: ${recommendationText}.`;

    // --- FINAL RETURN ---
    return {
      learnerType: insight.learner_type,
      cluster: insight.cluster,

      // Kartu Atas
      totalStudyTime: parseFloat(stats.total_hours_all_time).toFixed(1),
      completedClasses: parseInt(stats.completed_classes),
      averageQuizScore: parseInt(avgScore),
      consistency: {
        percentage: consistencyPercentage,
        daysActive: activeDays,
      },

      // Grafik & Rekomendasi
      learningTrend: learningTrend,
      recommendations: recommendations,

      // Badges & Summary
      achievements: badgesList,
      insightSummary: insightSummary,
    };
  }
}

module.exports = InsightsService;
