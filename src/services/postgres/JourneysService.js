const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
});

class JourneysService {
  constructor() {
    this._pool = pool;
  }

  // --- CRUD JOURNEY BASIC ---
  async addJourney({ name, summary, difficulty, instructorId }) {
    const id = `journey-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: `INSERT INTO developer_journeys VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      values: [id, name, summary, difficulty, instructorId, createdAt, updatedAt],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) throw new InvariantError("Gagal menambahkan kelas.");
    return result.rows[0].id;
  }

  async getJourneys() {
    const query = {
      text: `SELECT j.id, j.name, j.difficulty, j.summary, u.display_name as instructor_name 
             FROM developer_journeys j
             LEFT JOIN users u ON j.instructor_id = u.id`,
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getJourneyById(id) {
    const query = {
      text: `SELECT j.*, u.display_name as instructor_name FROM developer_journeys j
             LEFT JOIN users u ON j.instructor_id = u.id WHERE j.id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) throw new NotFoundError("Kelas tidak ditemukan");
    return result.rows[0];
  }

  // --- FEATURE: MY COURSES (BILINGUAL) ---
  async getMyCourses(userId) {
    const query = {
      text: `
        SELECT 
          j.id as journey_id,
          j.name as title,
          c.updated_at as finished_at,
          t_last.last_viewed as last_opened_at,
          (SELECT COUNT(*)::int FROM developer_journey_tutorials WHERE developer_journey_id = j.id) as total_tutorials,
          (SELECT COUNT(*)::int FROM developer_journey_trackings WHERE journey_id = j.id AND developer_id = $1 AND status = 'completed') as completed_tutorials
        FROM developer_journeys j
        JOIN developer_journey_trackings t ON t.journey_id = j.id AND t.developer_id = $1
        LEFT JOIN developer_journey_completions c ON c.journey_id = j.id AND c.user_id = $1
        LEFT JOIN LATERAL (
          SELECT last_viewed FROM developer_journey_trackings 
          WHERE journey_id = j.id AND developer_id = $1 
          ORDER BY last_viewed DESC LIMIT 1
        ) t_last ON true
        GROUP BY j.id, c.updated_at, t_last.last_viewed
      `,
      values: [userId],
    };

    const result = await this._pool.query(query);

    return result.rows.map((row) => {
      const progress =
        row.total_tutorials > 0
          ? Math.round((row.completed_tutorials / row.total_tutorials) * 100)
          : 0;
      const isCompleted = progress === 100;

      return {
        journey_id: row.journey_id,
        title: row.title,
        status: isCompleted ? "completed" : "in_progress",
        progress_percentage: progress,
        last_opened_at: row.last_opened_at,
        finished_at: row.finished_at || null,
        label: {
          id: isCompleted ? "Selesai" : "Sedang Berjalan",
          en: isCompleted ? "Completed" : "In Progress",
        },
      };
    });
  }
}

module.exports = JourneysService;
