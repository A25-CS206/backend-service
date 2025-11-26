/* Tabel Exam Registrations (Sesi Ujian) */
CREATE TABLE exam_registrations (
    id VARCHAR(50) PRIMARY KEY,
    tutorial_id VARCHAR(50) NOT NULL,   
    examinees_id VARCHAR(50) NOT NULL,  
    
    status VARCHAR(50) DEFAULT 'ongoing', 
    exam_finished_at TEXT,              
    
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    CONSTRAINT fk_exam_tutorial 
      FOREIGN KEY(tutorial_id) REFERENCES developer_journey_tutorials(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_examinee 
      FOREIGN KEY(examinees_id) REFERENCES users(id) ON DELETE CASCADE
);

/* Tabel Exam Results (Nilai Akhir) */
CREATE TABLE exam_results (
    id VARCHAR(50) PRIMARY KEY,
    exam_registration_id VARCHAR(50) NOT NULL,
    
    total_questions INT,
    score INT,             
    is_passed BOOLEAN,     
    
    created_at TEXT NOT NULL,

    CONSTRAINT fk_result_registration 
      FOREIGN KEY(exam_registration_id) REFERENCES exam_registrations(id) ON DELETE CASCADE
);