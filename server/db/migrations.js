import { normalizeCourseCode, normalizeCredits } from "../utils/index.js";
import { ensureColumn } from "./migrations/schema.js";
import { migrateDeduplicateAll } from "./migrations/deduplication.js";
import { migrateRemoveAllOrphanedRecords } from "./migrations/orphaned_cleanup.js";
import { migrateBackfillSlotSpan } from "./migrations/data.js";

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
  migrateRemoveAllOrphanedRecords(db);
  // migrateDeduplicateAll(db, helpers);
}
