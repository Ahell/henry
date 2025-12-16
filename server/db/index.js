import { createDatabase } from "./connection.js";
import { runAllMigrations } from "./migrations.js";
import createDbHelpers from "./helpers.js";

const DEFAULT_SLOT_LENGTH_DAYS = 28;

const db = createDatabase();
const helpers = createDbHelpers(db);
const {
  getSortedSlots,
  computeCourseSlotSpan,
  getConsecutiveSlotIds,
  ensureSlotDaysForSlot,
  upsertRunSlots,
} = helpers;

// Run migrations after setup
runAllMigrations(db, helpers, DEFAULT_SLOT_LENGTH_DAYS);

export {
  db,
  DEFAULT_SLOT_LENGTH_DAYS,
  getSortedSlots,
  computeCourseSlotSpan,
  getConsecutiveSlotIds,
  ensureSlotDaysForSlot,
  upsertRunSlots,
};
