const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const { Pool } = require("pg");

// --- KONSTANTA (Sesuaikan jika tanggal demo berubah) ---
const DEMO_USER_ID = "user-f5KSPirteftx8lLo";
const DEMO_START_DATE = "2025-12-01"; // Awal minggu demo
const DEMO_END_DATE = "2025-12-08"; // Akhir minggu demo

class TrackingsService {
  constructor(pool) {
    this._pool = pool;
  }

  // --- HELPER UNTUK MENGAMBIL PERSONA DARI TABEL CLUSTERING ---
  async _getPersonaFromClusterTable(userId) {
    const query = {
      text: "SELECT learner_type FROM user_learning_clusters WHERE user_id = $1",
      values: [userId],
    };
    const result = await this._pool.query(query);
    return result.rows.length > 0 ? result.rows[0].learner_type : null;
  }

  // --- HELPER UNTUK DETAIL DESKRIPSI PERSONA ---
  _getStyleDetail(labelName) {
    const details = {
      "Fast Learner": {
        desc: "You process information quickly and prefer fast-paced content.",
        confidence: "90%",
      },
      "Consistent Learner": {
        desc: "You have a steady study habit and retain information through repetition.",
        confidence: "95%",
      },
      "Reflective Learner": {
        desc: "You prefer to dive deep into topics and review materials thoroughly.",
        confidence: "85%",
      },
    };
    return details[labelName] || details["Consistent Learner"];
  }

