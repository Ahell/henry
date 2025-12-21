import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import path from "path";
import { ensureSchema } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createDatabase() {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  db.pragma("busy_timeout = 5000");
  ensureSchema(db);
  return db;
}

function resolveDbPath() {
  // Keep the database outside the server source tree so dev watchers don't restart
  // on every DB write. Canonical location: repo root `henry.db`.
  const preferredPath = join(__dirname, "..", "..", "henry.db");

  const explicit = process.env.HENRY_DB_PATH;
  if (explicit) {
    const absolute = path.isAbsolute(explicit)
      ? explicit
      : path.resolve(process.cwd(), explicit);
    ensureParentDir(absolute);
    return absolute;
  }

  ensureParentDir(preferredPath);
  return preferredPath;
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}
