/*
  1. Tabel Tutorials (Materi Belajar)
  Menyimpan daftar bab/modul dalam satu kelas.
*/
CREATE TABLE developer_journey_tutorials (
    id VARCHAR(50) PRIMARY KEY,
    developer_journey_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CONSTRAINT fk_journey_tutorial 
      FOREIGN KEY(developer_journey_id) 
      REFERENCES developer_journeys(id) 
      ON DELETE CASCADE
);

/*
  2. Tabel Trackings (Rekaman Aktivitas)
  Mencatat kapan user membuka materi. Data ini krusial buat AI!
*/
CREATE TABLE developer_journey_trackings (
    id VARCHAR(50) PRIMARY KEY,
    journey_id VARCHAR(50) NOT NULL,
    tutorial_id VARCHAR(50) NOT NULL,
    developer_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed'
    first_opened_at TEXT NOT NULL,
    last_viewed TEXT NOT NULL,
    completed_at TEXT,
    
    CONSTRAINT fk_tracking_journey 
      FOREIGN KEY(journey_id) 
      REFERENCES developer_journeys(id) 
      ON DELETE CASCADE,
    CONSTRAINT fk_tracking_tutorial 
      FOREIGN KEY(tutorial_id) 
      REFERENCES developer_journey_tutorials(id) 
      ON DELETE CASCADE,
    CONSTRAINT fk_tracking_user 
      FOREIGN KEY(developer_id) 
      REFERENCES users(id) 
      ON DELETE CASCADE
);