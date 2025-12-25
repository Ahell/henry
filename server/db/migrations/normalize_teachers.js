export function migrateNormalizeTeachers(db) {
  // 1. Create the new junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS joint_course_run_teachers (
      joint_run_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (joint_run_id, teacher_id),
      FOREIGN KEY (joint_run_id) REFERENCES joint_course_runs(id) ON DELETE CASCADE
    );
  `);

  // 2. Check if we need to migrate data
  // We can check if the new table is empty but the old table has data
  const hasNewData = db.prepare("SELECT count(*) as count FROM joint_course_run_teachers").get().count > 0;
  if (hasNewData) {
    console.log("joint_course_run_teachers already populated, skipping migration.");
    return;
  }

  const runs = db.prepare("SELECT id, teachers FROM joint_course_runs").all();
  if (runs.length === 0) {
    return;
  }

  console.log(`Migrating teachers for ${runs.length} joint runs...`);

  const insertLink = db.prepare(`
    INSERT OR IGNORE INTO joint_course_run_teachers (joint_run_id, teacher_id)
    VALUES (?, ?)
  `);

  db.transaction(() => {
    for (const run of runs) {
      if (!run.teachers) continue;
      try {
        const teachers = JSON.parse(run.teachers);
        if (Array.isArray(teachers)) {
          for (const tid of teachers) {
            if (tid) {
              insertLink.run(run.id, tid);
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to parse teachers for run ${run.id}: ${run.teachers}`);
      }
    }
  })();

  console.log("Migration to joint_course_run_teachers complete.");
}
