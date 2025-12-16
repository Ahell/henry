// Deduplication migrations
import { normalizeCourseCode } from "../../utils/index.js";

// Generic deduplication function for all cases
export function migrateDeduplicateGeneric(db, config, helpers = {}) {
  const {
    table,
    keyField,
    keyNormalizer,
    primaryKey,
    uniqueConstraint,
    relatedTables = [],
    rebuildTable = false,
    renumberNames = false,
    namePattern = null,
    compositeKeyFields = null, // For cases like cohort_slot_courses triple deduplication
  } = config;

  // Handle special case: triple-based deduplication (cohort_slot_courses)
  if (compositeKeyFields) {
    return migrateDeduplicateByCompositeKey(db, config);
  }

  // Get all records
  const records = db
    .prepare(`SELECT * FROM ${table} ORDER BY ${primaryKey}`)
    .all();
  if (records.length === 0) return;

  // Create canonical mapping
  const canonicalByKey = new Map();
  records.forEach((record) => {
    const key = keyNormalizer(record);
    const existing = canonicalByKey.get(key);
    if (!existing || record[primaryKey] < existing[primaryKey]) {
      canonicalByKey.set(key, record);
    }
  });

  // Create ID mapping
  const idMapping = new Map();
  records.forEach((record) => {
    const key = keyNormalizer(record);
    const canonical = canonicalByKey.get(key);
    if (canonical && canonical[primaryKey] !== record[primaryKey]) {
      idMapping.set(record[primaryKey], canonical[primaryKey]);
    }
  });

  if (idMapping.size === 0) {
    // Just ensure unique constraint exists
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_unique_${keyField.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )} ON ${table}(${uniqueConstraint
        .replace("UNIQUE(", "")
        .replace(")", "")})`
    ).run();
    return;
  }

  db.transaction(() => {
    // Standard foreign key updates
    relatedTables.forEach(
      ({ table: relTable, columns, isJsonArray = false }) => {
        columns.forEach((column) => {
          if (isJsonArray) {
            // Handle JSON arrays (like teachers in cohort_slot_courses)
            const relRecords = db
              .prepare(
                `SELECT ${
                  relTable === "cohort_slot_courses"
                    ? "cohort_slot_course_id"
                    : "id"
                }, ${column} FROM ${relTable}`
              )
              .all();
            relRecords.forEach((relRecord) => {
              if (!relRecord[column]) return;
              try {
                const parsed = JSON.parse(relRecord[column]);
                if (Array.isArray(parsed)) {
                  const remapped = Array.from(
                    new Set(
                      parsed
                        .map((id) => idMapping.get(id) ?? id)
                        .filter((id) => id != null)
                    )
                  );
                  db.prepare(
                    `UPDATE ${relTable} SET ${column} = ? WHERE ${
                      relTable === "cohort_slot_courses"
                        ? "cohort_slot_course_id"
                        : "id"
                    } = ?`
                  ).run(
                    JSON.stringify(remapped),
                    relRecord[
                      relTable === "cohort_slot_courses"
                        ? "cohort_slot_course_id"
                        : "id"
                    ]
                  );
                }
              } catch (e) {
                // Not valid JSON, skip
              }
            });
          } else {
            // Simple foreign key update
            idMapping.forEach((to, from) => {
              db.prepare(
                `UPDATE ${relTable} SET ${column} = ? WHERE ${column} = ?`
              ).run(to, from);
            });
          }
        });
      }
    );

    if (rebuildTable) {
      // Rebuild table approach (like courses)
      const tempTable = `${table}_tmp`;
      db.prepare(`DROP TABLE IF EXISTS ${tempTable}`).run();
      db.prepare(
        `CREATE TABLE ${tempTable} AS SELECT * FROM ${table} WHERE 0`
      ).run();

      // Insert canonical records
      const columns = Object.keys(records[0]).join(", ");
      const placeholders = Object.keys(records[0])
        .map(() => "?")
        .join(", ");
      const insertStmt = db.prepare(
        `INSERT OR IGNORE INTO ${tempTable} (${columns}) VALUES (${placeholders})`
      );

      canonicalByKey.forEach((record) => {
        insertStmt.run(...Object.values(record));
      });

      db.prepare(`DROP TABLE ${table}`).run();
      db.prepare(`ALTER TABLE ${tempTable} RENAME TO ${table}`).run();
    } else {
      // Delete duplicates approach
      const keepIds = Array.from(canonicalByKey.values()).map(
        (r) => r[primaryKey]
      );
      const placeholders = keepIds.map(() => "?").join(",");
      db.prepare(
        `DELETE FROM ${table} WHERE ${primaryKey} NOT IN (${placeholders})`
      ).run(...keepIds);

      // Renumber names if needed (like cohorts)
      if (renumberNames && namePattern) {
        const sorted = Array.from(canonicalByKey.values()).sort((a, b) => {
          const keyA = keyNormalizer(a);
          const keyB = keyNormalizer(b);
          if (keyA !== keyB) return keyA.localeCompare(keyB);
          return a[primaryKey] - b[primaryKey];
        });

        sorted.forEach((record, idx) => {
          const newName = namePattern.replace("{index}", (idx + 1).toString());
          db.prepare(
            `UPDATE ${table} SET name = ? WHERE ${primaryKey} = ?`
          ).run(newName, record[primaryKey]);
        });
      }
    }

    // Ensure unique constraint exists
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_unique_${keyField.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )} ON ${table}(${uniqueConstraint
        .replace("UNIQUE(", "")
        .replace(")", "")})`
    ).run();
  })();

  console.log(`Deduplicated ${table} (${idMapping.size} duplicates removed)`);
}

