export function migrateJointCourseRuns(db) {
  // 1. Create the new parent table
  db.exec(`
    CREATE TABLE IF NOT EXISTS joint_course_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      teachers TEXT,
      slot_span INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id, slot_id)
    );
  `);

  // 2. Add FK column to cohort_slot_courses
  try {
    const tableInfo = db.prepare("PRAGMA table_info(cohort_slot_courses)").all();
    if (!tableInfo.find((c) => c.name === "joint_run_id")) {
      db.exec("ALTER TABLE cohort_slot_courses ADD COLUMN joint_run_id INTEGER");
      console.log("Added joint_run_id column to cohort_slot_courses");
    }
  } catch (err) {
    console.error("Error checking/adding column:", err);
  }

  // 3. Migrate Data
  const rowsToMigrate = db
    .prepare(
      "SELECT * FROM cohort_slot_courses WHERE joint_run_id IS NULL"
    )
    .all();

  if (rowsToMigrate.length === 0) {
    return;
  }

  console.log(`Migrating ${rowsToMigrate.length} rows to JointCourseRun structure...`);

  const insertJointRun = db.prepare(`
    INSERT INTO joint_course_runs (course_id, slot_id, teachers, slot_span)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(course_id, slot_id) DO UPDATE SET
      teachers = excluded.teachers
  `);

  const getJointRun = db.prepare(`
    SELECT id FROM joint_course_runs WHERE course_id = ? AND slot_id = ?
  `);

  const updateChild = db.prepare(`
    UPDATE cohort_slot_courses SET joint_run_id = ? WHERE cohort_slot_course_id = ?
  `);

  // Statements for moving slot overrides
  const getOldSlots = db.prepare("SELECT * FROM course_run_slots WHERE run_id = ?");
  const checkNewSlots = db.prepare("SELECT count(*) as count FROM course_run_slots WHERE run_id = ?");
  const insertNewSlot = db.prepare("INSERT INTO course_run_slots (run_id, slot_id, sequence) VALUES (?, ?, ?)");
  const deleteOldSlots = db.prepare("DELETE FROM course_run_slots WHERE run_id = ?");

  db.transaction(() => {
    for (const row of rowsToMigrate) {
      // 1. Ensure JointRun exists
      insertJointRun.run(
        row.course_id,
        row.slot_id,
        row.teachers,
        row.slot_span || 1
      );

      // 2. Get its ID
      const jointRun = getJointRun.get(row.course_id, row.slot_id);
      
      // 3. Link child
      if (jointRun) {
        updateChild.run(jointRun.id, row.cohort_slot_course_id);

        // 4. Migrate custom slot schedules (course_run_slots)
        // From old run_id (row.cohort_slot_course_id) to new run_id (jointRun.id)
        const oldSlots = getOldSlots.all(row.cohort_slot_course_id);
        if (oldSlots.length > 0) {
            const hasNew = checkNewSlots.get(jointRun.id).count > 0;
            if (!hasNew) {
                // Move them to the new ID
                for (const s of oldSlots) {
                    insertNewSlot.run(jointRun.id, s.slot_id, s.sequence);
                }
            }
            // Always clean up old ones to avoid confusion
            deleteOldSlots.run(row.cohort_slot_course_id);
        }
      }
    }
  })();
  
  console.log("Migration to JointCourseRun complete (including slot overrides).");
}