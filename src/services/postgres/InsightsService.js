const { Pool } = require("pg");
const axios = require("axios");

class InsightsService {
  constructor() {
    if (process.env.DATABASE_URL) {
      this._pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      this._pool = new Pool();
    }
  }

  // Method 1: Generate Insight (Menembak ke Python ML)
  async generateStudentInsight(userId) {
    // 1. QUERY DATABASE: Hitung Statistik Nyata
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

    if (parseInt(stats.total_materials) === 0) {
      return {
        cluster: -1,
        learner_type: "New Learner",
        description: "Belum cukup data aktivitas untuk dianalisis.",
      };
    }

    // 2. Feature Engineering
    const totalMaterials = parseInt(stats.total_materials);
    const start = new Date(stats.first_active);
    const end = new Date(stats.last_active);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const avgMaterialsPerDay = totalMaterials / diffDays;
    const totalWeeks = Math.ceil(diffDays / 7) || 1;
    const avgLoginsPerWeek = parseInt(stats.active_days) / totalWeeks;

    const loginVariance = 5.0; // Placeholder
    const avgDuration = 15.0; // Placeholder

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
      // 3. Tembak API Python
      const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8000/predict";
      const response = await axios.post(mlUrl, payloadML);
      const prediction = response.data[0];

      // 4. Simpan ke Tabel Cluster (UPSERT)
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
      return {
        cluster: -99,
        learner_type: "Unidentified",
        description: "Gagal menghubungi layanan AI.",
      };
    }
  }

  // Method 2: Get Dashboard Stats (Tampilan Utama)
  async getDashboardStats(userId) {
    // A. Query Insight AI (Cluster)
    const queryInsight = {
      text: "SELECT learner_type, cluster FROM user_learning_clusters WHERE user_id = $1",
      values: [userId],
    };

    // B. Query Statistik Umum (Jam Belajar & Consistency)
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

    // D. Query Learning Trend (Grafik Mingguan)
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

    // Jalankan Paralel
    const [resInsight, resStats, resScore, resTrend] = await Promise.all([
      this._pool.query(queryInsight),
      this._pool.query(queryStats),
      this._pool.query(queryScore),
      this._pool.query(queryTrend),
    ]);

    // --- PENGOLAHAN DATA ---
    const insight = resInsight.rows[0] || { learner_type: "Unidentified", cluster: -1 };
    const stats = resStats.rows[0];
    const avgScore = parseFloat(resScore.rows[0].avg_score).toFixed(0);

    // Hitung Consistency %
    const activeDays = parseInt(stats.active_days_weekly);
    const consistencyPercentage = Math.round((activeDays / 7) * 100);

    // Format Grafik (Mapping Senin-Minggu)
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

    // Buat Kalimat Summary Dinamis
    const totalHoursWeekly = parseFloat(stats.total_hours_weekly).toFixed(1);
    let recommendation = "";

    if (insight.cluster === 0)
      recommendation =
        "Recommendation: Try taking the quick quiz exercises to test your retention speed.";
    else if (insight.cluster === 1)
      recommendation = "Recommendation: Maintain your streak! Try adding a new topic next week.";
    else if (insight.cluster === 2)
      recommendation =
        "Recommendation: Review your notes on Module 3 to deepen your understanding.";
    else recommendation = "Start learning to get AI recommendations.";

    const insightSummary = `Your learning style has been detected as ${insight.learner_type}. This week you studied a total of ${totalHoursWeekly} hours with an average quiz score of ${avgScore}. ${recommendation}`;

    return {
      learnerType: insight.learner_type,
      cluster: insight.cluster,
      totalStudyTime: parseFloat(stats.total_hours_all_time).toFixed(1),
      completedClasses: parseInt(stats.completed_classes),
      averageQuizScore: parseInt(avgScore),
      consistency: {
        percentage: consistencyPercentage,
        daysActive: activeDays,
      },
      learningTrend: learningTrend,
      insightSummary: insightSummary,
    };
  }
}

module.exports = InsightsService;
