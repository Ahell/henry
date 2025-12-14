import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const db = new Database(join(__dirname, "henry.db"));
db.pragma("busy_timeout = 5000");
const DEFAULT_SLOT_LENGTH_DAYS = 28;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    course_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    credits INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cohorts (
    cohort_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT,
    planned_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    home_department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teacher_courses (
    teacher_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    PRIMARY KEY (teacher_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS slots (
    slot_id INTEGER PRIMARY KEY,
    start_date TEXT,
    end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS course_prerequisites (
    course_id INTEGER NOT NULL,
    prerequisite_course_id INTEGER NOT NULL,
    PRIMARY KEY (course_id, prerequisite_course_id)
  );

  -- Legacy teacher_availability table removed; use teacher_slot_unavailability to store explicit unavailability rows
  CREATE TABLE IF NOT EXISTS teacher_slot_unavailability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER,
    slot_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, slot_id)
  );

  CREATE TABLE IF NOT EXISTS cohort_slot_courses (
    cohort_slot_course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    cohort_id INTEGER,
    teachers TEXT,
    slot_span INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, slot_id, cohort_id)
  );

  CREATE TABLE IF NOT EXISTS slot_days (
    slot_day_id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id INTEGER NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS course_slot_days (
    course_slot_day_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_slot_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS course_run_slots (
    run_slot_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    sequence INTEGER DEFAULT 1,
    UNIQUE(run_id, slot_id)
  );
`);

// Helpers
const normalizeCourseCode = (code) => {
  if (typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
};

const normalizeCredits = (value) => {
  const num = Number(value);
  return num === 15 ? 15 : 7.5;
};

const getSortedSlots = () =>
  db
    .prepare(
      "SELECT slot_id, start_date FROM slots ORDER BY date(start_date), slot_id"
    )
    .all();

const computeCourseSlotSpan = (courseId) => {
  const course = db
    .prepare("SELECT credits FROM courses WHERE course_id = ?")
    .get(courseId);
  return course && normalizeCredits(course.credits) === 15 ? 2 : 1;
};

const getConsecutiveSlotIds = (primarySlotId, span, sortedSlots = null) => {
  const orderedSlots = sortedSlots || getSortedSlots();
  const index = orderedSlots.findIndex(
    (s) => String(s.slot_id) === String(primarySlotId)
  );
  if (index === -1) {
    return [primarySlotId];
  }

  const ids = [];
  for (let i = 0; i < span; i++) {
    const slot = orderedSlots[index + i];
    if (!slot) break;
    ids.push(slot.slot_id);
  }
  return ids.length > 0 ? ids : [primarySlotId];
};

// Helper: insert slot_days rows for a slot (inclusive range). Uses INSERT OR IGNORE.
const ensureSlotDaysForSlot = (slot) => {
  if (!slot || !slot.slot_id || !slot.start_date || !slot.end_date) return;
  const start = new Date(slot.start_date);
  const end = new Date(slot.end_date);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

  const insert = db.prepare(
    "INSERT OR IGNORE INTO slot_days (slot_id, date) VALUES (?, ?)"
  );

  db.transaction(() => {
    const d = new Date(start);
    while (d <= end) {
      insert.run(slot.slot_id, d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }
  })();
};

const upsertRunSlots = (runId, primarySlotId, span) => {
  const slotIds = getConsecutiveSlotIds(primarySlotId, span);
  const deleteStmt = db.prepare(
    "DELETE FROM course_run_slots WHERE run_id = ?"
  );
  const insertStmt = db.prepare(
    "INSERT OR IGNORE INTO course_run_slots (run_id, slot_id, sequence) VALUES (?, ?, ?)"
  );
  db.transaction(() => {
    deleteStmt.run(runId);
    slotIds.forEach((slotId, idx) => insertStmt.run(runId, slotId, idx + 1));
  })();
  return slotIds;
};

// Migration: deduplicate teacher_courses to fix UNIQUE constraint
(() => {
  db.transaction(() => {
    db.prepare(
      `CREATE TABLE teacher_courses_tmp (teacher_id INTEGER NOT NULL, course_id INTEGER NOT NULL, PRIMARY KEY (teacher_id, course_id))`
    ).run();
    db.prepare(
      `INSERT OR IGNORE INTO teacher_courses_tmp SELECT DISTINCT teacher_id, course_id FROM teacher_courses`
    ).run();
    db.prepare(`DROP TABLE teacher_courses`).run();
    db.prepare(
      `ALTER TABLE teacher_courses_tmp RENAME TO teacher_courses`
    ).run();
  })();
  console.log("Deduplicated teacher_courses");
})();

// Ensure new columns exist after deploy (SQLite lacks IF NOT EXISTS for columns)
const ensureColumn = (table, column, typeWithDefault) => {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const hasCol = info.some((c) => c.name === column);
  if (!hasCol) {
    db.prepare(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${typeWithDefault}`
    ).run();
  }
};

ensureColumn("course_slot_days", "is_default", "INTEGER DEFAULT 0");
ensureColumn("course_slot_days", "active", "INTEGER DEFAULT 1");
ensureColumn("cohort_slot_courses", "slot_span", "INTEGER DEFAULT 1");

// Migration: backfill slot_span and populate course_run_slots for existing runs
(() => {
  const runs = db
    .prepare(
      "SELECT cohort_slot_course_id, course_id, slot_id, slot_span FROM cohort_slot_courses"
    )
    .all();
  if (runs.length === 0) return;

  const sortedSlots = getSortedSlots();
  const updateSpan = db.prepare(
    "UPDATE cohort_slot_courses SET slot_span = ? WHERE cohort_slot_course_id = ?"
  );
  const insertRunSlot = db.prepare(
    "INSERT OR IGNORE INTO course_run_slots (run_id, slot_id, sequence) VALUES (?, ?, ?)"
  );

  try {
    db.transaction(() => {
      runs.forEach((run) => {
        const spanFromCourse = computeCourseSlotSpan(run.course_id);
        const span =
          Number(run.slot_span) >= 2 ? Number(run.slot_span) : spanFromCourse;
        updateSpan.run(span, run.cohort_slot_course_id);

        const slotIds = getConsecutiveSlotIds(run.slot_id, span, sortedSlots);
        slotIds.forEach((slotId, idx) =>
          insertRunSlot.run(run.cohort_slot_course_id, slotId, idx + 1)
        );
      });
    })();
  } catch (err) {
    if (err && err.code === "SQLITE_BUSY") {
      console.warn(
        "Skipping slot_span backfill due to locked database; will retry on next start"
      );
    } else {
      throw err;
    }
  }
})();

// Migration: drop legacy course_runs table (schedule now lives in cohort_slot_courses)
(() => {
  const hasCourseRuns = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='course_runs'"
    )
    .get();
  if (hasCourseRuns) {
    db.prepare("DROP TABLE course_runs").run();
    console.log("Dropped legacy course_runs table");
  }
})();

// Migration: rename course_slots to cohort_slot_courses and migrate data
(() => {
  const hasOld = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='course_slots'"
    )
    .get();
  const hasNew = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='cohort_slot_courses'"
    )
    .get();
  if (!hasOld || !hasNew) return;

  const existing = db
    .prepare(
      "SELECT course_slot_id, course_id, slot_id, cohort_id, created_at FROM course_slots"
    )
    .all();

  if (existing.length === 0) {
    db.prepare("DROP TABLE course_slots").run();
    return;
  }

  const insert = db.prepare(
    "INSERT OR IGNORE INTO cohort_slot_courses (cohort_slot_course_id, course_id, slot_id, cohort_id, created_at) VALUES (?, ?, ?, ?, ?)"
  );

  db.transaction(() => {
    existing.forEach((cs) => {
      insert.run(
        cs.course_slot_id,
        cs.course_id,
        cs.slot_id,
        cs.cohort_id,
        cs.created_at
      );
    });
    db.prepare("DROP TABLE course_slots").run();
  })();

  console.log(
    `Migrated ${existing.length} rows from course_slots to cohort_slot_courses`
  );
})();

// Migration: drop legacy compatible_courses column from teachers
(() => {
  const info = db.prepare(`PRAGMA table_info(teachers)`).all();
  const hasCompat = info.some((c) => c.name === "compatible_courses");
  if (hasCompat) {
    const cols = info.map((c) => c.name);
    const createdCol = cols.includes("created_at");
    db.transaction(() => {
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS teachers_tmp (
          teacher_id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          home_department TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
      ).run();
      db.prepare(
        `INSERT INTO teachers_tmp (teacher_id, name, home_department, created_at)
         SELECT teacher_id, name, home_department, ${
           createdCol ? "created_at" : "CURRENT_TIMESTAMP"
         }
         FROM teachers`
      ).run();
      db.prepare(`DROP TABLE teachers`).run();
      db.prepare(`ALTER TABLE teachers_tmp RENAME TO teachers`).run();
    })();
    console.log("Migrated teachers table: removed compatible_courses column");
  }
})();