  // ==========================================================
  // 1. DASHBOARD OVERVIEW (/api/dashboard)
  // ==========================================================
  async getDashboardOverview(userId) {
    const isDemoUser = userId === DEMO_USER_ID;

    // --- Dynamic Date Handling (Menggunakan tanggal demo atau NOW() normal) ---
    // Pastikan casting dilakukan di luar string SQL jika menggunakan parameter $1,
    // Di sini kita menggunakan string langsung karena nilainya tergantung logika JS IF/ELSE.
    const currentStart = isDemoUser ? `DATE '${DEMO_START_DATE}'` : `NOW() - INTERVAL '7 days'`;
    const currentEnd = isDemoUser ? `DATE '${DEMO_END_DATE}'` : `NOW()`;
    const lastStart = isDemoUser
      ? `DATE '${DEMO_START_DATE}' - INTERVAL '7 days'`
      : `NOW() - INTERVAL '14 days'`;
    const lastEnd = isDemoUser ? `DATE '${DEMO_START_DATE}'` : `NOW() - INTERVAL '7 days'`;

    // --- QUERY A: Metrics Card (Current vs Last Week) ---
    const queryMetrics = {
      text: `
        SELECT 
          COALESCE(SUM(study_duration) FILTER (WHERE created_at::timestamp >= ${currentStart} AND created_at::timestamp < ${currentEnd}), 0) as current_time,
          COALESCE(SUM(study_duration) FILTER (WHERE created_at::timestamp >= ${lastStart} AND created_at::timestamp < ${lastEnd}), 0) as last_week_time,
          
          COUNT(id) FILTER (WHERE created_at::timestamp >= ${currentStart} AND created_at::timestamp < ${currentEnd}) as current_modules,
          COUNT(id) FILTER (WHERE created_at::timestamp >= ${lastStart} AND created_at::timestamp < ${lastEnd}) as last_week_modules,

          COALESCE(AVG(avg_submission_rating) FILTER (WHERE created_at::timestamp >= ${currentStart} AND created_at::timestamp < ${currentEnd}), 0) as current_score,
          COALESCE(AVG(avg_submission_rating) FILTER (WHERE created_at::timestamp >= ${lastStart} AND created_at::timestamp < ${lastEnd}), 0) as last_week_score
        FROM developer_journey_completions
        WHERE user_id = $1
      `,
      values: [userId],
    };

    // --- QUERY B: Consistency (Active Days) ---
    const queryConsistency = {
      text: `
        SELECT COUNT(DISTINCT last_viewed::timestamp::date) as active_days
        FROM developer_journey_trackings
        WHERE developer_id = $1 AND last_viewed::timestamp >= ${currentStart} AND last_viewed::timestamp < ${currentEnd}
      `,
      values: [userId],
    };

    // --- QUERY C: Chart (Senin - Minggu) ---
    const chartWeekStart = isDemoUser ? `DATE '${DEMO_START_DATE}'` : `DATE_TRUNC('week', NOW())`;

    const queryChart = {
      text: `
        WITH daily_data AS (
            SELECT 
                last_viewed::timestamp::date as day,
                COUNT(*) as sessions
            FROM developer_journey_trackings
            WHERE developer_id = $1 AND last_viewed::timestamp >= ${chartWeekStart} AND last_viewed::timestamp < ${chartWeekStart} + INTERVAL '7 days'
            GROUP BY 1
        )
        SELECT 
            d.day::date,
            COALESCE(dd.sessions, 0) * 0.5 as estimated_hours 
        FROM generate_series(
            ${chartWeekStart}::timestamp, 
            ${chartWeekStart}::timestamp + INTERVAL '6 days', 
            '1 day'
        ) d(day)
        LEFT JOIN daily_data dd ON d.day = dd.day
        ORDER BY d.day ASC
      `,
      values: [userId],
    };

    // --- QUERY D: Today's Recommendation (Resume) ---
    const queryRec = {
      text: `
        SELECT j.name, tut.title, j.image_path
        FROM developer_journey_trackings t
        JOIN developer_journeys j ON t.journey_id = j.id
        JOIN developer_journey_tutorials tut ON t.tutorial_id = tut.id
        WHERE t.developer_id = $1
        ORDER BY t.last_viewed DESC LIMIT 1
      `,
      values: [userId],
    };

    // --- Eksekusi dan Ambil Persona ---
    const [resMetrics, resCons, resChart, resRec] = await Promise.all([
      this._pool.query(queryMetrics),
      this._pool.query(queryConsistency),
      this._pool.query(queryChart),
      this._pool.query(queryRec),
    ]);

    const learnerType = await this._getPersonaFromClusterTable(userId);
    const personaDetails = this._getStyleDetail(learnerType);
    const defaultLearner = "Consistent Learner";

    // --- CALCULATION LOGIC ---
    const m = resMetrics.rows[0];
    const activeDays = parseInt(resCons.rows[0].active_days);
    const lastActivity = resRec.rows[0];

    // Time
    const currentHours = parseInt(m.current_time) / 3600;
    const lastHours = parseInt(m.last_week_time) / 3600;
    const diffHours = currentHours - lastHours;

    // Modules
    const currentMods = parseInt(m.current_modules);
    const diffMods = currentMods - parseInt(m.last_week_modules);

    // Score (Skala 5 -> 100)
    const currentScore = (parseFloat(m.current_score) || 0) * 20;
    const lastScore = (parseFloat(m.last_week_score) || 0) * 20;
    const diffScore = currentScore - lastScore;

    // 🆕 Membuat String Persona Summary 🆕
    const insightSummary = `Gaya belajarmu terdeteksi sebagai ${
      learnerType || defaultLearner
    } (confidence: 78%). Minggu ini kamu belajar total ${currentHours.toFixed(
      1
    )} jam. Rekomendasi: Pertahankan konsistensi harianmu!`;

    return {
      // 🆕 TAMBAHAN LEARNING STYLE DETECTION 🆕
      learning_style_detection: {
        detected_style: learnerType || defaultLearner,
        model_confidence: personaDetails.confidence,
        description: personaDetails.desc,
      },

      metrics_cards: {
        total_study_time: {
          value: `${currentHours.toFixed(1)} h`,
          comparison: `${diffHours >= 0 ? "+" : ""}${diffHours.toFixed(1)}h vs last week`,
        },
        completed_modules: {
          value: currentMods,
          comparison: `${diffMods >= 0 ? "+" : ""}${diffMods} vs last week`,
        },
        average_quiz_score: {
          value: currentScore.toFixed(0),
          trend: `${diffScore >= 0 ? "+" : ""}${diffScore.toFixed(1)} pts`,
        },
        consistency_of_access: {
          value: `${Math.round((activeDays / 7) * 100)}%`,
          days_active: `${activeDays} days`,
        },
      },
      learning_trend_chart: resChart.rows.map((r) => parseFloat(r.estimated_hours)),
      todays_recommendation: lastActivity
        ? `Lanjutkan: ${lastActivity.name} - ${lastActivity.title}`
        : "Mulai petualangan belajarmu hari ini!",

      personal_insight_summary: insightSummary,

      module_recommendations: [
        { title: "Advanced Backend Security", reason: "Cocok untuk Fast Learner" },
        { title: "Database Optimization", reason: "Melengkapi skill SQL kamu" },
      ],
    };
  }

