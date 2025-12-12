const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
});

class TrackingsService {
  constructor() {
    this._pool = pool;
  }

  async logActivity({ journeyId, tutorialId, userId }) {
    const timeNow = new Date().toISOString();

    const checkQuery = {
      text: "SELECT id FROM developer_journey_trackings WHERE developer_id = $1 AND tutorial_id = $2",
      values: [userId, tutorialId],
    };

    const checkResult = await this._pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
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