// Migration: ensure course_prerequisites exists and is populated from courses.prerequisites if empty
(() => {
  const hasTable = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='course_prerequisites'"
    )
    .get();
  if (!hasTable) return;

  const count = db
    .prepare("SELECT COUNT(*) as c FROM course_prerequisites")
    .get().c;
  if (count === 0) {
    const info = db.prepare(`PRAGMA table_info(courses)`).all();
    const hasPrereq = info.some((c) => c.name === "prerequisites");
    if (!hasPrereq) return;

    const courses = db
      .prepare("SELECT course_id, prerequisites FROM courses")
      .all();
    const insert = db.prepare(
      "INSERT OR IGNORE INTO course_prerequisites (course_id, prerequisite_course_id) VALUES (?, ?)"
    );
    db.transaction(() => {
      courses.forEach((c) => {
        if (c.prerequisites) {
          let parsed = [];
          try {
            parsed = JSON.parse(c.prerequisites);
          } catch (e) {
            parsed = [];
          }
          if (Array.isArray(parsed)) {
            parsed.forEach((pid) => insert.run(c.course_id, pid));
          }
        }
      });
    })();
    console.log(
      "Migrated prerequisites: populated course_prerequisites from courses.prerequisites"
    );
  }
})();

// Migration: drop legacy prerequisites column from courses
(() => {
  const info = db.prepare(`PRAGMA table_info(courses)`).all();
  const hasPrereq = info.some((c) => c.name === "prerequisites");
  if (hasPrereq) {
    db.transaction(() => {
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS courses_tmp (
          course_id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT,
          credits INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
      ).run();
      db.prepare(
        `INSERT INTO courses_tmp (course_id, name, code, credits, created_at)
         SELECT course_id, name, code, credits, created_at FROM courses`
      ).run();
      db.prepare(`DROP TABLE courses`).run();
      db.prepare(`ALTER TABLE courses_tmp RENAME TO courses`).run();
    })();
    console.log("Migrated courses table: removed prerequisites column");
  }
})();

// Migration: deduplicate courses by code and enforce UNIQUE(code)
(() => {
  const courses = db
    .prepare(
      "SELECT course_id, name, code, credits, created_at FROM courses ORDER BY course_id"
    )
    .all();

  const canonicalByCode = new Map(); // normalizedCode -> keepId
  courses.forEach((c) => {
    const normCode = normalizeCourseCode(c.code);
    if (!normCode) return;
    const keepId = canonicalByCode.get(normCode);
    if (!keepId || c.course_id < keepId) {
      canonicalByCode.set(normCode, c.course_id);
    }
  });

  const mapping = new Map(); // from -> to
  courses.forEach((c) => {
    const normCode = normalizeCourseCode(c.code);
    if (!normCode) return;
    const keepId = canonicalByCode.get(normCode);
    if (keepId && keepId !== c.course_id) {
      mapping.set(c.course_id, keepId);
    }
  });

  const hasUniqueCodeIndex = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='courses' AND sql LIKE '%UNIQUE%' AND sql LIKE '%code%'`
    )
    .get();

  if (mapping.size === 0 && hasUniqueCodeIndex) {
    return;
  }

  db.transaction(() => {
    const updateTable = (table, column) => {
      const stmt = db.prepare(
        `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`
      );
      mapping.forEach((to, from) => stmt.run(to, from));
    };

    // Update references to merged course_ids
    updateTable("course_prerequisites", "course_id");
    updateTable("course_prerequisites", "prerequisite_course_id");
    updateTable("cohort_slot_courses", "course_id");
    updateTable("teacher_courses", "course_id");

    // Deduplicate teacher_courses after course_id remapping
    db.prepare(
      "DELETE FROM teacher_courses WHERE rowid NOT IN (SELECT MIN(rowid) FROM teacher_courses GROUP BY teacher_id, course_id)"
    ).run();

    // Rebuild courses with UNIQUE(code) (case-insensitive)
    db.prepare(
      `CREATE TABLE IF NOT EXISTS courses_tmp (
        course_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT COLLATE NOCASE UNIQUE,
        credits INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ).run();

    const insertCourse = db.prepare(
      "INSERT OR IGNORE INTO courses_tmp (course_id, name, code, credits, created_at) VALUES (?, ?, ?, ?, ?)"
    );

    const seenKeepIds = new Set();
    courses.forEach((c) => {
      const keepId =
        c.code !== null && c.code !== undefined
          ? canonicalByCode.get(normalizeCourseCode(c.code)) || c.course_id
          : c.course_id;
      if (seenKeepIds.has(keepId)) return;
      seenKeepIds.add(keepId);
      insertCourse.run(
        keepId,
        c.name,
        normalizeCourseCode(c.code),
        c.credits,
        c.created_at
      );
    });

    db.prepare("DROP TABLE courses").run();
    db.prepare("ALTER TABLE courses_tmp RENAME TO courses").run();
  })();

  if (mapping.size > 0) {
    console.log(
      `Deduplicated courses by code (${mapping.size} duplicates merged) and enforced UNIQUE(code)`
    );
  } else {
    console.log("Enforced UNIQUE(code) on courses table");
  }
})();

// Migration: deduplicate teachers by name and enforce UNIQUE(name)
(() => {
  const teachers = db
    .prepare(
      "SELECT teacher_id, name, home_department, created_at FROM teachers ORDER BY teacher_id"
    )
    .all();
  if (teachers.length === 0) return;

  const normalizeName = (name) => (name ?? "").toString().trim().toLowerCase();

  const keepByName = new Map(); // normalizedName -> teacher row to keep
  teachers.forEach((t) => {
    const key = normalizeName(t.name);
    const keep = keepByName.get(key);
    if (!keep || t.teacher_id < keep.teacher_id) {
      keepByName.set(key, t);
    }
  });

  const mapping = new Map(); // from -> to
  teachers.forEach((t) => {
    const key = normalizeName(t.name);
    const keep = keepByName.get(key);
    if (keep) {
      mapping.set(t.teacher_id, keep.teacher_id);
    }
  });

  if (keepByName.size !== teachers.length) {
    const keepIds = Array.from(keepByName.values()).map((t) => t.teacher_id);
    const placeholders = keepIds.map(() => "?").join(",");
    const deleteDupes = db.prepare(
      `DELETE FROM teachers WHERE teacher_id NOT IN (${placeholders})`
    );
    const updateTeacherCourse = db.prepare(
      "UPDATE teacher_courses SET teacher_id = ? WHERE teacher_id = ?"
    );
    const updateTeacherAvailability = db.prepare(
      "UPDATE teacher_slot_unavailability SET teacher_id = ? WHERE teacher_id = ?"
    );
    const updateCohortSlotTeachers = db.prepare(
      "UPDATE cohort_slot_courses SET teachers = ? WHERE cohort_slot_course_id = ?"
    );

    db.transaction(() => {
      // Remap teacher arrays on cohort_slot_courses
      const courseSlots = db
        .prepare(
          "SELECT cohort_slot_course_id, teachers FROM cohort_slot_courses"
        )
        .all();
      courseSlots.forEach((cs) => {
        if (!cs.teachers) return;
        let parsed = [];
        try {
          parsed = JSON.parse(cs.teachers);
        } catch (e) {
          parsed = [];
        }
        if (!Array.isArray(parsed)) return;
        const remapped = Array.from(
          new Set(
            parsed
              .map((id) => mapping.get(id) ?? id)
              .filter((id) => id !== null && id !== undefined)
          )
        );
        updateCohortSlotTeachers.run(
          JSON.stringify(remapped),
          cs.cohort_slot_course_id
        );
      });

      // Remap teacher_courses and teacher_availability
      mapping.forEach((to, from) => {
        if (to !== from) {
          updateTeacherCourse.run(to, from);
          updateTeacherAvailability.run(to, from);
        }
      });

      // Deduplicate teacher_courses after teacher_id remapping
      db.prepare(
        "DELETE FROM teacher_courses WHERE rowid NOT IN (SELECT MIN(rowid) FROM teacher_courses GROUP BY teacher_id, course_id)"
      ).run();

      // Drop duplicate teacher rows
      deleteDupes.run(...keepIds);
    })();

    console.log(
      `Deduplicated teachers (${
        teachers.length - keepByName.size
      } duplicates removed)`
    );
  }

  db.prepare(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_unique_name
     ON teachers(LOWER(TRIM(name)))`
  ).run();
})();

// Migration: remove prerequisite rows that reference non-existent courses
(() => {
  const result = db
    .prepare(
      `
        DELETE FROM course_prerequisites
        WHERE course_id NOT IN (SELECT course_id FROM courses)
           OR prerequisite_course_id NOT IN (SELECT course_id FROM courses)
      `
    )
    .run();
  if (result.changes > 0) {
    console.log(
      `Removed ${result.changes} orphaned rows from course_prerequisites`
    );
  }
})();

// Migration: normalize course credits (default 7.5p, AI180U is 15p)
(() => {
  const courses = db
    .prepare("SELECT course_id, code, credits FROM courses")
    .all();
  const update = db.prepare(
    "UPDATE courses SET credits = ? WHERE course_id = ?"
  );
  let changes = 0;

  courses.forEach((c) => {
    const normalized = normalizeCredits(c.credits);
    const needsUpdate =
      !Number.isFinite(Number(c.credits)) || c.credits !== normalized;
    if (needsUpdate) {
      const result = update.run(normalized, c.course_id);
      changes += result.changes ?? 0;
    }
  });

  if (changes > 0) {
    console.log(`Normalized credits for ${changes} courses`);
  }
})();

// Migration: drop legacy courses column from cohorts
(() => {
  const info = db.prepare("PRAGMA table_info(cohorts)").all();
  const hasCourses = info.some((c) => c.name === "courses");
  if (!hasCourses) return;

  const cohorts = db
    .prepare(
      "SELECT cohort_id, name, start_date, planned_size, created_at FROM cohorts"
    )
    .all();

  db.transaction(() => {
    db.prepare(
      `CREATE TABLE IF NOT EXISTS cohorts_tmp (
        cohort_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        start_date TEXT,
        planned_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ).run();

    const insert = db.prepare(
      "INSERT OR IGNORE INTO cohorts_tmp (cohort_id, name, start_date, planned_size, created_at) VALUES (?, ?, ?, ?, ?)"
    );
    cohorts.forEach((c) =>
      insert.run(
        c.cohort_id,
        c.name,
        c.start_date,
        c.planned_size,
        c.created_at
      )
    );

    db.prepare("DROP TABLE cohorts").run();
    db.prepare("ALTER TABLE cohorts_tmp RENAME TO cohorts").run();
  })();

  console.log("Rebuilt cohorts table without courses column");
})();

