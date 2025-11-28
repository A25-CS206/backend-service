const { Pool } = require("pg");
const axios = require("axios"); // Client HTTP buat nembak API ML

class InsightsService {
  constructor() {
    // Logic connection string untuk Vercel/Neon
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
    // 1. QUERY DATABASE: Hitung Statistik Nyata
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

    // Cek data tracking, jika kosong, kembalikan default
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
    const loginVariance = 5.0; // Placeholder for variance (complex SQL)
    const avgDuration = 15.0; // Placeholder for avg duration

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
      // GANTI URL INI DENGAN URL API ML KAMU YANG LIVE!
      const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8000/predict";

      const response = await axios.post(mlUrl, payloadML);

      // Ambil hasil prediksi (harus berupa List karena mode batch)
      const prediction = response.data[0];

      // 5. SIMPAN HASIL PREDIKSI KE DB
      await this._pool.query(
        "UPDATE users SET user_role = $1 WHERE id = $2", // Update kolom user_role
        [prediction.learner_type, userId]
      );

      return prediction;
    } catch (error) {
      console.error("ML Service Error:", error.message);
      // Fallback jika ML mati
      return {
        cluster: -99,
        learner_type: "Unidentified",
        description: "Gagal menghubungi layanan AI. Silakan coba lagi nanti.",
      };
    }
  }
}

module.exports = InsightsService;
