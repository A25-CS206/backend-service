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

  async addJourney({ name, summary, difficulty, instructorId }) {
    const id = `journey-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: `INSERT INTO developer_journeys 
             (id, name, summary, difficulty, instructor_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id`,
      values: [id, name, summary, difficulty, instructorId, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Gagal menambahkan kelas (Journey).");
    }

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
      text: `SELECT j.*, u.display_name as instructor_name 
             FROM developer_journeys j
             LEFT JOIN users u ON j.instructor_id = u.id
             WHERE j.id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Kelas tidak ditemukan");
    }

    return result.rows[0];
  }
}

module.exports = JourneysService;
