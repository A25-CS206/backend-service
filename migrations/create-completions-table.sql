/* =========================================================
   3. Tabel Penyelesaian Journey (developer_journey_completions)
   Mencatat kelulusan siswa pada sebuah kelas (Journey),
   termasuk riwayat pendaftaran ulang (enrolling).
   ========================================================= */

CREATE TABLE IF NOT EXISTS developer_journey_completions (
    id VARCHAR(50) PRIMARY KEY,
    
    /* Relasi */
    user_id VARCHAR(50) NOT NULL,       -- FK ke users (pelajar)
    journey_id VARCHAR(50) NOT NULL,    -- FK ke journey yang diselesaikan
    
    /* Waktu Pencatatan */
    created_at TEXT NOT NULL,           -- Waktu pencatatan dibuat
    updated_at TEXT NOT NULL,           -- Waktu diperbarui
    
    /* Statistik Pendaftaran (Enrollment) */
    enrolling_times INT DEFAULT 1,      -- Jumlah kali mendaftar/mengulang journey
    enrollments_at TEXT,                -- Daftar timestamp pendaftaran (Disimpan sebagai JSON String Array atau CSV)
    last_enrolled_at TEXT,              -- Terakhir kali mendaftar
    
    /* Statistik Belajar */
    study_duration INT,                 -- Total durasi belajar (dalam menit atau detik)
    avg_submission_rating DECIMAL(3,2), -- Rata-rata nilai submission (skala 0.00 - 5.00 atau 0.00 - 10.00)

    /* Constraints */
    CONSTRAINT fk_completion_user 
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_completion_journey 
      FOREIGN KEY(journey_id) REFERENCES developer_journeys(id) ON DELETE CASCADE
);