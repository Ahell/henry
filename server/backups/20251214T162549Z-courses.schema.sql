CREATE TABLE IF NOT EXISTS "courses" (
        course_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT COLLATE NOCASE UNIQUE,
        credits INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
