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
  // Preferred architecture: keep writable runtime data outside source directories.
  // This avoids dev watchers restarting on every DB write.
  const preferredPath = join(__dirname, "..", "var", "henry.db");
  const legacyPath = join(__dirname, "henry.db"); // historical location
  const legacyRootPath = join(__dirname, "..", "henry.db"); // accidental root file

  const explicit = process.env.HENRY_DB_PATH;
  if (explicit) {
    const absolute = path.isAbsolute(explicit)
      ? explicit
      : path.resolve(process.cwd(), explicit);
    ensureParentDir(absolute);
    return absolute;
  }

  ensureParentDir(preferredPath);

  // Migrate legacy DB to the preferred location if it exists (and the preferred doesn't).
  if (!fs.existsSync(preferredPath)) {
    const candidate = pickExistingDb([legacyPath, legacyRootPath]);
    if (candidate) {
      try {
        fs.renameSync(candidate, preferredPath);
      } catch (e) {
        // If we cannot move it (permissions, locked file), keep using the legacy path.
        return candidate;
      }
    }
  }

  return preferredPath;
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function pickExistingDb(paths) {
  for (const p of paths) {
    try {
      if (!fs.existsSync(p)) continue;
      const stat = fs.statSync(p);
      if (stat.isFile() && stat.size > 0) return p;
    } catch {
      // ignore
    }
  }
  return null;
}
