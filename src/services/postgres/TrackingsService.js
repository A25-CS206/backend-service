const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");

class TrackingsService {
  constructor(pool) {
    this._pool = pool;
  }

  // ==========================================================
  // 1. FITUR DASHBOARD (Statistik, Rekomendasi, & Insight)
  // ==========================================================
  async getDashboardStatistics(userId) {
    // --- QUERY A: Statistik Utama (Total Jam, Modul Selesai, Nilai Rata-rata) ---
    const queryStats = {
      text: `
        SELECT 
          COALESCE(SUM(study_duration), 0) as total_seconds,
          COUNT(id) as modules_completed,
          COALESCE(AVG(avg_submission_rating), 0) as avg_score
        FROM developer_journey_completions
        WHERE user_id = $1
      `,
      values: [userId],
    };

    // --- QUERY B: Learning Trend (7 Hari Terakhir) ---
    // Mengambil data aktivitas harian untuk grafik
    const queryTrend = {
      text: `
        SELECT 
          TO_CHAR(last_viewed, 'Day') as day_name, 
          COUNT(*) as activity_count 
        FROM developer_journey_trackings
        WHERE developer_id = $1 
          AND last_viewed >= NOW() - INTERVAL '7 days'
        GROUP BY 1, last_viewed::date
        ORDER BY last_viewed::date ASC
      `,
      values: [userId],
    };

    // --- QUERY C: Today's Recommendation (Resume Learning) ---
    // Mengambil materi terakhir yang dibuka user
    const queryRec = {
      text: `
        SELECT 
          j.id as journey_id,
          j.name as journey_name,
          j.image_path,
          tut.id as tutorial_id,
          tut.title as tutorial_title,
          t.last_viewed
        FROM developer_journey_trackings t
        JOIN developer_journeys j ON t.journey_id = j.id
        JOIN developer_journey_tutorials tut ON t.tutorial_id = tut.id
        WHERE t.developer_id = $1
        ORDER BY t.last_viewed DESC
        LIMIT 1
      `,
      values: [userId],
    };

    // --- QUERY D: Module Recommendation (New Courses) ---
    // Merekomendasikan 2 kelas yang BELUM pernah diambil user
    const queryNewMod = {
      text: `
        SELECT id, name, image_path, difficulty 
        FROM developer_journeys 
        WHERE id NOT IN (SELECT journey_id FROM developer_journey_trackings WHERE developer_id = $1)
        LIMIT 2
      `,
      values: [userId],
    };

    // Eksekusi Parallel (Lebih Cepat)
    const [resStats, resTrend, resRec, resNewMod] = await Promise.all([
      this._pool.query(queryStats),
      this._pool.query(queryTrend),
      this._pool.query(queryRec),
      this._pool.query(queryNewMod),
    ]);

    const stats = resStats.rows[0];
    const trendData = resTrend.rows;
    const lastActivity = resRec.rows[0];
    const newModules = resNewMod.rows;

    // --- LOGIKA PERSONAL INSIGHT & KONSISTENSI (YANG DIPERBAIKI) ---
    const daysActive = trendData.length;
    let consistencyStatus = "Low";
    let insightTitle = { id: "Ayo Mulai!", en: "Let's Start!" };
    let insightMessage = { id: "Belum ada aktivitas minggu ini.", en: "No activity this week." };

    if (daysActive >= 5) {
      consistencyStatus = "High";
      insightTitle = { id: "Luar Biasa!", en: "Outstanding!" };
      insightMessage = {
        id: `Kamu sangat rajin! Aktif ${daysActive} hari dalam seminggu.`,
        en: `You are on fire! Active for ${daysActive} days this week.`,
      };
    } else if (daysActive >= 3) {
      consistencyStatus = "Medium";
      insightTitle = { id: "Bagus Sekali!", en: "Good Job!" };
      insightMessage = {
        id: "Konsistensimu terjaga. Pertahankan ritme ini!",
        en: "Your consistency is solid. Keep up the rhythm!",
      };
    } else if (daysActive > 0) {
      consistencyStatus = "Low";
      insightTitle = { id: "Tetap Semangat!", en: "Keep Going!" };
      insightMessage = {
        id: "Coba luangkan waktu 15 menit setiap hari untuk belajar.",
        en: "Try to spend 15 minutes every day to learn.",
      };
    }

    // --- RETURN DATA FINAL KE FRONTEND ---
    return {
      // 1. Statistik Angka
      total_study_hours: (parseInt(stats.total_seconds) / 3600).toFixed(1),
      modules_completed: parseInt(stats.modules_completed),
      avg_quiz_score: parseFloat(stats.avg_score).toFixed(1),

      // 2. Grafik Trend Harian
      learning_trend: trendData.map((row) => ({
        day: row.day_name.trim(),
        value: parseInt(row.activity_count),
      })),

      // 3. Today's Recommendation (Lanjut Belajar)
      todays_recommendation: lastActivity
        ? {
            type: "resume",
            journey_name: lastActivity.journey_name,
            tutorial_title: lastActivity.tutorial_title,
            image: lastActivity.image_path,
            message: { id: "Lanjutkan progres terakhirmu.", en: "Resume your last progress." },
          }
        : {
            type: "start",
            message: { id: "Pilih kelas pertamamu di bawah!", en: "Pick your first course below!" },
          },

      // 4. Personalized Module Recommendations
      personalized_recommendations: newModules.map((m) => ({
        id: m.id,
        name: m.name,
        image: m.image_path,
        difficulty: m.difficulty,
      })),

      // 5. Personal Insight Summary (Bilingual)
      personal_insight_summary: {
        title: insightTitle,
        detail: insightMessage,
      },

      // 6. Consistency Status
      consistency_of_access: {
        status: consistencyStatus, // High, Medium, Low (Untuk warna indikator)
        days_active: daysActive,
        message: insightMessage,
      },
    };
  }

