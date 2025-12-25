export function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      course_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      credits INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cohorts (
      cohort_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT,
      planned_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      teacher_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      home_department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS slots (
      slot_id INTEGER PRIMARY KEY,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_prerequisites (
      course_id INTEGER NOT NULL,
      prerequisite_course_id INTEGER NOT NULL,
      PRIMARY KEY (course_id, prerequisite_course_id)
    );

    CREATE TABLE IF NOT EXISTS teacher_slot_unavailability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER,
      slot_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, slot_id)
    );

    CREATE TABLE IF NOT EXISTS cohort_slot_courses (
      cohort_slot_course_id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      cohort_id INTEGER,
      teachers TEXT,
      slot_span INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id, slot_id, cohort_id)
    );

    CREATE TABLE IF NOT EXISTS slot_days (
      slot_day_id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_id INTEGER NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_slot_days (
      course_slot_day_id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_slot_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS course_run_slots (
      run_slot_id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      sequence INTEGER DEFAULT 1,
      UNIQUE(run_id, slot_id)
    );

    CREATE TABLE IF NOT EXISTS teacher_day_unavailability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      slot_day_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, slot_day_id)
    );

    CREATE TABLE IF NOT EXISTS teacher_course_competency (
      teacher_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      PRIMARY KEY (teacher_id, course_id)
    );

    -- One examinator per course (teacher can be examinator for many courses)
    CREATE TABLE IF NOT EXISTS course_examinators (
      course_id INTEGER NOT NULL PRIMARY KEY,
      teacher_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- One kursansvarig (course responsible) per course
    CREATE TABLE IF NOT EXISTS course_kursansvarig (
      course_id INTEGER NOT NULL PRIMARY KEY,
      teacher_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_course_kursansvarig_teacher
    ON course_kursansvarig(teacher_id);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
