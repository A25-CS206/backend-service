const { Pool } = require("pg");
const axios = require("axios"); // WAJIB: npm install axios

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

  async generateStudentInsight(userId) {
    // 1. QUERY DATABASE: Hitung Statistik Nyata (Aggregasi)
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

    // Jika data kosong, return default
    if (parseInt(stats.total_materials) === 0) {
      return {
        cluster: -1,
        learner_type: "New Learner",
        description: "Belum cukup data aktivitas untuk dianalisis.",
      };
    }

    // 2. HITUNG LOGIKA (Feature Engineering)
    const totalMaterials = parseInt(stats.total_materials);

    const start = new Date(stats.first_active);
    const end = new Date(stats.last_active);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const avgMaterialsPerDay = totalMaterials / diffDays;
    const totalWeeks = Math.ceil(diffDays / 7) || 1;
    const avgLoginsPerWeek = parseInt(stats.active_days) / totalWeeks;
    const loginVariance = 5.0; // Placeholder
    const avgDuration = 15.0; // Placeholder

    // 3. SIAPKAN PAYLOAD (Format List [...] sesuai API ML batch)
    const payloadML = [
      {
        avg_materials_per_day: avgMaterialsPerDay,
        total_materials: totalMaterials,
        avg_duration_per_material: avgDuration,
        total_weeks_active: totalWeeks,
        avg_logins_per_week: avgLoginsPerWeek,
        login_weekly_variance: loginVariance,
      },
    ];

    try {
      // 4. TEMBAK API PYTHON (Render/Railway)
      // GANTI URL INI DENGAN URL API ML LIVE KAMU!
      const mlUrl = process.env.ML_SERVICE_URL || "https://ml-learning-insight.up.railway.app/";

      const response = await axios.post(mlUrl, payloadML);

      // Ambil hasil prediksi (hasilnya berupa List, ambil item pertama)
      const prediction = response.data[0];

      // 5. SIMPAN HASIL PREDIKSI KE DB
      await this._pool.query(
        "UPDATE users SET user_role = $1 WHERE id = $2", // Update kolom role/type
        [prediction.learner_type, userId]
      );

      return prediction;
    } catch (error) {
      console.error("ML Service Error:", error.message);
      // Fallback jika ML mati
      return {
        cluster: -99,
        learner_type: "Unidentified",
        description: "Gagal menghubungi layanan AI. Coba lagi nanti.",
      };
    }
  }
}

module.exports = InsightsService;
