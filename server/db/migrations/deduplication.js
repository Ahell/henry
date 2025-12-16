// Minimal connection-table-only deduplication
// Removes exact duplicate rows in junction/connection tables (keeps lowest id/rowid)

export function migrateDeduplicateConnections(db) {
  const tables = [
    {
      table: "course_prerequisites",
      keys: ["course_id", "prerequisite_course_id"],
      pk: null,
    },
    {
      table: "cohort_slot_courses",
      keys: ["cohort_id", "slot_id", "course_id", "teachers", "slot_span"],
      pk: "cohort_slot_course_id",
    },
    {
      table: "course_slot_days",
      keys: ["course_slot_id", "date"],
      pk: "course_slot_day_id",
    },
    {
      table: "teacher_course_competency",
      keys: ["teacher_id", "course_id"],
      pk: null,
    },
    {
      table: "teacher_courses_staff",
      keys: ["teacher_id", "course_id"],
      pk: null,
    },
    {
      table: "teacher_day_unavailability",
      keys: ["teacher_id", "slot_day_id"],
      pk: "id",
    },
    {
      table: "teacher_slot_unavailability",
      keys: ["teacher_id", "slot_id"],
      pk: "id",
    },
    // Add other connection tables here as needed
  ];

  tables.forEach(({ table, keys, pk }) => {
    const exists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(table);
    if (!exists) return;

    // Verify keys exist on table
    const cols = db
      .prepare(`PRAGMA table_info(${table})`)
      .all()
      .map((c) => c.name);
    const missing = keys.filter((k) => !cols.includes(k));
    if (missing.length) {
      console.warn(`Skipping ${table}: missing columns ${missing.join(", ")}`);
      return;
    }

    const groupSql = `SELECT ${keys.join(
      ", "
    )}, COUNT(*) as cnt FROM ${table} GROUP BY ${keys.join(
      ", "
    )} HAVING cnt > 1`;
    const groups = db.prepare(groupSql).all();
    if (!groups || groups.length === 0) return;

    let removed = 0;

    // Run per-table transaction to keep scope narrow
    db.transaction(() => {
      groups.forEach((g) => {
        const params = keys.map((k) => g[k]);
        const where = keys.map((k) => `${k} = ?`).join(" AND ");
        const selectSql = pk
          ? `SELECT ${pk} FROM ${table} WHERE ${where} ORDER BY ${pk} ASC`
          : `SELECT rowid FROM ${table} WHERE ${where} ORDER BY rowid ASC`;
        const rows = db.prepare(selectSql).all(...params);
        const toDelete = rows.slice(1).map((r) => (pk ? r[pk] : r.rowid));
        if (toDelete.length === 0) return;
        const placeholders = toDelete.map(() => "?").join(",");
        const whereDel = pk
          ? `${pk} IN (${placeholders})`
          : `rowid IN (${placeholders})`;
        db.prepare(`DELETE FROM ${table} WHERE ${whereDel}`).run(...toDelete);
        removed += toDelete.length;
      });
    })();

    if (removed > 0) {
      console.log(`Removed ${removed} duplicate rows from ${table}`);
    }
  });
}

export function migrateDeduplicateAll(db) {
  migrateDeduplicateConnections(db);
}
