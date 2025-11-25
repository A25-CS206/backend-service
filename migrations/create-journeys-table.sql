/*
  Tabel Developer Journeys (Kelas)
  Menyimpan data kelas seperti judul, kesulitan, dan instruktur.
*/

CREATE TABLE developer_journeys (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    summary TEXT,
    difficulty VARCHAR(50), -- contoh: 'beginner', 'intermediate'
    instructor_id VARCHAR(50), -- FK ke tabel users
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    -- Membuat Relasi: Kelas harus punya Instruktur (User)
    CONSTRAINT fk_instructor 
      FOREIGN KEY(instructor_id) 
      REFERENCES users(id) 
      ON DELETE SET NULL
);