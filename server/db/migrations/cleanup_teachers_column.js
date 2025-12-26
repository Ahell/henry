export function migrateCleanupTeachersColumn(db) {
  // Check if column exists
  const tableInfo = db.prepare("PRAGMA table_info(joint_course_runs)").all();
  const hasTeachers = tableInfo.some((c) => c.name === "teachers");

  if (!hasTeachers) {
    // console.log("Column 'teachers' already removed from joint_course_runs.");
    return;
  }

  console.log("Dropping column 'teachers' from joint_course_runs...");
  try {
    db.exec("ALTER TABLE joint_course_runs DROP COLUMN teachers");
    console.log("Column dropped successfully.");
  } catch (err) {
    console.error("Failed to drop column (sqlite version might be too old?):", err);
    // Fallback? No, just fail for now. The code is already updated to ignore it.
  }
}
