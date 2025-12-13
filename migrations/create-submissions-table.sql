/* =========================================================
   4. Tabel Submission Proyek (developer_journey_submissions)
   Menyimpan data pengumpulan tugas/proyek siswa, 
   termasuk versi revisi, hasil review, dan feedback.
   ========================================================= */

CREATE TABLE IF NOT EXISTS developer_journey_submissions (
    id VARCHAR(50) PRIMARY KEY,
    
    /* Relasi Utama */
    journey_id VARCHAR(50) NOT NULL,       -- FK ke Journey (Kelas)
    quiz_id VARCHAR(50) NOT NULL,          -- FK ke Materi/Quiz spesifik (Tutorial ID)
    submitter_id VARCHAR(50) NOT NULL,     -- FK ke User (Siswa)
    reviewer_id VARCHAR(50),               -- FK ke User (Reviewer yang ditugaskan)
    
    /* Detail Submission */
    version_id INT DEFAULT 1,              -- Revisi ke-berapa (1, 2, 3...)
    app_link TEXT,                         -- Link Repository/Deploy
    app_comment TEXT,                      -- Catatan siswa (kredensial, cara uji)
    as_trial_subscriber BOOLEAN DEFAULT false, -- Flag apakah dikirim oleh akun trial
    
    /* Status & Penilaian Otomatis */
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, passed, failed, revision_requested
    pass_auto_checker BOOLEAN,             -- Apakah lulus pengecekan otomatis sistem?
    
    /* Proses Review Manual */
    current_reviewer VARCHAR(50),          -- ID/Nama Reviewer yang sedang aktif memegang tiket ini
    first_opened_at TEXT,                  -- Waktu pertama kali dibuka reviewer
    started_review_at TEXT,                -- Waktu mulai meninjau
    ended_review_at TEXT,                  -- Waktu selesai meninjau
    submission_duration INT,               -- Durasi pengerjaan/penilaian (dalam detik/menit)
    
    /* Hasil Akhir */
    rating INT,                            -- Nilai akhir (Skala 1-5 atau 0-100)
    note TEXT,                             -- Feedback/Catatan untuk siswa
    admin_comment TEXT,                    -- Catatan internal admin (opsional)

    /* System Timestamps */
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    /* Constraints */
    CONSTRAINT fk_submission_journey 
      FOREIGN KEY(journey_id) REFERENCES developer_journeys(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_submitter 
      FOREIGN KEY(submitter_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_reviewer 
      FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    /* Asumsi: quiz_id mengacu pada tabel tutorials */
    CONSTRAINT fk_submission_quiz
      FOREIGN KEY(quiz_id) REFERENCES developer_journey_tutorials(id) ON DELETE CASCADE
);