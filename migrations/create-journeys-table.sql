/* =========================================================
   Table: developer_journeys (Master Kelas/Journey)
   ========================================================= */

DROP TABLE IF EXISTS developer_journeys CASCADE;

CREATE TABLE developer_journeys (
    id VARCHAR(50) PRIMARY KEY,
    
    /* --- 1. Info Dasar --- */
    name VARCHAR(255) NOT NULL,
    summary TEXT,                 -- Ringkasan pendek (untuk card)
    description TEXT,             -- Deskripsi panjang (untuk halaman detail)
    difficulty VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced
    type VARCHAR(50) DEFAULT 'regular',        -- regular, screening, bootcamp
    
    /* --- 2. Visual & Media --- */
    image_path TEXT,              -- Cover kecil (thumbnail)
    banner_path TEXT,             -- Cover lebar (header detail)
    logo_path TEXT,               -- Logo khusus jika ada (misal logo partner)
    media_cover TEXT,             -- ID video preview/trailer
    partner_logo TEXT,            -- Logo partner penyusun materi
    
    /* --- 3. Gamification (XP & Points) --- */
    point INT DEFAULT 0,          -- Poin reward saat lulus
    xp INT DEFAULT 0,             -- XP reward saat lulus
    required_point INT DEFAULT 0, -- Syarat poin untuk ambil kelas ini
    required_xp INT DEFAULT 0,    -- Syarat XP untuk ambil kelas ini
    
    /* --- 4. Estimasi & Metode --- */
    hours_to_study INT DEFAULT 0, -- Estimasi jam belajar
    teaching_methods TEXT,        -- Disimpan sebagai string (ex: "video,quiz,submission")
    
    /* --- 5. Bisnis & Status --- */
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
    listed BOOLEAN DEFAULT true,        -- Tampil di katalog atau hidden?
    discount DECIMAL(10, 2) DEFAULT 0,  -- Nominal/Persen diskon
    discount_ends_at TEXT,              -- Kapan diskon berakhir
    reviewer_incentive DECIMAL(10, 2),  -- Bayaran untuk reviewer per submission
    
    /* --- 6. Relasi & User --- */
    instructor_id VARCHAR(50),    -- Pengajar Utama
    reviewer_id VARCHAR(50),      -- Reviewer Default (Opsional)
    platform_id VARCHAR(50),      -- Jika multi-platform (Opsional)
    installment_plan_id VARCHAR(50), -- ID Skema cicilan (jika ada)
    
    /* --- 7. Pengaturan Waktu --- */
    deadline INT,                 -- Batas waktu penyelesaian (dalam hari)
    trial_deadline INT,           -- Batas waktu akses trial (dalam hari)
    
    /* --- 8. Lainnya --- */
    graduation TEXT,              -- Syarat kelulusan / Keterangan sertifikat
    video_subtitle TEXT,          -- URL/Path file subtitle video intro
    position INT DEFAULT 0,       -- Urutan sorting custom
    
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    /* Constraints */
    CONSTRAINT fk_journey_instructor 
        FOREIGN KEY(instructor_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_journey_reviewer 
        FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);