// Handle composite key deduplication (like cohort_slot_courses triples)
function migrateDeduplicateByCompositeKey(db, config) {
  const {
    table,
    compositeKeyFields,
    primaryKey,
    rebuildTable = false,
    uniqueConstraint,
  } = config;

  if (rebuildTable) {
    // Rebuild approach for composite keys
    const records = db
      .prepare(`SELECT * FROM ${table} ORDER BY ${primaryKey}`)
      .all();

    if (records.length === 0) {
      // No records to deduplicate, just ensure constraint exists
      db.prepare(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_unique_composite ON ${table}(${uniqueConstraint
          .replace("UNIQUE(", "")
          .replace(")", "")})`
      ).run();
      return;
    }

    // Create canonical mapping based on composite key
    const canonicalByKey = new Map();
    records.forEach((record) => {
      const key = compositeKeyFields
        .map((field) => record[field] ?? "")
        .join("|");
      const existing = canonicalByKey.get(key);
      if (!existing || record[primaryKey] < existing[primaryKey]) {
        canonicalByKey.set(key, record);
      }
    });

    // Rebuild table with only canonical records
    const tempTable = `${table}_tmp`;
    db.prepare(`DROP TABLE IF EXISTS ${tempTable}`).run();
    db.prepare(
      `CREATE TABLE ${tempTable} AS SELECT * FROM ${table} WHERE 0`
    ).run();

    // Insert canonical records
    const columns = Object.keys(records[0]).join(", ");
    const placeholders = Object.keys(records[0])
      .map(() => "?")
      .join(", ");
    const insertStmt = db.prepare(
      `INSERT INTO ${tempTable} (${columns}) VALUES (${placeholders})`
    );

    canonicalByKey.forEach((record) => {
      insertStmt.run(...Object.values(record));
    });

    db.prepare(`DROP TABLE ${table}`).run();
    db.prepare(`ALTER TABLE ${tempTable} RENAME TO ${table}`).run();

    // Ensure unique constraint exists
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_unique_composite ON ${table}(${uniqueConstraint
        .replace("UNIQUE(", "")
        .replace(")", "")})`
    ).run();

    console.log(
      `Rebuilt ${table} with ${canonicalByKey.size} unique composite key entries`
    );
  } else {
    // Original delete duplicates approach
    const duplicates = db
      .prepare(
        `
      SELECT ${compositeKeyFields.join(", ")}, COUNT(*) as count
      FROM ${table}
      GROUP BY ${compositeKeyFields.join(", ")}
      HAVING count > 1
    `
      )
      .all();

    let totalRemoved = 0;
    for (const dup of duplicates) {
      const extras = db
        .prepare(
          `
        SELECT ${primaryKey} FROM ${table}
        WHERE ${compositeKeyFields.map((field) => `${field} = ?`).join(" AND ")}
        ORDER BY ${primaryKey} DESC
      `
        )
        .all(...compositeKeyFields.map((field) => dup[field]));
      const toDelete = extras.slice(1).map((e) => e[primaryKey]);
      if (toDelete.length > 0) {
        const placeholders = toDelete.map(() => "?").join(",");
        db.prepare(
          `DELETE FROM ${table} WHERE ${primaryKey} IN (${placeholders})`
        ).run(...toDelete);
        totalRemoved += toDelete.length;
      }
    }

    if (totalRemoved > 0) {
      console.log(`Removed ${totalRemoved} duplicate ${table} entries`);
    }
  }
}

// Data-driven deduplication configuration - all tables treated equally
const deduplicationOperations = [
  {
    name: "courses",
    description: "Deduplicate courses by normalized code",
    table: "courses",
    keyField: "code",
    keyNormalizer: normalizeCourseCode,
    primaryKey: "course_id",
    rebuildTable: true, // Rebuild needed for COLLATE NOCASE constraint
    uniqueConstraint: "UNIQUE(code) COLLATE NOCASE",
    relatedTables: [
      {
        table: "course_prerequisites",
        columns: ["course_id", "prerequisite_course_id"],
      },
      { table: "cohort_slot_courses", columns: ["course_id"] },
      { table: "teacher_course_competency", columns: ["course_id"] },
      { table: "teacher_courses_staff", columns: ["course_id"] },
    ],
    priority: 1,
  },
  {
    name: "teachers",
    description: "Deduplicate teachers by normalized name",
    table: "teachers",
    keyField: "name",
    keyNormalizer: (name) => (name ?? "").toString().trim().toLowerCase(),
    primaryKey: "teacher_id",
    rebuildTable: true, // Rebuild for consistency and proper constraint application
    uniqueConstraint: "UNIQUE(LOWER(TRIM(name)))",
    relatedTables: [
      { table: "teacher_course_competency", columns: ["teacher_id"] },
      { table: "teacher_courses_staff", columns: ["teacher_id"] },
      { table: "teacher_slot_unavailability", columns: ["teacher_id"] },
      {
        table: "cohort_slot_courses",
        columns: ["teachers"],
        isJsonArray: true,
      },
    ],
    priority: 2,
  },
  {
    name: "slots",
    description: "Deduplicate slots by date signature",
    table: "slots",
    keyField: "signature",
    keyNormalizer: (s) => [s.start_date ?? "", s.end_date ?? ""].join("|"),
    primaryKey: "slot_id",
    rebuildTable: true, // Rebuild for consistency
    uniqueConstraint:
      "UNIQUE(COALESCE(start_date, ''), COALESCE(end_date, ''))",
    relatedTables: [
      { table: "cohort_slot_courses", columns: ["slot_id"] },
      { table: "slot_days", columns: ["slot_id"] },
      { table: "teacher_slot_unavailability", columns: ["slot_id"] },
      { table: "course_slot_days", columns: ["slot_id"] },
    ],
    priority: 3,
  },
  {
    name: "cohorts",
    description: "Deduplicate cohorts by start date",
    table: "cohorts",
    keyField: "start_date",
    keyNormalizer: (value) => (value ?? "").toString().trim(),
    primaryKey: "cohort_id",
    rebuildTable: true, // Rebuild for consistency
    uniqueConstraint: "UNIQUE(COALESCE(start_date, ''))",
    relatedTables: [{ table: "cohort_slot_courses", columns: ["cohort_id"] }],
    priority: 4,
    renumberNames: true,
    namePattern: "Kull {index}",
  },
  {
    name: "cohort_slots",
    description: "Normalize cohort-slot-course triples",
    table: "cohort_slot_courses",
    primaryKey: "cohort_slot_course_id",
    compositeKeyFields: ["cohort_id", "slot_id", "course_id"],
    rebuildTable: true, // Rebuild for consistency
    uniqueConstraint: "UNIQUE(cohort_id, slot_id, course_id)",
    priority: 5,
  },
];

// Consolidated function that handles all deduplication using generic approach - all tables treated equally
export function migrateDeduplicateAll(db, helpers) {
  // Sort by priority to ensure proper execution order
  const sortedOperations = [...deduplicationOperations].sort(
    (a, b) => a.priority - b.priority
  );

  sortedOperations.forEach((config) => {
    const { name } = config;

    try {
      migrateDeduplicateGeneric(db, config, {});
      console.log(`✓ Completed deduplication for ${name}`);
    } catch (error) {
      console.error(`✗ Failed deduplication for ${name}:`, error.message);
      throw error; // Re-throw to stop the migration process
    }
  });
}
