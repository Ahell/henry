CREATE TABLE course_run_slots (
    run_slot_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    sequence INTEGER DEFAULT 1,
    UNIQUE(run_id, slot_id)
  );
