// Normalization migrations

// General function to remove orphaned records from any table
export function migrateRemoveOrphanedRecords(db, tableName, foreignKeyChecks) {
  const conditions = foreignKeyChecks
    .map(
      (check) =>
        `${check.column} NOT IN (SELECT ${check.refColumn} FROM ${check.refTable})`
    )
    .join(" OR ");

  const result = db
    .prepare(`DELETE FROM ${tableName} WHERE ${conditions}`)
    .run();

  if (result.changes > 0) {
    console.log(
      `Cleaning up ${result.changes} orphaned rows from ${tableName}`
    );
  }
}

// Consolidated function that handles all orphaned record removal
export function migrateRemoveAllOrphanedRecords(db) {
  const orphanedChecks = [
    {
      table: "cohort_slot_courses",
      checks: [
        { column: "course_id", refTable: "courses", refColumn: "course_id" },
        { column: "slot_id", refTable: "slots", refColumn: "slot_id" },
        { column: "cohort_id", refTable: "cohorts", refColumn: "cohort_id" },
      ],
    },
    {
      table: "course_prerequisites",
      checks: [
        { column: "course_id", refTable: "courses", refColumn: "course_id" },
        {
          column: "prerequisite_course_id",
          refTable: "courses",
          refColumn: "course_id",
        },
      ],
    },
    {
      table: "course_run_slots",
      checks: [
        {
          column: "run_id",
          refTable: "cohort_slot_courses",
          refColumn: "cohort_slot_course_id",
        },
        { column: "slot_id", refTable: "slots", refColumn: "slot_id" },
      ],
    },
    {
      table: "course_slot_days",
      checks: [
        {
          column: "course_slot_id",
          refTable: "cohort_slot_courses",
          refColumn: "cohort_slot_course_id",
        },
      ],
    },
    {
      table: "slot_days",
      checks: [{ column: "slot_id", refTable: "slots", refColumn: "slot_id" }],
    },
    {
      table: "teacher_course_competency",
      checks: [
        { column: "teacher_id", refTable: "teachers", refColumn: "teacher_id" },
        { column: "course_id", refTable: "courses", refColumn: "course_id" },
      ],
    },
    {
      table: "teacher_day_unavailability",
      checks: [
        { column: "teacher_id", refTable: "teachers", refColumn: "teacher_id" },
        {
          column: "slot_day_id",
          refTable: "slot_days",
          refColumn: "slot_day_id",
        },
      ],
    },
    {
      table: "teacher_slot_unavailability",
      checks: [
        { column: "teacher_id", refTable: "teachers", refColumn: "teacher_id" },
        { column: "slot_id", refTable: "slots", refColumn: "slot_id" },
      ],
    },
  ];

  orphanedChecks.forEach(({ table, checks }) => {
    migrateRemoveOrphanedRecords(db, table, checks);
  });
}
