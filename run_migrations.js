import { db } from "./server/db/index.js";
import { runAllMigrations } from "./server/db/migrations.js";
import createDbHelpers from "./server/db/helpers.js";

const helpers = createDbHelpers(db);
const DEFAULT_SLOT_LENGTH_DAYS = 28;

console.log("Running migrations...");
try {
    runAllMigrations(db, helpers, DEFAULT_SLOT_LENGTH_DAYS);
    console.log("Migrations completed successfully.");
} catch (error) {
    console.error("Migration failed:", error);
}
