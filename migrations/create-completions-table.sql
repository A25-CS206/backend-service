CREATE TABLE developer_journey_completions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    journey_id VARCHAR(50) NOT NULL,
    
    enrolling_times INT DEFAULT 1,      
    study_duration INT,                 
    avg_submission_rating DECIMAL(3,2), 
    
    created_at TEXT NOT NULL,           
    updated_at TEXT NOT NULL,

    CONSTRAINT fk_completion_user 
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_completion_journey 
      FOREIGN KEY(journey_id) REFERENCES developer_journeys(id) ON DELETE CASCADE
);