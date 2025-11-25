const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");

class JourneysService {
  constructor() {
    this._pool = new Pool();
  }

  // Menambah Kelas Baru
  async addJourney({ name, summary, difficulty, instructorId }) {
    const id = `journey-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: "INSERT INTO developer_journeys VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      values: [id, name, summary, difficulty, instructorId, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Gagal menambahkan kelas (Journey).");
    }

    return result.rows[0].id;
  }

  // Mengambil Semua Daftar Kelas
  async getJourneys() {
    // Kita JOIN dengan tabel users supaya dapat nama instrukturnya
    const query = {
      text: `SELECT j.id, j.name, j.difficulty, u.display_name as instructor_name 
             FROM developer_journeys j
             LEFT JOIN users u ON j.instructor_id = u.id`,
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  // Mengambil Detail Satu Kelas
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
