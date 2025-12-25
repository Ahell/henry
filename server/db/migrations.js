import { migrateRemoveAllOrphanedRecords } from "./migrations/orphaned_cleanup.js";
import { migrateJointCourseRuns } from "./migrations/joint_runs.js";
import { migrateAddKursansvarig } from "./migrations/add_kursansvarig.js";
import { migrateNormalizeTeachers } from "./migrations/normalize_teachers.js";
import { migrateCleanupTeachersColumn } from "./migrations/cleanup_teachers_column.js";
import { migrateDropUnusedTables } from "./migrations/drop_unused_tables.js";

// Main runner: Executes all migrations in order
export function runAllMigrations(db, helpers, DEFAULT_SLOT_LENGTH_DAYS) {
  // Drop unused table
  // db.exec("DROP TABLE IF EXISTS teacher_courses;");
  // db.exec("DROP TABLE IF EXISTS cohort_slot_courses_tmp;");

  // Ensure new columns exist after deploy
  // ensureColumn(db, "course_slot_days", "is_default", "INTEGER DEFAULT 0");
  // ensureColumn(db, "course_slot_days", "active", "INTEGER DEFAULT 1");
  // ensureColumn(db, "cohort_slot_courses", "slot_span", "INTEGER DEFAULT 1");

  // migrateBackfillSlotSpan(db, helpers);
  migrateDropUnusedTables(db);
  migrateJointCourseRuns(db);
  migrateNormalizeTeachers(db);
  migrateAddKursansvarig(db);
  migrateCleanupTeachersColumn(db);
  migrateRemoveAllOrphanedRecords(db);
  // migrateDeduplicateAll(db, helpers);
}
