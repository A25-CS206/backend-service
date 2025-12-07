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

  // --- Method 1: Generate Insight (AI Prediction) ---
  async generateStudentInsight(userId) {
    // 1. QUERY DATABASE
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
        description: "Not enough data yet.",
      };
    }

    // 2. Feature Engineering
    const totalMaterials = parseInt(stats.total_materials);
    const diffDays =
      Math.ceil(Math.abs(new Date(stats.last_active) - new Date(stats.first_active)) / 86400000) ||
      1;

    const payloadML = [
      {
        avg_materials_per_day: totalMaterials / diffDays,
        total_materials: totalMaterials,
        avg_duration_per_material: 15.0, // Placeholder
        total_weeks_active: Math.ceil(diffDays / 7) || 1,
        avg_logins_per_week: parseInt(stats.active_days) / (Math.ceil(diffDays / 7) || 1),
        login_weekly_variance: 5.0, // Placeholder
      },
    ];

    try {
      // 3. Call Python ML
      const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8000/predict";
      const response = await axios.post(mlUrl, payloadML);
      const prediction = response.data[0];

      // 4. Upsert Cluster
      const querySave = {
        text: `
          INSERT INTO user_learning_clusters (user_id, cluster, learner_type, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET cluster = EXCLUDED.cluster, learner_type = EXCLUDED.learner_type, updated_at = NOW()
        `,
        values: [userId, prediction.cluster, prediction.learner_type],
      };
      await this._pool.query(querySave);

      return prediction;
    } catch (error) {
      console.error("ML Error:", error.message);
      return { cluster: -99, learner_type: "Unidentified", description: "AI Service Unavailable" };
    }
  }

  // --- Method 2: Get Full Dashboard Data ---
  async getDashboardStats(userId) {
    // A. Query Insight AI
    const queryInsight = {
      text: "SELECT learner_type, cluster FROM user_learning_clusters WHERE user_id = $1",
      values: [userId],
    };

    // B. Query Statistik Utama
    const queryStats = {
      text: `
        SELECT 
            COUNT(DISTINCT tutorial_id) filter (where status = 'completed') as completed_classes,
            COALESCE(SUM(EXTRACT(EPOCH FROM (last_viewed::timestamp - first_opened_at::timestamp))/3600), 0) as total_hours_all_time,
            COALESCE(SUM(CASE WHEN last_viewed >= NOW() - INTERVAL '7 days' THEN EXTRACT(EPOCH FROM (last_viewed - first_opened_at))/3600 ELSE 0 END), 0) as total_hours_weekly,
            COUNT(DISTINCT DATE(last_viewed)) filter (where last_viewed >= NOW() - INTERVAL '7 days') as active_days_weekly
        FROM developer_journey_trackings
        WHERE developer_id = $1
      `,
      values: [userId],
    };

    // C. Query Avg Quiz Score
    const queryScore = {
      text: `
        SELECT COALESCE(AVG(score), 0) as avg_score 
        FROM exam_results r JOIN exam_registrations reg ON r.exam_registration_id = reg.id
        WHERE reg.examinees_id = $1
      `,
      values: [userId],
    };

    // D. Query Learning Trend
    const queryTrend = {
      text: `
          SELECT TRIM(TO_CHAR(last_viewed, 'Day')) as day_name, SUM(EXTRACT(EPOCH FROM (last_viewed - first_opened_at))/3600) as hours
          FROM developer_journey_trackings
          WHERE developer_id = $1 AND last_viewed >= DATE_TRUNC('week', NOW()) 
          GROUP BY day_name
        `,
      values: [userId],
    };

    // E. Query RECOMMENDATIONS (FITUR BARU)
    // Ambil 2 kursus yang BELUM diambil oleh user
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

    // Jalankan Semua Query
    const [resInsight, resStats, resScore, resTrend, resRecs] = await Promise.all([
      this._pool.query(queryInsight),
      this._pool.query(queryStats),
      this._pool.query(queryScore),
      this._pool.query(queryTrend),
      this._pool.query(queryRecs),
    ]);

    // --- Processing ---
    const insight = resInsight.rows[0] || { learner_type: "Unidentified", cluster: -1 };
    const stats = resStats.rows[0];
    const avgScore = parseFloat(resScore.rows[0].avg_score).toFixed(0);

    // Consistency %
    const activeDays = parseInt(stats.active_days_weekly);
    const consistencyPercentage = Math.round((activeDays / 7) * 100);

    // Learning Trend Map
    const daysMap = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };
    resTrend.rows.forEach((r) => {
      if (daysMap.hasOwnProperty(r.day_name)) daysMap[r.day_name] = parseFloat(r.hours);
    });
    const learningTrend = Object.keys(daysMap).map((day) => ({
      day: day.substring(0, 3),
      value: parseFloat(daysMap[day].toFixed(1)),
    }));

    // Recommendations Logic (Bisa dibuat lebih pintar berdasarkan cluster nanti)
    const recommendations = resRecs.rows.map((row) => ({
      id: row.id,
      title: row.name,
      difficulty: row.difficulty,
      estimatedTime: `${row.hours_to_study} hours`,
    }));

    // Achievements / Badges Logic (FITUR BARU)
    // Kita hardcode daftar badge, lalu cek mana yang sesuai dengan cluster user
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

    // Insight Summary Text
    const summary = `Your learning style has been detected as ${
      insight.learner_type
    }. This week you studied a total of ${parseFloat(stats.total_hours_weekly).toFixed(
      1
    )} hours. Recommendation: ${
      recommendations[0]
        ? "Try starting " + recommendations[0].title
        : "Keep exploring new modules!"
    }`;

    return {
      learnerType: insight.learner_type,
      cluster: insight.cluster,
      totalStudyTime: parseFloat(stats.total_hours_all_time).toFixed(1),
      completedClasses: parseInt(stats.completed_classes),
      averageQuizScore: parseInt(avgScore),
      consistency: { percentage: consistencyPercentage, daysActive: activeDays },
      learningTrend: learningTrend,
      recommendations: recommendations, // Output untuk Frontend
      achievements: badgesList, // Output untuk Frontend
      insightSummary: summary,
    };
  }
}

module.exports = InsightsService;
