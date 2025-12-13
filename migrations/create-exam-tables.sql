/* =========================================================
   1. Tabel Registrasi Ujian (exam_registrations)
   Mencatat sesi ujian siswa, termasuk status, deadline, dan retake.
   ========================================================= */

CREATE TABLE IF NOT EXISTS exam_registrations (
    id VARCHAR(50) PRIMARY KEY,
    
    /* Relasi */
    exam_module_id VARCHAR(50),       -- FK ke modul/paket soal (opsional jika ada tabelnya)
    tutorial_id VARCHAR(50),          -- FK ke tutorial yang memicu ujian
    examinees_id VARCHAR(50) NOT NULL,-- FK ke users (siswa)
    
    /* Status & Waktu */
    status VARCHAR(50) DEFAULT 'ongoing', -- 'ongoing', 'finished', 'expired'
    created_at TEXT NOT NULL,             -- Waktu registrasi dibuat
    updated_at TEXT NOT NULL,             -- Waktu update terakhir
    
    /* Logika Pengerjaan */
    deadline_at TEXT,                     -- Batas waktu submit
    retake_limit_at TEXT,                 -- Cooldown: Kapan boleh ulang ujian
    exam_finished_at TEXT,                -- Kapan siswa klik "Selesai"
    
    /* Soft Delete (History Retake) */
    deleted_at TEXT,                      -- Diisi jika siswa mengulang ujian (ujian lama jadi history)

    /* Constraints */
    CONSTRAINT fk_exam_user 
        FOREIGN KEY(examinees_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_tutorial 
        FOREIGN KEY(tutorial_id) REFERENCES developer_journey_tutorials(id) ON DELETE SET NULL
);

/* =========================================================
   2. Tabel Hasil Ujian (exam_results)
   Menyimpan skor akhir dan detail kelulusan setelah ujian selesai.
   ========================================================= */

CREATE TABLE IF NOT EXISTS exam_results (
    id VARCHAR(50) PRIMARY KEY,
    
    /* Relasi */
    exam_registration_id VARCHAR(50) NOT NULL, -- FK ke tabel registrasi di atas
    
    /* Nilai & Statistik */
    total_questions INT DEFAULT 0,    -- Jumlah soal dalam sesi ini
    score INT DEFAULT 0,              -- Skor akhir (misal: 85)
    is_passed BOOLEAN DEFAULT false,  -- Apakah lulus ambang batas?
    
    /* Waktu */
    created_at TEXT NOT NULL,         -- Waktu hasil keluar (biasanya sama dgn exam_finished_at)
    look_report_at TEXT,              -- Kapan siswa melihat detail rapor/hasil ini

    /* Constraints */
    CONSTRAINT fk_result_reg 
        FOREIGN KEY(exam_registration_id) REFERENCES exam_registrations(id) ON DELETE CASCADE
);