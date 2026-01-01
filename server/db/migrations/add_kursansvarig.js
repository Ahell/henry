export function migrateAddKursansvarig(db) {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(joint_course_runs)").all();
    if (!tableInfo.find((c) => c.name === "kursansvarig_id")) {
      db.exec("ALTER TABLE joint_course_runs ADD COLUMN kursansvarig_id INTEGER");
    }
  } catch (err) {
    console.error("Error adding kursansvarig_id column:", err);
  }
}
