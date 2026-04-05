import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { ensureSchema } from "./schema.js";
import { loadRuntimeConfig } from "../config/runtime-config.js";

export function createDatabase() {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  db.pragma("busy_timeout = 5000");
  ensureSchema(db);
  return db;
}

function resolveDbPath() {
  const runtime = loadRuntimeConfig();
  const resolved = runtime.dbPath;
  ensureParentDir(resolved);
  return resolved;
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}
