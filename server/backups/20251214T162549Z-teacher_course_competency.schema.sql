CREATE TABLE IF NOT EXISTS "teacher_course_competency" (
        teacher_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        PRIMARY KEY (teacher_id, course_id)
      );