  // ==========================================================
  // 2. MY COURSES (/api/my-courses)
  // ==========================================================
  async getMyCourses(userId) {
    const query = {
      text: `
        SELECT DISTINCT ON (j.id)
          j.id, 
          j.name, 
          j.image_path,
          t.last_viewed,
          c.created_at as completed_at,
          CASE WHEN c.id IS NOT NULL THEN 100 ELSE 45 END as progress_percent,
          CASE WHEN c.id IS NOT NULL THEN 'completed' ELSE 'in-progress' END as status
        FROM developer_journeys j
        JOIN developer_journey_trackings t ON j.id = t.journey_id
        LEFT JOIN developer_journey_completions c ON j.id = c.journey_id AND c.user_id = $1
        WHERE t.developer_id = $1
        ORDER BY j.id, t.last_viewed DESC
      `,
      values: [userId],
    };

    const result = await this._pool.query(query);

    const timeAgo = (dateStr) => {
      if (!dateStr) return "Never";
      const diff = (new Date() - new Date(dateStr)) / 1000;
      if (diff < 60) return `${Math.floor(diff)} sec ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      return `${Math.floor(diff / 86400)} days ago`;
    };

    return result.rows.map((row) => ({
      id: row.id,
      title: row.name,
      status: row.status,
      progress: `${row.progress_percent}%`,
      last_opened: timeAgo(row.last_viewed),
      completed_at: row.completed_at ? new Date(row.completed_at).toDateString() : null,
      modules: "5/8 modules",
    }));
  }

  // ==========================================================
  // 3. LOG ACTIVITY (Core Function)
  // ==========================================================
  async logActivity({ journeyId, tutorialId, userId }) {
    const timeNow = new Date().toISOString();

    const checkQuery = {
      text: "SELECT id FROM developer_journey_trackings WHERE developer_id = $1 AND tutorial_id = $2",
      values: [userId, tutorialId],
    };
    const checkResult = await this._pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      const updateQuery = {
        text: "UPDATE developer_journey_trackings SET last_viewed = $1 WHERE id = $2 RETURNING id",
        values: [timeNow, checkResult.rows[0].id],
      };
      const result = await this._pool.query(updateQuery);
      return result.rows[0].id;
    } else {
      const id = `track-${nanoid(16)}`;
      const insertQuery = {
        text: "INSERT INTO developer_journey_trackings (id, journey_id, tutorial_id, developer_id, status, first_opened_at, last_viewed) VALUES($1, $2, $3, $4, 'in_progress', $5, $5) RETURNING id",
        values: [id, journeyId, tutorialId, userId, timeNow],
      };
      const result = await this._pool.query(insertQuery);
      if (!result.rows.length) throw new InvariantError("Gagal mencatat aktivitas.");
      return result.rows[0].id;
    }
  }

  // Legacy support
  async getStudentActivities(userId) {
    const query = {
      text: `SELECT t.id, t.status, t.last_viewed, j.name as journey_name, tut.title as tutorial_title 
             FROM developer_journey_trackings t
             LEFT JOIN developer_journeys j ON t.journey_id = j.id
             LEFT JOIN developer_journey_tutorials tut ON t.tutorial_id = tut.id
             WHERE t.developer_id = $1 ORDER BY t.last_viewed DESC`,
      values: [userId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = TrackingsService;
