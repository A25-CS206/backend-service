const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");

class TrackingsService {
  constructor(pool) {
    // KOREKSI: Kita terima pool dari server.js, bukan bikin baru.
    this._pool = pool;
  }

  // --- 1. FITUR DASHBOARD (Stats & Trend) ---
  async getDashboardStatistics(userId) {
    // A. Statistik Utama (Total Jam, Modul Selesai, Rata-rata Nilai)
    // Kita ambil data dari tabel 'completions' karena itu data valid kelulusan
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

    const resStats = await this._pool.query(queryStats);
    const stats = resStats.rows[0];

    // B. Learning Trend (Aktivitas 7 Hari Terakhir)
    // Kita hitung berapa kali user "logActivity" per hari
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

    const resTrend = await this._pool.query(queryTrend);

    // Format Data untuk Frontend
    return {
      total_study_hours: (parseInt(stats.total_seconds) / 3600).toFixed(1), // Detik -> Jam
      modules_completed: parseInt(stats.modules_completed),
      avg_quiz_score: parseFloat(stats.avg_score).toFixed(1),
      learning_trend: resTrend.rows.map((row) => ({
        day: row.day_name.trim(), // Senin, Selasa...
        value: parseInt(row.activity_count),
      })),
    };
  }

  // --- 2. FITUR MY COURSES (Status Completed/In Progress) ---
  async getMyCourses(userId) {
    // Logic: Ambil Journey yang ada di Tracking, lalu cek di Completion
    // DISTINCT ON (j.id) supaya kursus tidak muncul dobel kalau user buka banyak bab
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

    // Mapping ke camelCase buat Frontend
    return result.rows.map((row) => ({
      id: row.id,
      title: row.name,
      image: row.image_path,
      status: row.status,
      lastOpened: row.last_viewed,
      finishedAt: row.finished_at,
    }));
  }

  // --- 3. LOG AKTIVITAS (Core Tracking) ---
  async logActivity({ journeyId, tutorialId, userId }) {
    const timeNow = new Date().toISOString();

    const checkQuery = {
      text: "SELECT id FROM developer_journey_trackings WHERE developer_id = $1 AND tutorial_id = $2",
      values: [userId, tutorialId],
    };

    const checkResult = await this._pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      // Update last_viewed
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
      // Insert Baru
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

  // --- 4. LIST HISTORY DETAIL (Opsional) ---
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
