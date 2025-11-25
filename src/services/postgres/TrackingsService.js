const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");

class TrackingsService {
  constructor() {
    const isSsl = process.env.PGSSLMODE === "require";

    this._pool = new Pool({
      ssl: isSsl
        ? {
            rejectUnauthorized: false,
          }
        : false,
    });
  }

  async logActivity({ journeyId, tutorialId, userId }) {
    const timeNow = new Date().toISOString();

    // 1. Cek dulu, apakah user ini sudah pernah buka materi ini?
    const checkQuery = {
      text: "SELECT id FROM developer_journey_trackings WHERE developer_id = $1 AND tutorial_id = $2",
      values: [userId, tutorialId],
    };

    const checkResult = await this._pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      // KASUS A: Sudah pernah buka -> Update last_viewed saja
      const updateQuery = {
        text: "UPDATE developer_journey_trackings SET last_viewed = $1 WHERE developer_id = $2 AND tutorial_id = $3 RETURNING id",
        values: [timeNow, userId, tutorialId],
      };
      const result = await this._pool.query(updateQuery);
      return result.rows[0].id;
    } else {
      // KASUS B: Baru pertama kali buka -> Insert data baru
      const id = `track-${nanoid(16)}`;
      const insertQuery = {
        text: `INSERT INTO developer_journey_trackings 
               (id, journey_id, tutorial_id, developer_id, status, first_opened_at, last_viewed) 
               VALUES($1, $2, $3, $4, 'in_progress', $5, $5) 
               RETURNING id`,
        values: [id, journeyId, tutorialId, userId, timeNow],
      };

      const result = await this._pool.query(insertQuery);

      if (!result.rows[0].id) {
        throw new InvariantError("Gagal mencatat aktivitas.");
      }
      return result.rows[0].id;
    }
  }

  async getStudentActivities(userId) {
    const query = {
      text: `SELECT t.id, j.name as journey_name, tut.title as tutorial_title, t.status, t.last_viewed 
             FROM developer_journey_trackings t
             JOIN developer_journeys j ON t.journey_id = j.id
             JOIN developer_journey_tutorials tut ON t.tutorial_id = tut.id
             WHERE t.developer_id = $1
             ORDER BY t.last_viewed DESC`,
      values: [userId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = TrackingsService;
