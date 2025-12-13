CREATE TABLE IF NOT EXISTS developer_journeys (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    summary TEXT,
    difficulty VARCHAR(50), -- 'beginner', 'intermediate', 'expert'
    instructor_id VARCHAR(50),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    CONSTRAINT fk_instructor 
      FOREIGN KEY(instructor_id) REFERENCES users(id) ON DELETE SET NULL
);