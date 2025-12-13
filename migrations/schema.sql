/* =========================================
   1. Tabel Users (Induk) - VERSI FINAL
   Mencakup profile, role, dan status verifikasi.
   ========================================= */

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    
    /* Informasi Login */
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) DEFAULT 'developer', -- 'developer', 'admin', 'instructor'
    
    /* Profil Umum */
    display_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),            -- Diupdate jadi VARCHAR(20) sesuai request
    image_path TEXT,
    
    /* Lokasi */
    city VARCHAR(100),
    city_id INT,                  -- Kolom Baru
    
    /* Status Akun */
    user_verification_status BOOLEAN DEFAULT FALSE, -- Kolom Baru
    
    /* System Timestamps */
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    /* Soft Delete */
    deleted_at TEXT               -- Kolom Baru (Untuk fitur hapus akun sementara/soft delete)
);