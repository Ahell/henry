export function migrateDropUnusedTables(db) {
  db.exec(`
    DROP TABLE IF EXISTS course_run_cohorts;
    DROP TABLE IF EXISTS course_run_teachers;
    DROP TABLE IF EXISTS course_run_days;
    DROP TABLE IF EXISTS teacher_courses_staff;
  `);
}