// Migration: drop legacy year/term/period columns from slots
(() => {
  const info = db.prepare("PRAGMA table_info(slots)").all();
  const hasYear = info.some((c) => c.name === "year");
  const hasTerm = info.some((c) => c.name === "term");
  const hasPeriod = info.some((c) => c.name === "period");
  const needsRebuild = hasYear || hasTerm || hasPeriod;
  if (!needsRebuild) return;

  const slots = db
    .prepare("SELECT slot_id, start_date, end_date, created_at FROM slots")
    .all();

  db.transaction(() => {
    db.prepare(
      `CREATE TABLE IF NOT EXISTS slots_tmp (
        slot_id INTEGER PRIMARY KEY,
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ).run();

    const insert = db.prepare(
      "INSERT OR IGNORE INTO slots_tmp (slot_id, start_date, end_date, created_at) VALUES (?, ?, ?, ?)"
    );
    slots.forEach((s) => {
      insert.run(s.slot_id, s.start_date, s.end_date, s.created_at);
    });

    db.prepare("DROP TABLE slots").run();
    db.prepare("ALTER TABLE slots_tmp RENAME TO slots").run();
  })();

  console.log("Rebuilt slots table without year/term/period columns");
})();

// Migration: normalize slot end_date to DEFAULT_SLOT_LENGTH_DAYS (28 days)
(() => {
  const slots = db
    .prepare("SELECT slot_id, start_date, end_date FROM slots")
    .all();
  if (slots.length === 0) return;

  const update = db.prepare(
    "UPDATE slots SET end_date = ? WHERE slot_id = ?"
  );
  let changes = 0;

  slots.forEach((s) => {
    if (!s.start_date) return;
    const start = new Date(s.start_date);
    if (Number.isNaN(start.getTime())) return;
    const end = new Date(start);
    end.setDate(end.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
    const endStr = end.toISOString().split("T")[0];
    if (s.end_date !== endStr) {
      const result = update.run(endStr, s.slot_id);
      changes += result.changes ?? 0;
    }
  });

  if (changes > 0) {
    console.log(
      `Normalized slot end_date to ${DEFAULT_SLOT_LENGTH_DAYS} days for ${changes} slots`
    );
  }
})();

// Migration: populate slot_days from slots if empty
(() => {
  const cnt = db.prepare("SELECT COUNT(*) as c FROM slot_days").get().c;
  if (cnt > 0) return;

  const slots = db
    .prepare("SELECT slot_id, start_date, end_date FROM slots")
    .all();
  if (!slots || slots.length === 0) return;

  const insert = db.prepare(
    "INSERT INTO slot_days (slot_id, date) VALUES (?, ?)"
  );

  db.transaction(() => {
    slots.forEach((s) => {
      if (!s.start_date || !s.end_date) return;
      const start = new Date(s.start_date);
      const end = new Date(s.end_date);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      const d = new Date(start);
      while (d <= end) {
        insert.run(s.slot_id, d.toISOString().split("T")[0]);
        d.setDate(d.getDate() + 1);
      }
    });
  })();

  console.log(`Populated slot_days for ${slots.length} slots`);
})();

// Migration: deduplicate slot_days and enforce uniqueness on (slot_id, date)
(() => {
  const info = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='slot_days' AND sql LIKE '%slot_id, date%'"
    )
    .get();
  // If index already exists (or is present), skip
  if (info) return;

  // Remove duplicate slot_days, keeping the lowest rowid
  db.prepare(
    "DELETE FROM slot_days WHERE rowid NOT IN (SELECT MIN(rowid) FROM slot_days GROUP BY slot_id, date)"
  ).run();

  db.prepare(
    "CREATE UNIQUE INDEX IF NOT EXISTS slot_days_slot_date_unique ON slot_days(slot_id, date)"
  ).run();
  console.log("Deduplicated slot_days and created unique index on (slot_id, date)");
})();

// Migration: deduplicate slots and enforce uniqueness on slot signature
(() => {
  const slots = db
    .prepare("SELECT slot_id, start_date, end_date, created_at FROM slots")
    .all();

  const signature = (s) => [s.start_date ?? "", s.end_date ?? ""].join("|");

  const keepBySignature = new Map();
  slots.forEach((s) => {
    const key = signature(s);
    const keep = keepBySignature.get(key);
    if (!keep || s.slot_id < keep.slot_id) {
      keepBySignature.set(key, s);
    }
  });

  const slotIdMapping = new Map(); // from -> to
  slots.forEach((s) => {
    const key = signature(s);
    const keep = keepBySignature.get(key);
    if (keep && keep.slot_id !== s.slot_id) {
      slotIdMapping.set(s.slot_id, keep.slot_id);
    }
  });

  if (slotIdMapping.size > 0) {
    const remapSlotId = (id) => slotIdMapping.get(id) || id;

    db.transaction(() => {
      // Remap cohort_slot_courses while preserving IDs and deduplicating
      const cohortSlotCourses = db
        .prepare(
          "SELECT cohort_slot_course_id, course_id, slot_id, cohort_id, teachers, created_at FROM cohort_slot_courses"
        )
        .all();
      const keepCourseSlotByKey = new Map();
      cohortSlotCourses.forEach((cs) => {
        const remappedSlotId = remapSlotId(cs.slot_id);
        const key = `${cs.course_id}|${remappedSlotId}|${cs.cohort_id ?? ""}`;
        const keep = keepCourseSlotByKey.get(key);
        if (!keep || cs.cohort_slot_course_id < keep.cohort_slot_course_id) {
          keepCourseSlotByKey.set(key, {
            ...cs,
            slot_id: remappedSlotId,
          });
        }
      });
      const cohortSlotCourseIdMapping = new Map();
      cohortSlotCourses.forEach((cs) => {
        const remappedSlotId = remapSlotId(cs.slot_id);
        const key = `${cs.course_id}|${remappedSlotId}|${cs.cohort_id ?? ""}`;
        const keep = keepCourseSlotByKey.get(key);
        const targetId = keep
          ? keep.cohort_slot_course_id
          : cs.cohort_slot_course_id;
        cohortSlotCourseIdMapping.set(cs.cohort_slot_course_id, targetId);
      });

      db.prepare("DELETE FROM cohort_slot_courses").run();
      const insertCourseSlot = db.prepare(
        "INSERT INTO cohort_slot_courses (cohort_slot_course_id, course_id, slot_id, cohort_id, teachers, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      );
      keepCourseSlotByKey.forEach((cs) => {
        insertCourseSlot.run(
          cs.cohort_slot_course_id,
          cs.course_id,
          cs.slot_id,
          cs.cohort_id,
          cs.teachers,
          cs.created_at
        );
      });

      // Remap course_slot_days if any rows were merged
      const updateCourseSlotDay = db.prepare(
        "UPDATE course_slot_days SET course_slot_id = ? WHERE course_slot_id = ?"
      );
      cohortSlotCourseIdMapping.forEach((to, from) => {
        if (to !== from) {
          updateCourseSlotDay.run(to, from);
        }
      });

      // Remap slot_days
      const updateSlotDays = db.prepare(
        "UPDATE slot_days SET slot_id = ? WHERE slot_id = ?"
      );
      slotIdMapping.forEach((to, from) => updateSlotDays.run(to, from));

      // Remap legacy teacher_availability rows (if the legacy table exists) into teacher_slot_unavailability
      const hasOldAvailability = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='teacher_availability'"
        )
        .get();
      if (hasOldAvailability) {
        const availability = db
          .prepare(
            "SELECT id, teacher_id, slot_id, available, created_at FROM teacher_availability"
          )
          .all()
          .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

        // Migrate availability rows into teacher_slot_unavailability for entries that were unavailable (available===0)
        const unavailInsert = db.prepare(
          "INSERT OR IGNORE INTO teacher_slot_unavailability (id, teacher_id, slot_id, created_at) VALUES (?, ?, ?, ?)"
        );
        availability.forEach((a) => {
          const slotId = remapSlotId(a.slot_id);
          if (a.available === 0) {
            unavailInsert.run(a.id, a.teacher_id, slotId, a.created_at);
          }
        });

        // Remove any legacy availability rows
        db.prepare("DELETE FROM teacher_availability").run();
      }

      // Drop duplicated slot rows
      const deleteSlot = db.prepare("DELETE FROM slots WHERE slot_id = ?");
      slotIdMapping.forEach((_, from) => deleteSlot.run(from));
    })();

    console.log(
      `Deduplicated slots (${slotIdMapping.size} duplicates merged into canonical entries)`
    );
  }

  const hasUniqueSignatureIndex = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_slots_unique_signature'"
    )
    .get();
  if (!hasUniqueSignatureIndex) {
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_slots_unique_signature
       ON slots(
         COALESCE(start_date, ''),
         COALESCE(end_date, '')
       )`
    ).run();
  }
})();

// Migration: deduplicate cohorts by start_date and renumber names
(() => {
  const cohorts = db
    .prepare(
      "SELECT cohort_id, name, start_date, planned_size, created_at FROM cohorts"
    )
    .all();
  if (cohorts.length === 0) return;

  const normalizeStart = (value) => (value ?? "").toString().trim();
  const keepByStart = new Map(); // start_date -> cohort row to keep
  cohorts.forEach((c) => {
    const key = normalizeStart(c.start_date);
    const keep = keepByStart.get(key);
    if (!keep || c.cohort_id < keep.cohort_id) {
      keepByStart.set(key, c);
    }
  });

  const mapping = new Map(); // from cohort_id -> canonical cohort_id
  cohorts.forEach((c) => {
    const key = normalizeStart(c.start_date);
    const keep = keepByStart.get(key);
    if (keep) {
      mapping.set(c.cohort_id, keep.cohort_id);
    }
  });

  if (keepByStart.size !== cohorts.length) {
    const keepIds = Array.from(keepByStart.values()).map((c) => c.cohort_id);
    const placeholders = keepIds.map(() => "?").join(",");
    const deleteDupes = db.prepare(
      `DELETE FROM cohorts WHERE cohort_id NOT IN (${placeholders})`
    );
    const updateCourseSlotCohort = db.prepare(
      "UPDATE cohort_slot_courses SET cohort_id = ? WHERE cohort_id = ?"
    );
    const updateName = db.prepare(
      "UPDATE cohorts SET name = ? WHERE cohort_id = ?"
    );

    db.transaction(() => {
      // Remap cohort references in cohort_slot_courses
      mapping.forEach((to, from) => {
        if (to !== from) {
          updateCourseSlotCohort.run(to, from);
        }
      });

      // Drop duplicate cohort rows
      deleteDupes.run(...keepIds);

      // Renumber names sequentially by start_date (stable by cohort_id)
      const sorted = Array.from(keepByStart.values()).sort((a, b) => {
        const dateDiff = new Date(a.start_date) - new Date(b.start_date);
        if (dateDiff !== 0) return dateDiff;
        return (a.cohort_id ?? 0) - (b.cohort_id ?? 0);
      });
      sorted.forEach((c, idx) =>
        updateName.run(`Kull ${idx + 1}`, c.cohort_id)
      );
    })();

    console.log(
      `Deduplicated cohorts (${
        cohorts.length - keepByStart.size
      } duplicates removed)`
    );
  }

  db.prepare(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_cohorts_unique_start_date
     ON cohorts(COALESCE(start_date, ''))`
  ).run();
})();

// Migration: ensure cohort_slot_courses has expected schema and uniqueness
(() => {
  const info = db.prepare("PRAGMA table_info(cohort_slot_courses)").all();
  const hasPk = info.some((c) => c.name === "cohort_slot_course_id");
  const hasCohort = info.some((c) => c.name === "cohort_id");
  const hasTeachers = info.some((c) => c.name === "teachers");
  const hasLegacyPk = info.some((c) => c.name === "course_slot_id");

  const needsRebuild = !hasPk || !hasCohort || hasLegacyPk || !hasTeachers;

  if (needsRebuild) {
    const existing = db
      .prepare(
        "SELECT cohort_slot_course_id, course_slot_id, course_id, slot_id, cohort_id, teachers, created_at FROM cohort_slot_courses"
      )
      .all();

    db.transaction(() => {
      db.prepare(
        `CREATE TABLE IF NOT EXISTS cohort_slot_courses_tmp (
          cohort_slot_course_id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER NOT NULL,
          slot_id INTEGER NOT NULL,
          cohort_id INTEGER,
          teachers TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ).run();

      const insertTmp = db.prepare(
        "INSERT OR IGNORE INTO cohort_slot_courses_tmp (cohort_slot_course_id, course_id, slot_id, cohort_id, teachers, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      );
      existing.forEach((cs) => {
        const id = cs.cohort_slot_course_id ?? cs.course_slot_id ?? null;
        insertTmp.run(
          id,
          cs.course_id,
          cs.slot_id,
          cs.cohort_id,
          cs.teachers,
          cs.created_at
        );
      });

      db.prepare("DROP TABLE cohort_slot_courses").run();
      db.prepare(
        "ALTER TABLE cohort_slot_courses_tmp RENAME TO cohort_slot_courses"
      ).run();
    })();

    console.log(
      "Rebuilt cohort_slot_courses table with cohort_slot_course_id primary key"
    );
  }

  // Deduplicate entries by course/slot/cohort (treating NULL cohort_id as a value)
  const allCourseSlots = db
    .prepare(
      "SELECT cohort_slot_course_id, course_id, slot_id, cohort_id, teachers, created_at FROM cohort_slot_courses"
    )
    .all();
  const keepByKey = new Map();
  allCourseSlots.forEach((cs) => {
    const key = `${cs.course_id}|${cs.slot_id}|${cs.cohort_id ?? "__NULL__"}`;
    const keep = keepByKey.get(key);
    if (!keep || cs.cohort_slot_course_id < keep.cohort_slot_course_id) {
      keepByKey.set(key, cs);
    }
  });
  if (keepByKey.size !== allCourseSlots.length) {
    db.transaction(() => {
      db.prepare("DELETE FROM cohort_slot_courses").run();
      const insert = db.prepare(
        "INSERT INTO cohort_slot_courses (cohort_slot_course_id, course_id, slot_id, cohort_id, teachers, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      );
      keepByKey.forEach((cs) => {
        insert.run(
          cs.cohort_slot_course_id,
          cs.course_id,
          cs.slot_id,
          cs.cohort_id,
          cs.teachers,
          cs.created_at
        );
      });
    })();
    console.log(
      `Deduplicated cohort_slot_courses (${
        allCourseSlots.length - keepByKey.size
      } duplicates removed)`
    );
  }

  db.prepare(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_cohort_slot_courses_unique_triple
     ON cohort_slot_courses(course_id, slot_id, COALESCE(cohort_id, -1))`
  ).run();
})();

// Helper function to convert array fields
function serializeArrayFields(obj, fields) {
  const result = { ...obj };
  fields.forEach((field) => {
    if (Array.isArray(result[field])) {
      result[field] = JSON.stringify(result[field]);
    }
  });
  return result;
}

function deserializeArrayFields(obj, fields) {
  if (!obj) return obj;
  const result = { ...obj };
  fields.forEach((field) => {
    if (typeof result[field] === "string") {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) {
        result[field] = [];
      }
    }
  });
  return result;
}

// COURSES
app.get("/api/courses", (req, res) => {
  const courses = db.prepare("SELECT * FROM courses").all();
  res.json(courses);
});

app.post("/api/courses", (req, res) => {
  const course = req.body;
  const credits = normalizeCredits(course.credits);
  const stmt = db.prepare(
    "INSERT INTO courses (course_id, name, code, credits) VALUES (?, ?, ?, ?)"
  );
  stmt.run(course.course_id, course.name, course.code, credits);
  res.json({ ...course, credits });
});

app.put("/api/courses/:id", (req, res) => {
  const course = req.body;
  const credits = normalizeCredits(course.credits);
  const stmt = db.prepare(
    "UPDATE courses SET name = ?, code = ?, credits = ? WHERE course_id = ?"
  );
  stmt.run(course.name, course.code, credits, req.params.id);
  res.json({ ...course, credits });
});

app.delete("/api/courses/:id", (req, res) => {
  db.prepare("DELETE FROM courses WHERE course_id = ?").run(req.params.id);
  res.json({ success: true });
});

// COHORTS
app.get("/api/cohorts", (req, res) => {
  const cohorts = db.prepare("SELECT * FROM cohorts").all();
  res.json(cohorts);
});

app.post("/api/cohorts", (req, res) => {
  const cohort = req.body;
  const stmt = db.prepare(
    "INSERT INTO cohorts (cohort_id, name, start_date, planned_size) VALUES (?, ?, ?, ?)"
  );
  stmt.run(
    cohort.cohort_id,
    cohort.name,
    cohort.start_date,
    cohort.planned_size
  );
  res.json(cohort);
});

app.put("/api/cohorts/:id", (req, res) => {
  const cohort = req.body;
  const stmt = db.prepare(
    "UPDATE cohorts SET name = ?, start_date = ?, planned_size = ? WHERE cohort_id = ?"
  );
  stmt.run(cohort.name, cohort.start_date, cohort.planned_size, req.params.id);
  res.json(cohort);
});

app.delete("/api/cohorts/:id", (req, res) => {
  db.prepare("DELETE FROM cohorts WHERE cohort_id = ?").run(req.params.id);
  res.json({ success: true });
});

// TEACHERS
app.get("/api/teachers", (req, res) => {
  const teachers = db.prepare("SELECT * FROM teachers").all();
  res.json(
    teachers.map((t) => deserializeArrayFields(t, ["compatible_courses"]))
  );
});

app.post("/api/teachers", (req, res) => {
  const teacher = serializeArrayFields(req.body, ["compatible_courses"]);
  const stmt = db.prepare(
    "INSERT INTO teachers (teacher_id, name, home_department, compatible_courses) VALUES (?, ?, ?, ?)"
  );
  stmt.run(
    teacher.teacher_id,
    teacher.name,
    teacher.home_department,
    teacher.compatible_courses
  );
  res.json(deserializeArrayFields(teacher, ["compatible_courses"]));
});

app.put("/api/teachers/:id", (req, res) => {
  const teacher = serializeArrayFields(req.body, ["compatible_courses"]);
  const stmt = db.prepare(
    "UPDATE teachers SET name = ?, home_department = ?, compatible_courses = ? WHERE teacher_id = ?"
  );
  stmt.run(
    teacher.name,
    teacher.home_department,
    teacher.compatible_courses,
    req.params.id
  );
  res.json(deserializeArrayFields(teacher, ["compatible_courses"]));
});

app.delete("/api/teachers/:id", (req, res) => {
  db.prepare("DELETE FROM teachers WHERE teacher_id = ?").run(req.params.id);
  res.json({ success: true });
});

// SLOTS
app.get("/api/slots", (req, res) => {
  const slots = db.prepare("SELECT * FROM slots").all();
  res.json(slots);
});

app.post("/api/slots", (req, res) => {
  const slot = req.body;
  const stmt = db.prepare(
    "INSERT INTO slots (slot_id, start_date, end_date) VALUES (?, ?, ?)"
  );
  stmt.run(slot.slot_id, slot.start_date, slot.end_date);
  // Ensure the slot_days rows are created for this slot (28-day range)
  try {
    ensureSlotDaysForSlot(slot);
  } catch (e) {
    console.warn("Failed to ensure slot_days for new slot:", e);
  }
  res.json(slot);
});

// COURSE RUNS (backed by cohort_slot_courses)
app.get("/api/course-runs", (req, res) => {
  const courseSlots = db
    .prepare("SELECT * FROM cohort_slot_courses")
    .all()
    .map((cs) => deserializeArrayFields(cs, ["teachers"]));

  const runSlotRows = db
    .prepare("SELECT run_id, slot_id, sequence FROM course_run_slots")
    .all();
  const slotsByRun = new Map();
  runSlotRows.forEach((row) => {
    const list = slotsByRun.get(row.run_id) || [];
    list.push(row);
    slotsByRun.set(row.run_id, list);
  });
  const sortedSlots = getSortedSlots();

  const runs = courseSlots.map((cs) => {
    const rawSlots = slotsByRun.get(cs.cohort_slot_course_id) || [];
    const slotIds =
      rawSlots.length > 0
        ? rawSlots
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((r) => r.slot_id)
        : getConsecutiveSlotIds(
            cs.slot_id,
            Number(cs.slot_span) >= 2
              ? Number(cs.slot_span)
              : computeCourseSlotSpan(cs.course_id),
            sortedSlots
          );

    return {
      run_id: cs.cohort_slot_course_id,
      course_id: cs.course_id,
      slot_id: slotIds[0] ?? cs.slot_id,
      slot_ids: slotIds,
      slot_span: slotIds.length || Number(cs.slot_span) || 1,
      cohorts: cs.cohort_id != null ? [cs.cohort_id] : [],
      teachers: cs.teachers || [],
    };
  });
  res.json(runs);
});

app.post("/api/course-runs", (req, res) => {
  const payload = req.body;
  const cohorts =
    Array.isArray(payload.cohorts) && payload.cohorts.length > 0
      ? payload.cohorts
      : [null];
  const teachers = Array.isArray(payload.teachers) ? payload.teachers : [];
  const slotSpan = computeCourseSlotSpan(payload.course_id);
  const insert = db.prepare(
    "INSERT INTO cohort_slot_courses (course_id, slot_id, cohort_id, teachers, slot_span) VALUES (?, ?, ?, ?, ?)"
  );
  const created = [];
  db.transaction(() => {
    cohorts.forEach((cohortId) => {
      const result = insert.run(
        payload.course_id,
        payload.slot_id,
        cohortId,
        JSON.stringify(teachers),
        slotSpan
      );
      const slotIds = upsertRunSlots(
        Number(result.lastInsertRowid),
        payload.slot_id,
        slotSpan
      );
      created.push({
        run_id: result.lastInsertRowid,
        course_id: payload.course_id,
        slot_id: payload.slot_id,
        slot_ids: slotIds,
        slot_span: slotSpan,
        cohorts: cohortId != null ? [cohortId] : [],
        teachers,
      });
    });
  })();
  res.json(created.length === 1 ? created[0] : created);
});

app.put("/api/course-runs/:id", (req, res) => {
  const payload = req.body;
  const teachers = Array.isArray(payload.teachers) ? payload.teachers : [];
  const slotSpan = computeCourseSlotSpan(payload.course_id);
  const stmt = db.prepare(
    "UPDATE cohort_slot_courses SET course_id = ?, slot_id = ?, cohort_id = ?, teachers = ?, slot_span = ? WHERE cohort_slot_course_id = ?"
  );
  stmt.run(
    payload.course_id,
    payload.slot_id,
    Array.isArray(payload.cohorts) && payload.cohorts.length > 0
      ? payload.cohorts[0]
      : null,
    JSON.stringify(teachers),
    slotSpan,
    req.params.id
  );
  const slotIds = upsertRunSlots(
    Number(req.params.id),
    payload.slot_id,
    slotSpan
  );
  res.json({
    run_id: Number(req.params.id),
    course_id: payload.course_id,
    slot_id: payload.slot_id,
    slot_ids: slotIds,
    slot_span: slotSpan,
    cohorts:
      Array.isArray(payload.cohorts) && payload.cohorts.length > 0
        ? payload.cohorts
        : [],
    teachers,
  });
});

app.delete("/api/course-runs/:id", (req, res) => {
  db.prepare("DELETE FROM course_run_slots WHERE run_id = ?").run(
    req.params.id
  );
  db.prepare(
    "DELETE FROM cohort_slot_courses WHERE cohort_slot_course_id = ?"
  ).run(req.params.id);
  res.json({ success: true });
});

// TEACHER AVAILABILITY
app.get("/api/teacher-availability", (req, res) => {
  // Return map of availability per teacher-slot. We store unavailability in `teacher_slot_unavailability`.
  const teachers = db.prepare("SELECT teacher_id FROM teachers").all();
  const slots = db.prepare("SELECT slot_id FROM slots").all();
  const unavailRows = db
    .prepare(
      "SELECT teacher_id, slot_id FROM teacher_slot_unavailability"
    )
    .all();
  const unavailSet = new Set(
    unavailRows.map((r) => `${r.teacher_id}-${r.slot_id}`)
  );

  const result = {};
  teachers.forEach((t) => {
    slots.forEach((s) => {
      const key = `${t.teacher_id}-${s.slot_id}`;
      result[key] = !unavailSet.has(key);
    });
  });

  res.json(result);
});

app.post("/api/teacher-availability", (req, res) => {
  const data = req.body;
  // data is a map { "teacherId-slotId": boolean } where boolean indicates availability
  const insertUnavail = db.prepare(
    "INSERT OR IGNORE INTO teacher_slot_unavailability (teacher_id, slot_id, created_at) VALUES (?, ?, ?)"
  );
  const deleteUnavail = db.prepare(
    "DELETE FROM teacher_slot_unavailability WHERE teacher_id = ? AND slot_id = ?"
  );

  Object.entries(data).forEach(([key, available]) => {
    const [teacher_id, slot_id] = key.split("-").map(Number);
    const avail = Boolean(available);
    if (!avail) {
      insertUnavail.run(teacher_id, slot_id, new Date().toISOString());
    } else {
      deleteUnavail.run(teacher_id, slot_id);
    }
  });

  res.json({ success: true });
});

// BULK OPERATIONS
app.get("/api/bulk-load", (req, res) => {
  try {
    const courses = db.prepare("SELECT * FROM courses").all();

    const cohorts = db.prepare("SELECT * FROM cohorts").all();

    const teachers = db.prepare("SELECT * FROM teachers").all();

    const teacherCourses = db.prepare("SELECT * FROM teacher_courses").all();

    const slots = db.prepare("SELECT * FROM slots").all();

    const cohortSlotCoursesRaw = db
      .prepare("SELECT * FROM cohort_slot_courses")
      .all();
    const courseRunSlots = db.prepare("SELECT * FROM course_run_slots").all();
    const slotsByRun = new Map();
    courseRunSlots.forEach((row) => {
      const list = slotsByRun.get(row.run_id) || [];
      list.push(row);
      slotsByRun.set(row.run_id, list);
    });
    const sortedSlots = getSortedSlots();

    const courseSlots = cohortSlotCoursesRaw.map((cs) => {
      const parsed = deserializeArrayFields(cs, ["teachers"]);
      return {
        ...cs,
        teachers: parsed.teachers || [],
        course_slot_id: cs.cohort_slot_course_id, // alias for backward compatibility
      };
    });

    // Build courseRuns from cohort_slot_courses (one run per cohort-slot-course)
    const courseRuns = courseSlots.map((cs) => {
      const rawSlots = slotsByRun.get(cs.cohort_slot_course_id) || [];
      const slotIds =
        rawSlots.length > 0
          ? rawSlots
              .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
              .map((r) => r.slot_id)
          : getConsecutiveSlotIds(
              cs.slot_id,
              Number(cs.slot_span) >= 2
                ? Number(cs.slot_span)
                : computeCourseSlotSpan(cs.course_id),
              sortedSlots
            );

      return {
        run_id: cs.cohort_slot_course_id,
        course_id: cs.course_id,
        slot_id: slotIds[0] ?? cs.slot_id,
        slot_ids: slotIds,
        slot_span: slotIds.length || Number(cs.slot_span) || 1,
        cohorts: cs.cohort_id != null ? [cs.cohort_id] : [],
        teachers: cs.teachers || [],
      };
    });

    // Load teacher slot unavailability rows and convert to application format
    const unavailability = db
      .prepare("SELECT * FROM teacher_slot_unavailability")
      .all();
    const teacherAvailability = unavailability.map((a) => {
      const slot = slots.find((s) => s.slot_id === a.slot_id);
      return {
        id: a.id,
        teacher_id: a.teacher_id,
        from_date: slot ? slot.start_date : "",
        to_date: slot ? slot.start_date : "",
        slot_id: a.slot_id,
        type: "busy",
      };
    });

    console.log("Bulk load successful:", {
      courses: courses.length,
      cohorts: cohorts.length,
      teachers: teachers.length,
      slots: slots.length,
      courseRuns: courseRuns.length,
      courseRunSlots: courseRunSlots.length,
      teacherAvailability: Object.keys(teacherAvailability).length,
    });

    const slotDays = db.prepare("SELECT * FROM slot_days").all();
    const courseSlotDays = db.prepare("SELECT * FROM course_slot_days").all();
    const teacherDayUnavailability = db
      .prepare("SELECT * FROM teacher_day_unavailability")
      .all();
    let coursePrerequisites = db
      .prepare("SELECT * FROM course_prerequisites")
      .all();

    // If course_prerequisites is empty but courses.prerequisites exists, derive it
    if (coursePrerequisites.length === 0) {
      coursePrerequisites = [];
      courses.forEach((c) => {
        if (Array.isArray(c.prerequisites)) {
          c.prerequisites.forEach((pid) =>
            coursePrerequisites.push({
              course_id: c.course_id,
              prerequisite_course_id: pid,
            })
          );
        }
      });
    } else {
      // Sync courses.prerequisites from normalized table for frontend compatibility
      const byCourse = new Map();
      coursePrerequisites.forEach((cp) => {
        const list = byCourse.get(cp.course_id) || [];
        list.push(cp.prerequisite_course_id);
        byCourse.set(cp.course_id, list);
      });
      courses.forEach((c) => {
        c.prerequisites = byCourse.get(c.course_id) || [];
      });
    }

    res.json({
      courses,
      cohorts,
      teachers,
      teacherCourses,
      slots,
      courseRuns,
      teacherAvailability,
      courseSlots,
      cohortSlotCourses: courseSlots,
      courseRunSlots,
      slotDays,
      teacherDayUnavailability,
      courseSlotDays,
      coursePrerequisites,
    });
  } catch (error) {
    console.error("Bulk load error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bulk-save", (req, res) => {
  const {
    courses,
    cohorts,
    teachers,
    slots,
    courseRuns,
    teacherAvailability,
    courseSlots,
    cohortSlotCourses,
    slotDays,
    courseSlotDays,
    coursePrerequisites,
  } = req.body;

  const dedupeCourses = (inputCourses) => {
    const codeMap = new Map(); // normalizedCode -> course
    const idMapping = new Map(); // from -> to
    const deduped = [];

    (inputCourses || []).forEach((course) => {
      const normalizedCode = normalizeCourseCode(course.code);
      const courseWithNormalized = { ...course, code: normalizedCode };

      const ensureSelfMapping = (c) => {
        if (c.course_id != null && !idMapping.has(c.course_id)) {
          idMapping.set(c.course_id, c.course_id);
        }
      };

      if (!normalizedCode) {
        deduped.push(courseWithNormalized);
        ensureSelfMapping(courseWithNormalized);
        return;
      }

      const existing = codeMap.get(normalizedCode);
      if (!existing) {
        codeMap.set(normalizedCode, courseWithNormalized);
        deduped.push(courseWithNormalized);
        ensureSelfMapping(courseWithNormalized);
        return;
      }

      const keep =
        (existing.course_id ?? Infinity) <=
        (courseWithNormalized.course_id ?? Infinity)
          ? existing
          : courseWithNormalized;
      const drop = keep === existing ? courseWithNormalized : existing;

      if (keep !== existing) {
        codeMap.set(normalizedCode, keep);
        const idx = deduped.indexOf(existing);
        if (idx !== -1) {
          deduped[idx] = keep;
        }
      }

      if (drop.course_id != null && keep.course_id != null) {
        idMapping.set(drop.course_id, keep.course_id);
      }
      ensureSelfMapping(keep);
    });

    return { dedupedCourses: deduped, courseIdMapping: idMapping };
  };

  const { dedupedCourses, courseIdMapping } = dedupeCourses(courses || []);
  const remapCourseId = (id) => {
    if (id == null) return id;
    return courseIdMapping.get(id) ?? id;
  };
  const creditsByCourseId = new Map(
    (dedupedCourses || []).map((c) => [
      remapCourseId(c.course_id),
      normalizeCredits(c.credits),
    ])
  );
  const spanForCourse = (courseId) =>
    creditsByCourseId.get(courseId) === 15 ? 2 : 1;

  const normalizeId = (value) => {
    if (value === null || value === undefined) return value;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  };

  const dedupeSlots = (inputSlots) => {
    const bySignature = new Map();
    const idMapping = new Map();
    const idForCompare = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Infinity;
    };

    (inputSlots || []).forEach((slot) => {
      const normalized = {
        ...slot,
        slot_id: normalizeId(slot?.slot_id),
        start_date: slot?.start_date ?? "",
        end_date: slot?.end_date ?? "",
      };
      const sig = `${normalized.start_date ?? ""}|${normalized.end_date ?? ""}`;

      const existing = bySignature.get(sig);
      if (!existing) {
        bySignature.set(sig, normalized);
        if (normalized.slot_id != null) {
          idMapping.set(normalized.slot_id, normalized.slot_id);
        }
        return;
      }

      const keep =
        idForCompare(existing.slot_id) <= idForCompare(normalized.slot_id)
          ? existing
          : normalized;
      const drop = keep === existing ? normalized : existing;
      bySignature.set(sig, keep);

      if (drop.slot_id != null && keep.slot_id != null) {
        idMapping.set(drop.slot_id, keep.slot_id);
      }
      if (keep.slot_id != null && !idMapping.has(keep.slot_id)) {
        idMapping.set(keep.slot_id, keep.slot_id);
      }
    });

    const dedupedSlots = Array.from(bySignature.values()).sort((a, b) => {
      const dateDiff = new Date(a.start_date) - new Date(b.start_date);
      if (dateDiff !== 0) return dateDiff;
      return idForCompare(a.slot_id) - idForCompare(b.slot_id);
    });

    return { dedupedSlots, slotIdMapping: idMapping };
  };

  const { dedupedSlots, slotIdMapping } = dedupeSlots(slots || []);
  const remapSlotId = (id) => {
    if (id == null) return id;
    return slotIdMapping.get(id) ?? id;
  };

  const dedupeTeachers = (inputTeachers) => {
    const byName = new Map();
    const idMapping = new Map();
    const idForCompare = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Infinity;
    };
    const normalizeName = (name) =>
      (name ?? "").toString().trim().toLowerCase();

    (inputTeachers || []).forEach((teacher) => {
      const normalized = {
        ...teacher,
        teacher_id: normalizeId(teacher?.teacher_id),
        name: teacher?.name ?? "",
      };
      const key = normalizeName(normalized.name);
      const existing = byName.get(key);

      const ensureSelfMapping = (t) => {
        if (t.teacher_id != null && !idMapping.has(t.teacher_id)) {
          idMapping.set(t.teacher_id, t.teacher_id);
        }
      };

      if (!existing) {
        byName.set(key, normalized);
        ensureSelfMapping(normalized);
        return;
      }

      const keep =
        idForCompare(existing.teacher_id) <= idForCompare(normalized.teacher_id)
          ? existing
          : normalized;
      const drop = keep === existing ? normalized : existing;
      byName.set(key, keep);

      if (drop.teacher_id != null && keep.teacher_id != null) {
        idMapping.set(drop.teacher_id, keep.teacher_id);
      }
      ensureSelfMapping(keep);

      // Merge compatible_courses to avoid losing data
      const keepCourses = Array.isArray(keep.compatible_courses)
        ? keep.compatible_courses
        : [];
      const dropCourses = Array.isArray(drop.compatible_courses)
        ? drop.compatible_courses
        : [];
      const mergedCourses = Array.from(
        new Set([...keepCourses, ...dropCourses])
      );
      if (mergedCourses.length > 0) {
        keep.compatible_courses = mergedCourses;
      }
    });

    const deduped = Array.from(byName.values()).sort((a, b) => {
      const nameDiff = normalizeName(a.name).localeCompare(
        normalizeName(b.name)
      );
      if (nameDiff !== 0) return nameDiff;
      return idForCompare(a.teacher_id) - idForCompare(b.teacher_id);
    });

    return { dedupedTeachers: deduped, teacherIdMapping: idMapping };
  };

  const { dedupedTeachers, teacherIdMapping } = dedupeTeachers(teachers || []);
  const remapTeacherId = (id) => {
    if (id == null) return id;
    return teacherIdMapping.get(id) ?? id;
  };

  const dedupeCohorts = (inputCohorts) => {
    const byStartDate = new Map();
    const idMapping = new Map();
    const idForCompare = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Infinity;
    };
    const normalizeStart = (value) => (value ?? "").toString().trim();

    (inputCohorts || []).forEach((cohort) => {
      const normalized = {
        ...cohort,
        cohort_id: normalizeId(cohort?.cohort_id),
        start_date: normalizeStart(cohort?.start_date),
      };
      const key = normalized.start_date;
      const existing = byStartDate.get(key);

      const ensureSelfMapping = (c) => {
        if (c.cohort_id != null && !idMapping.has(c.cohort_id)) {
          idMapping.set(c.cohort_id, c.cohort_id);
        }
      };

      if (!existing) {
        byStartDate.set(key, normalized);
        ensureSelfMapping(normalized);
        return;
      }

      const keep =
        idForCompare(existing.cohort_id) <= idForCompare(normalized.cohort_id)
          ? existing
          : normalized;
      const drop = keep === existing ? normalized : existing;
      byStartDate.set(key, keep);

      if (drop.cohort_id != null && keep.cohort_id != null) {
        idMapping.set(drop.cohort_id, keep.cohort_id);
      }
      ensureSelfMapping(keep);
    });

    const deduped = Array.from(byStartDate.values()).sort((a, b) => {
      const dateDiff = new Date(a.start_date) - new Date(b.start_date);
      if (dateDiff !== 0) return dateDiff;
      return idForCompare(a.cohort_id) - idForCompare(b.cohort_id);
    });

    deduped.forEach((c, idx) => {
      c.name = `Kull ${idx + 1}`;
    });

    return { dedupedCohorts: deduped, cohortIdMapping: idMapping };
  };

  const { dedupedCohorts, cohortIdMapping } = dedupeCohorts(cohorts || []);
  const remapCohortId = (id) => {
    if (id == null) return id;
    return cohortIdMapping.get(id) ?? id;
  };

  const dedupeCourseSlots = (inputCourseSlots) => {
    const keepByKey = new Map();
    const idMapping = new Map();
    const idForCompare = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Infinity;
    };

    (inputCourseSlots || []).forEach((cs) => {
      const id = normalizeId(
        cs.cohort_slot_course_id ?? cs.course_slot_id ?? null
      );
      const normalized = {
        ...cs,
        course_id: normalizeId(remapCourseId(cs.course_id)),
        slot_id: normalizeId(remapSlotId(cs.slot_id)),
        cohort_id: normalizeId(remapCohortId(cs.cohort_id ?? null)),
        slot_span:
          Number(cs.slot_span) >= 2
            ? Number(cs.slot_span)
            : spanForCourse(normalizeId(remapCourseId(cs.course_id))),
        teachers: Array.isArray(cs.teachers)
          ? Array.from(
              new Set(
                cs.teachers
                  .map((tid) => remapTeacherId(tid))
                  .filter((tid) => tid !== null && tid !== undefined)
              )
            )
          : [],
        cohort_slot_course_id: id,
      };
      const key = `${normalized.course_id}|${normalized.slot_id}|${
        normalized.cohort_id ?? ""
      }`;
      const existing = keepByKey.get(key);

      if (!existing) {
        keepByKey.set(key, normalized);
        if (id != null) {
          idMapping.set(id, id);
        }
        return;
      }

      const keep =
        idForCompare(existing.cohort_slot_course_id) <=
        idForCompare(normalized.cohort_slot_course_id)
          ? existing
          : normalized;
      const drop = keep === existing ? normalized : existing;
      keepByKey.set(key, keep);

      if (
        drop.cohort_slot_course_id != null &&
        keep.cohort_slot_course_id != null
      ) {
        idMapping.set(drop.cohort_slot_course_id, keep.cohort_slot_course_id);
      }

      // Merge teachers so we don't lose assignments
      const keepTeachers = Array.isArray(keep.teachers) ? keep.teachers : [];
      const dropTeachers = Array.isArray(drop.teachers) ? drop.teachers : [];
      const mergedTeachers = Array.from(
        new Set([...keepTeachers, ...dropTeachers])
      );
      keep.teachers = mergedTeachers;
    });

    keepByKey.forEach((cs) => {
      if (
        cs.cohort_slot_course_id != null &&
        !idMapping.has(cs.cohort_slot_course_id)
      ) {
        idMapping.set(cs.cohort_slot_course_id, cs.cohort_slot_course_id);
      }
    });

    return {
      dedupedCourseSlots: Array.from(keepByKey.values()).map((cs) => ({
        ...cs,
        course_slot_id: cs.cohort_slot_course_id, // alias for compatibility
      })),
      courseSlotIdMapping: idMapping,
    };
  };

  // If no explicit cohortSlotCourses or courseSlots are provided, derive them from courseRuns
  const courseSlotsDerivedFromRuns =
    !cohortSlotCourses && !courseSlots && Array.isArray(courseRuns)
      ? courseRuns.flatMap((r) => {
          const cohortsArr =
            Array.isArray(r.cohorts) && r.cohorts.length > 0
              ? r.cohorts
              : [null];
          const runSpan =
            Number(r.slot_span) >= 2
              ? Number(r.slot_span)
              : Array.isArray(r.slot_ids) && r.slot_ids.length > 1
              ? r.slot_ids.length
              : spanForCourse(remapCourseId(r.course_id));
          return cohortsArr.map((cohortId) => ({
            course_id: r.course_id,
            slot_id: r.slot_id,
            cohort_id: cohortId,
            teachers: Array.isArray(r.teachers) ? r.teachers : [],
            slot_span: runSpan,
          }));
        })
      : null;

  const courseSlotsInput =
    cohortSlotCourses ?? courseSlots ?? courseSlotsDerivedFromRuns;
  const { dedupedCourseSlots, courseSlotIdMapping } = dedupeCourseSlots(
    courseSlotsInput || []
  );
  const remapCourseSlotId = (id) => {
    if (id == null) return id;
    return courseSlotIdMapping.get(id) ?? id;
  };

  const courseRunSlotsInput = Array.isArray(req.body.courseRunSlots)
    ? req.body.courseRunSlots
    : [];
  const runSlotOverrides = new Map(); // run_id -> [slot_id]
  courseRunSlotsInput.forEach((rs) => {
    if (rs.run_id == null || rs.slot_id == null) return;
    const list = runSlotOverrides.get(rs.run_id) || [];
    list.push(remapSlotId(rs.slot_id));
    runSlotOverrides.set(rs.run_id, list);
  });

  const orderedSlotsForSpan = (dedupedSlots || [])
    .map((s) => ({
      slot_id: s.slot_id,
      start_date: s.start_date,
    }))
    .sort(
      (a, b) =>
        new Date(a.start_date) - new Date(b.start_date) ||
        Number(a.slot_id) - Number(b.slot_id)
    );
  const computeSlotIdsForRun = (primarySlotId, span, runId) => {
    const overrides = runSlotOverrides.get(runId);
    if (overrides && overrides.length > 0) {
      return Array.from(
        new Set(
          overrides
            .filter((sid) => sid !== null && sid !== undefined)
            .map((sid) => remapSlotId(sid))
            .filter((sid) => sid !== null && sid !== undefined)
        )
      );
    }
    return getConsecutiveSlotIds(
      remapSlotId(primarySlotId),
      span,
      orderedSlotsForSpan
    );
  };

  const courseRunSlotsRows = [];
  (dedupedCourseSlots || []).forEach((cs) => {
    if (cs.cohort_slot_course_id == null) return;
    const spanRaw = Number(cs.slot_span);
    const span =
      Number.isFinite(spanRaw) && spanRaw >= 2
        ? spanRaw
        : spanForCourse(cs.course_id);
    const primarySlotId = remapSlotId(cs.slot_id);
    if (primarySlotId == null) return;
    const slotIds = computeSlotIdsForRun(
      primarySlotId,
      span,
      cs.cohort_slot_course_id
    );
    slotIds
      .filter((slotId) => slotId !== null && slotId !== undefined)
      .forEach((slotId, idx) =>
        courseRunSlotsRows.push({
          run_id: cs.cohort_slot_course_id,
          slot_id: slotId,
          sequence: idx + 1,
        })
      );
  });

  console.log("Bulk save received:", {
    courses: dedupedCourses?.length,
    cohorts: dedupedCohorts?.length,
    teachers: dedupedTeachers?.length,
    slots: dedupedSlots?.length,
    courseRuns: courseRuns?.length,
    teacherAvailability: Array.isArray(teacherAvailability)
      ? teacherAvailability.length
      : Object.keys(teacherAvailability || {}).length,
  });

  try {
    db.prepare("DELETE FROM courses").run();
    db.prepare("DELETE FROM cohorts").run();
    db.prepare("DELETE FROM teachers").run();
    db.prepare("DELETE FROM teacher_courses").run();
    db.prepare("DELETE FROM slots").run();
    db.prepare("DELETE FROM teacher_slot_unavailability").run();
    db.prepare("DELETE FROM teacher_day_unavailability").run();
    db.prepare("DELETE FROM cohort_slot_courses").run();
    db.prepare("DELETE FROM course_run_slots").run();
    db.prepare("DELETE FROM slot_days").run();
    db.prepare("DELETE FROM course_slot_days").run();
    db.prepare("DELETE FROM course_prerequisites").run();

    if (dedupedCourses && dedupedCourses.length > 0) {
      const stmt = db.prepare(
        "INSERT INTO courses (course_id, name, code, credits, created_at) VALUES (?, ?, ?, ?, ?)"
      );
      dedupedCourses.forEach((c) => {
        stmt.run(
          c.course_id,
          c.name,
          normalizeCourseCode(c.code),
          normalizeCredits(c.credits),
          c.created_at || new Date().toISOString()
        );
      });
    }

    // course_prerequisites: prefer explicit payload, otherwise derive from courses.prerequisites
    const prereqRows = Array.isArray(coursePrerequisites)
      ? coursePrerequisites
      : [];
    if (!coursePrerequisites && dedupedCourses.length > 0) {
      dedupedCourses.forEach((c) => {
        (c.prerequisites || []).forEach((pid) => {
          prereqRows.push({
            course_id: remapCourseId(c.course_id),
            prerequisite_course_id: remapCourseId(pid),
          });
        });
      });
    }
    if (prereqRows.length > 0) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO course_prerequisites (course_id, prerequisite_course_id) VALUES (?, ?)"
      );
      prereqRows.forEach((cp) => {
        stmt.run(
          remapCourseId(cp.course_id),
          remapCourseId(cp.prerequisite_course_id)
        );
      });
    }

    if (dedupedCohorts && dedupedCohorts.length > 0) {
      const stmt = db.prepare(
        "INSERT INTO cohorts (cohort_id, name, start_date, planned_size) VALUES (?, ?, ?, ?)"
      );
      dedupedCohorts.forEach((c) => {
        stmt.run(c.cohort_id, c.name, c.start_date, c.planned_size);
      });
    }

    if (dedupedTeachers && dedupedTeachers.length > 0) {
      const stmt = db.prepare(
        "INSERT INTO teachers (teacher_id, name, home_department, created_at) VALUES (?, ?, ?, ?)"
      );
      dedupedTeachers.forEach((t) => {
        stmt.run(
          t.teacher_id,
          t.name,
          t.home_department,
          t.created_at || new Date().toISOString()
        );
      });
    }

    // teacher_courses: prefer explicit payload, otherwise derive from teachers.compatible_courses
    const teacherCoursesPayload = req.body.teacherCourses;
    const teacherCoursesToInsert = Array.isArray(teacherCoursesPayload)
      ? teacherCoursesPayload.map((tc) => ({
          teacher_id: remapTeacherId(tc.teacher_id),
          course_id: remapCourseId(tc.course_id),
        }))
      : [];
    if (!teacherCoursesPayload && Array.isArray(dedupedTeachers)) {
      dedupedTeachers.forEach((t) => {
        (t.compatible_courses || []).forEach((cid) => {
          teacherCoursesToInsert.push({
            teacher_id: remapTeacherId(t.teacher_id),
            course_id: remapCourseId(cid),
          });
        });
      });
    }
    if (teacherCoursesToInsert.length > 0) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO teacher_courses (teacher_id, course_id) VALUES (?, ?)"
      );
      teacherCoursesToInsert.forEach((tc) => {
        stmt.run(tc.teacher_id, tc.course_id);
      });
    }

    if (dedupedSlots && dedupedSlots.length > 0) {
      const stmt = db.prepare(
        "INSERT INTO slots (slot_id, start_date, end_date) VALUES (?, ?, ?)"
      );
      dedupedSlots.forEach((s) => {
        stmt.run(s.slot_id, s.start_date, s.end_date);
      });
      // Ensure slot_days exist for any newly inserted slots
      dedupedSlots.forEach((s) => {
        try {
          ensureSlotDaysForSlot(s);
        } catch (e) {
          console.warn(`Failed to ensure slot_days for slot ${s.slot_id}:`, e);
        }
      });
    }

    // Insert any provided slotDays *before* we process teacher availability
    if (slotDays) {
      // Use INSERT OR IGNORE to avoid primary key conflicts with auto-populated slot_days
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO slot_days (slot_day_id, slot_id, date) VALUES (?, ?, ?)"
      );
      slotDays.forEach((sd) => {
        stmt.run(sd.slot_day_id || null, remapSlotId(sd.slot_id), sd.date);
      });
    }

    if (teacherAvailability) {
      const insertStmt = db.prepare(
        "INSERT OR IGNORE INTO teacher_slot_unavailability (id, teacher_id, slot_id, created_at) VALUES (?, ?, ?, ?)"
      );
      const deleteStmt = db.prepare(
        "DELETE FROM teacher_slot_unavailability WHERE teacher_id = ? AND slot_id = ?"
      );

      const insertDayStmt = db.prepare(
        "INSERT OR IGNORE INTO teacher_day_unavailability (id, teacher_id, slot_day_id, created_at) VALUES (?, ?, ?, ?)"
      );
      const deleteDayStmt = db.prepare(
        "DELETE FROM teacher_day_unavailability WHERE teacher_id = ? AND slot_day_id = ?"
      );

      // Handle both array format (from store) and object format (legacy)
      if (Array.isArray(teacherAvailability)) {
        // Array format: { id, teacher_id, from_date, to_date, type, slot_id }
        teacherAvailability.forEach((a) => {
            if (a.slot_id) {
              if (a.type === "busy") {
                insertStmt.run(a.id || null, remapTeacherId(a.teacher_id), remapSlotId(a.slot_id), a.created_at || new Date().toISOString());
              } else {
                deleteStmt.run(remapTeacherId(a.teacher_id), remapSlotId(a.slot_id));
              }
            } else if (a.from_date) {
              // Decide whether this is intended as a slot-level entry or day-level.
              // If the client explicitly provided a slot_id, prefer slot-level.
              // Otherwise only treat as slot-level if the provided range equals the slot's full range.
              const startStr = (a.from_date || "").split("T")[0];
              const endStr = (a.to_date || a.from_date || "").split("T")[0];
              if (!startStr) return;

              const slot = dedupedSlots?.find((s) => s.start_date === startStr);
              const isFullSlotRange =
                slot && endStr && slot.end_date === endStr;

              if (a.slot_id || isFullSlotRange) {
                console.log(`teacherAvailability: treating as slot-level for teacher ${a.teacher_id} (${startStr} - ${endStr}), slot_id=${slot ? slot.slot_id : a.slot_id}, slotRangeMatch=${isFullSlotRange}`);
                // Treat as slot-level availability
                if (a.type === "busy") {
                  insertStmt.run(
                    a.id || null,
                    remapTeacherId(a.teacher_id),
                    slot ? slot.slot_id : remapSlotId(a.slot_id),
                    a.created_at || new Date().toISOString()
                  );
                } else {
                  deleteStmt.run(remapTeacherId(a.teacher_id), slot ? slot.slot_id : remapSlotId(a.slot_id));
                }
              } else {
                // Treat as day-level unavailability (single date or range)
                const dayRows = db
                  .prepare(
                    "SELECT slot_day_id, date FROM slot_days WHERE date >= ? AND date <= ?"
                  )
                  .all(startStr, endStr || startStr);

                if (dayRows && dayRows.length > 0) {
                  dayRows.forEach((dr) => {
                    if (a.type === "busy") {
                      insertDayStmt.run(
                        a.id || null,
                        remapTeacherId(a.teacher_id),
                        dr.slot_day_id,
                        a.created_at || new Date().toISOString()
                      );
                    } else {
                      deleteDayStmt.run(remapTeacherId(a.teacher_id), dr.slot_day_id);
                    }
                  });
                } else {
                  console.warn(
                    `No slot_days found for teacher day unavailability ${startStr} - ${endStr}`
                  );
                }
              }
            }
        });
      } else {
        // Object format: { "teacherId-slotId": boolean } where boolean is availability
        Object.entries(teacherAvailability).forEach(([key, available]) => {
          const [teacher_id, slot_id] = key.split("-").map(Number);
          if (available) {
            // available -> ensure no unavailability row exists
            deleteStmt.run(remapTeacherId(teacher_id), remapSlotId(slot_id));
          } else {
            // unavailable -> insert unavailability row
            insertStmt.run(null, remapTeacherId(teacher_id), remapSlotId(slot_id), new Date().toISOString());
          }
        });
      }
    }

    if (dedupedCourseSlots && dedupedCourseSlots.length > 0) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO cohort_slot_courses (cohort_slot_course_id, course_id, slot_id, cohort_id, teachers, slot_span, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );
      dedupedCourseSlots.forEach((cs) => {
        stmt.run(
          cs.cohort_slot_course_id || null,
          cs.course_id,
          cs.slot_id,
          cs.cohort_id ?? null,
          JSON.stringify(cs.teachers || []),
          Number(cs.slot_span) >= 2
            ? Number(cs.slot_span)
            : spanForCourse(cs.course_id),
          cs.created_at || new Date().toISOString()
        );
      });
    }

    // `slotDays` are handled earlier (inserted just after slots) to avoid
    // duplicate inserts here. No-op.

    if (courseSlotDays) {
      const stmt = db.prepare(
        "INSERT INTO course_slot_days (course_slot_day_id, course_slot_id, date, is_default, active) VALUES (?, ?, ?, ?, ?)"
      );
      courseSlotDays.forEach((csd) => {
        const courseSlotId =
          csd.cohort_slot_course_id ?? csd.course_slot_id ?? null;
        stmt.run(
          csd.course_slot_day_id || null,
          remapCourseSlotId(courseSlotId),
          csd.date,
          csd.is_default ? 1 : 0,
          csd.active === 0 ? 0 : 1
        );
      });
    }

    if (courseRunSlotsRows.length > 0) {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO course_run_slots (run_id, slot_id, sequence) VALUES (?, ?, ?)"
      );
      courseRunSlotsRows.forEach((rs) => {
        stmt.run(rs.run_id, rs.slot_id, rs.sequence || 1);
      });
    }

    console.log("Bulk save completed successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Bulk save error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
