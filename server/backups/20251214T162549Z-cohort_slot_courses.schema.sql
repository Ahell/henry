CREATE TABLE cohort_slot_courses (
    cohort_slot_course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    cohort_id INTEGER,
    teachers TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, slot_span INTEGER DEFAULT 1,
    UNIQUE(course_id, slot_id, cohort_id)
  );
CREATE UNIQUE INDEX idx_cohort_slot_courses_unique_triple
     ON cohort_slot_courses(course_id, slot_id, COALESCE(cohort_id, -1));