  // ==========================================================
  // 2. FITUR MY COURSES (List Kelas User)
  // ==========================================================
  async getMyCourses(userId) {
    const query = {
      text: `
        SELECT DISTINCT ON (j.id)
          j.id, 
          j.name, 
          j.image_path,
          t.last_viewed,
          c.created_at as finished_at,
          CASE 
            WHEN c.id IS NOT NULL THEN 'completed' 
            ELSE 'in_progress' 
          END as status
        FROM developer_journeys j
        JOIN developer_journey_trackings t ON j.id = t.journey_id
        LEFT JOIN developer_journey_completions c ON j.id = c.journey_id AND c.user_id = $1
        WHERE t.developer_id = $1
        ORDER BY j.id, t.last_viewed DESC
      `,
      values: [userId],
    };

    const result = await this._pool.query(query);

    return result.rows.map((row) => ({
      id: row.id,
      title: row.name,
      image: row.image_path,
      status: row.status,
      lastOpened: row.last_viewed,
      finishedAt: row.finished_at,
    }));
  }

  // ==========================================================
  // 3. FITUR LOG ACTIVITY (Mencatat User Buka Materi)
  // ==========================================================
  async logActivity({ journeyId, tutorialId, userId }) {
    const timeNow = new Date().toISOString();

    const checkQuery = {
      text: "SELECT id FROM developer_journey_trackings WHERE developer_id = $1 AND tutorial_id = $2",
      values: [userId, tutorialId],
    };

    const checkResult = await this._pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      // Update waktu terakhir dilihat
      const updateQuery = {
        text: `UPDATE developer_journey_trackings 
               SET last_viewed = $1 
               WHERE id = $2 
               RETURNING id`,
        values: [timeNow, checkResult.rows[0].id],
      };
      const result = await this._pool.query(updateQuery);
      return result.rows[0].id;
    } else {
      // Insert baru jika belum pernah buka
      const id = `track-${nanoid(16)}`;
      const insertQuery = {
        text: `INSERT INTO developer_journey_trackings 
               (id, journey_id, tutorial_id, developer_id, status, first_opened_at, last_viewed) 
               VALUES($1, $2, $3, $4, 'in_progress', $5, $5) 
               RETURNING id`,
        values: [id, journeyId, tutorialId, userId, timeNow],
      };

      const result = await this._pool.query(insertQuery);

      if (!result.rows.length) {
        throw new InvariantError("Gagal mencatat aktivitas belajar.");
      }
      return result.rows[0].id;
    }
  }

  // ==========================================================
  // 4. FITUR HISTORY LIST (Log Detail)
  // ==========================================================
  async getStudentActivities(userId) {
    const query = {
      text: `SELECT 
               t.id, 
               t.status, 
               t.last_viewed,
               j.name as journey_name, 
               tut.title as tutorial_title 
             FROM developer_journey_trackings t
             LEFT JOIN developer_journeys j ON t.journey_id = j.id
             LEFT JOIN developer_journey_tutorials tut ON t.tutorial_id = tut.id
             WHERE t.developer_id = $1
             ORDER BY t.last_viewed DESC`,
      values: [userId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = TrackingsService;
