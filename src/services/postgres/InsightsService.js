const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
});

class InsightsService {
  constructor() {
    this._pool = pool;
  }

  // --- 1. DASHBOARD UTAMA ---
  async getDashboardStats(userId) {
    const queryStats = {
      text: `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (last_viewed::timestamp - first_opened_at::timestamp)) / 3600), 0) as total_hours,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as modules_completed FROM developer_journey_trackings WHERE developer_id = $1`,
      values: [userId],
    };

    const queryScore = {
      text: `SELECT COALESCE(AVG(score), 0) as avg_score FROM exam_results r JOIN exam_registrations reg ON r.exam_registration_id = reg.id WHERE reg.examinees_id = $1`,
      values: [userId],
    };

    const queryTrend = {
      text: `SELECT TRIM(TO_CHAR(last_viewed::timestamp, 'Day')) as day_name, SUM(EXTRACT(EPOCH FROM (last_viewed::timestamp - first_opened_at::timestamp)) / 3600) as hours
             FROM developer_journey_trackings WHERE developer_id = $1 AND last_viewed::timestamp >= NOW() - INTERVAL '7 days' GROUP BY day_name`,
      values: [userId],
    };

    const queryCluster = {
      text: "SELECT learner_type FROM user_learning_clusters WHERE user_id = $1",
      values: [userId],
    };

    const [resStats, resScore, resTrend, resCluster] = await Promise.all([
      this._pool.query(queryStats),
      this._pool.query(queryScore),
      this._pool.query(queryTrend),
      this._pool.query(queryCluster),
    ]);

    const stats = resStats.rows[0];
    const avgScore = parseFloat(resScore.rows[0].avg_score).toFixed(0);
    const learnerType = resCluster.rows[0]?.learner_type || "Consistent Learner";
    const totalHours = parseFloat(stats.total_hours).toFixed(1);

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
      if (daysMap[r.day_name] !== undefined) daysMap[r.day_name] = parseFloat(r.hours);
    });

    const learningTrend = Object.keys(daysMap).map((d) => ({
      day: d.substring(0, 3),
      hours: parseFloat(daysMap[d].toFixed(1)),
    }));

    return {
      stats: {
        total_hours_studied: parseFloat(totalHours),
        modules_completed: parseInt(stats.modules_completed),
        average_quiz_score: parseInt(avgScore),
      },
      learning_trend: learningTrend,
      personal_insight_summary: {
        id: `Gaya belajarmu terdeteksi sebagai '${learnerType}'. Minggu ini kamu belajar total ${totalHours} jam.`,
        en: `Your learning style is detected as '${learnerType}'. This week you studied a total of ${totalHours} hours.`,
      },
      today_recommendation: {
        journey_id: "journey-web-01",
        title: "Belajar Dasar Pemrograman Web",
        reason: { id: "Lanjutkan momentummu!", en: "Keep the momentum!" },
      },
    };
  }

  // --- 2. DEEP ANALYTICS ---
  async getDeepInsights(userId) {
    const queryMetrics = {
      text: `SELECT COUNT(*) as total_sessions, COALESCE(AVG(score), 0) as avg_score FROM exam_results r JOIN exam_registrations reg ON r.exam_registration_id = reg.id WHERE reg.examinees_id = $1`,
      values: [userId],
    };

    const queryGlobal = {
      text: `SELECT COALESCE(AVG(score), 0) as global_score FROM exam_results`,
    };

    const [resMetrics, resGlobal] = await Promise.all([
      this._pool.query(queryMetrics),
      this._pool.query(queryGlobal),
    ]);

    const userScore = parseFloat(resMetrics.rows[0].avg_score);
    const globalScore = parseFloat(resGlobal.rows[0].global_score);
    const totalSessions = parseInt(resMetrics.rows[0].total_sessions);

    const strengths = [];
    const weaknesses = [];

    if (userScore > 85) {
      strengths.push({
        type: "retention",
        title: { id: "Daya Ingat Tinggi", en: "High Retention Rate" },
        description: {
          id: "Skor kuis rata-rata anda diatas 85%.",
          en: "Your average quiz score is above 85%.",
        },
      });
    }

    if (totalSessions < 3 && userScore > 70) {
      weaknesses.push({
        type: "consistency",
        title: { id: "Kurang Konsisten", en: "Inconsistent Access" },
        description: { id: "Anda jarang mengakses materi.", en: "You rarely access materials." },
      });
    }

    if (strengths.length === 0)
      strengths.push({
        type: "general",
        title: { id: "Potensi", en: "Potential" },
        description: { id: "Teruslah belajar!", en: "Keep learning!" },
      });

    return {
      profile: {
        learning_style: { id: "Tipe Penjelajah", en: "Explorer Type" },
        model_confidence: totalSessions > 5 ? "High" : "Low",
      },
      weekly_metrics: {
        avg_hours_per_day: 1.5,
        modules_completed: 4,
        avg_quiz_score: parseInt(userScore),
      },
      performance_analysis: { strengths, weaknesses },
      comparison: {
        user_avg_score: parseInt(userScore),
        global_avg_score: parseInt(globalScore),
        message: {
          id:
            userScore >= globalScore
              ? "Hebat! Anda di atas rata-rata."
              : "Ayo kejar ketertinggalan!",
          en: userScore >= globalScore ? "Great! You are above average." : "Let's catch up!",
        },
      },
      consistency_trend: [],
    };
  }
}

module.exports = InsightsService;
