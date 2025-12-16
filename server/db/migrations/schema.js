// Schema-related migrations and helpers
export function ensureColumn(db, table, column, typeWithDefault) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const hasCol = info.some((c) => c.name === column);
  if (!hasCol) {
    db.prepare(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${typeWithDefault}`
    ).run();
  }
}
