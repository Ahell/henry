import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ensureSchema } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createDatabase() {
  const db = new Database(join(__dirname, "henry.db"));
  db.pragma("busy_timeout = 5000");
  ensureSchema(db);
  return db;
}
