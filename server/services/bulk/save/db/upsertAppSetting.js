import { db } from "../../../../db/index.js";

export function upsertAppSetting(key, value) {
  if (typeof key !== "string" || key.trim() === "") return;
  if (typeof value !== "string") return;

  db.prepare(
    `
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
    `
  ).run(key, value);
}

