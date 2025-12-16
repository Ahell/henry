CREATE TABLE teachers (
    teacher_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    home_department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
CREATE UNIQUE INDEX idx_teachers_unique_name
     ON teachers(LOWER(TRIM(name)));
