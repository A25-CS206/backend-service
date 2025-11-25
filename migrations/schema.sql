/*
  Tabel Users
  Menyimpan data siswa dan instruktur.
*/

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) DEFAULT 'developer', -- 'developer' atau 'admin'
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);