CREATE TABLE developer_journey_submissions (
    id VARCHAR(50) PRIMARY KEY,
    journey_id VARCHAR(50) NOT NULL,
    submitter_id VARCHAR(50) NOT NULL, 
    reviewer_id VARCHAR(50),           
    
    app_link TEXT,                     
    app_comment TEXT,                  
    
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, passed, failed
    rating INT,                        
    admin_comment TEXT,                
    
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    CONSTRAINT fk_submission_journey 
      FOREIGN KEY(journey_id) REFERENCES developer_journeys(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_submitter 
      FOREIGN KEY(submitter_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_reviewer 
      FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);