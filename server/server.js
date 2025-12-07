import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const db = new Database(join(__dirname, "henry.db"));

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    course_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    credits INTEGER,
    prerequisites TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cohorts (
    cohort_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT,
    planned_size INTEGER,
    courses TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    home_department TEXT,
    compatible_courses TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS slots (
    slot_id INTEGER PRIMARY KEY,
    year INTEGER,
    term TEXT,
    period INTEGER,
    start_date TEXT,
    end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS course_runs (
    run_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    slot_id INTEGER,
    cohorts TEXT,
    teachers TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teacher_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER,
    slot_id INTEGER,
    available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, slot_id)
  );
`);

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
  res.json(courses.map((c) => deserializeArrayFields(c, ["prerequisites"])));
});

app.post("/api/courses", (req, res) => {
  const course = serializeArrayFields(req.body, ["prerequisites"]);
  const stmt = db.prepare(
    "INSERT INTO courses (course_id, name, code, credits, prerequisites) VALUES (?, ?, ?, ?, ?)"
  );
  stmt.run(
    course.course_id,
    course.name,
    course.code,
    course.credits,
    course.prerequisites
  );
  res.json(deserializeArrayFields(course, ["prerequisites"]));
});

app.put("/api/courses/:id", (req, res) => {
  const course = serializeArrayFields(req.body, ["prerequisites"]);
  const stmt = db.prepare(
    "UPDATE courses SET name = ?, code = ?, credits = ?, prerequisites = ? WHERE course_id = ?"
  );
  stmt.run(
    course.name,
    course.code,
    course.credits,
    course.prerequisites,
    req.params.id
  );
  res.json(deserializeArrayFields(course, ["prerequisites"]));
});

app.delete("/api/courses/:id", (req, res) => {
  db.prepare("DELETE FROM courses WHERE course_id = ?").run(req.params.id);
  res.json({ success: true });
});

// COHORTS
app.get("/api/cohorts", (req, res) => {
  const cohorts = db.prepare("SELECT * FROM cohorts").all();
  res.json(cohorts.map((c) => deserializeArrayFields(c, ["courses"])));
});

app.post("/api/cohorts", (req, res) => {
  const cohort = serializeArrayFields(req.body, ["courses"]);
  const stmt = db.prepare(
    "INSERT INTO cohorts (cohort_id, name, start_date, planned_size, courses) VALUES (?, ?, ?, ?, ?)"
  );
  stmt.run(
    cohort.cohort_id,
    cohort.name,
    cohort.start_date,
    cohort.planned_size,
    cohort.courses
  );
  res.json(deserializeArrayFields(cohort, ["courses"]));
});

app.put("/api/cohorts/:id", (req, res) => {
  const cohort = serializeArrayFields(req.body, ["courses"]);
  const stmt = db.prepare(
    "UPDATE cohorts SET name = ?, start_date = ?, planned_size = ?, courses = ? WHERE cohort_id = ?"
  );
  stmt.run(
    cohort.name,
    cohort.start_date,
    cohort.planned_size,
    cohort.courses,
    req.params.id
  );
  res.json(deserializeArrayFields(cohort, ["courses"]));
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
    "INSERT INTO slots (slot_id, year, term, period, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)"
  );
  stmt.run(
    slot.slot_id,
    slot.year,
    slot.term,
    slot.period,
    slot.start_date,
    slot.end_date
  );
  res.json(slot);
});

// COURSE RUNS
app.get("/api/course-runs", (req, res) => {
  const runs = db.prepare("SELECT * FROM course_runs").all();
  res.json(runs.map((r) => deserializeArrayFields(r, ["cohorts", "teachers"])));
});

app.post("/api/course-runs", (req, res) => {
  const run = serializeArrayFields(req.body, ["cohorts", "teachers"]);
  const stmt = db.prepare(
    "INSERT INTO course_runs (course_id, slot_id, cohorts, teachers) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(
    run.course_id,
    run.slot_id,
    run.cohorts,
    run.teachers
  );
  run.run_id = result.lastInsertRowid;
  res.json(deserializeArrayFields(run, ["cohorts", "teachers"]));
});

app.put("/api/course-runs/:id", (req, res) => {
  const run = serializeArrayFields(req.body, ["cohorts", "teachers"]);
  const stmt = db.prepare(
    "UPDATE course_runs SET course_id = ?, slot_id = ?, cohorts = ?, teachers = ? WHERE run_id = ?"
  );
  stmt.run(
    run.course_id,
    run.slot_id,
    run.cohorts,
    run.teachers,
    req.params.id
  );
  res.json(deserializeArrayFields(run, ["cohorts", "teachers"]));
});

app.delete("/api/course-runs/:id", (req, res) => {
  db.prepare("DELETE FROM course_runs WHERE run_id = ?").run(req.params.id);
  res.json({ success: true });
});

// TEACHER AVAILABILITY
app.get("/api/teacher-availability", (req, res) => {
  const availability = db.prepare("SELECT * FROM teacher_availability").all();
  const result = {};
  availability.forEach((a) => {
    const key = `${a.teacher_id}-${a.slot_id}`;
    result[key] = a.available === 1;
  });
  res.json(result);
});

app.post("/api/teacher-availability", (req, res) => {
  const data = req.body;
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO teacher_availability (teacher_id, slot_id, available) VALUES (?, ?, ?)"
  );

  Object.entries(data).forEach(([key, available]) => {
    const [teacher_id, slot_id] = key.split("-").map(Number);
    stmt.run(teacher_id, slot_id, available ? 1 : 0);
  });

  res.json({ success: true });
});

// BULK OPERATIONS
app.get("/api/bulk-load", (req, res) => {
  try {
    const courses = db.prepare("SELECT * FROM courses").all()
      .map((c) => deserializeArrayFields(c, ["prerequisites"]));
    
    const cohorts = db.prepare("SELECT * FROM cohorts").all()
      .map((c) => deserializeArrayFields(c, ["courses"]));
    
    const teachers = db.prepare("SELECT * FROM teachers").all()
      .map((t) => deserializeArrayFields(t, ["compatible_courses"]));
    
    const slots = db.prepare("SELECT * FROM slots").all();
    
    const courseRuns = db.prepare("SELECT * FROM course_runs").all()
      .map((r) => deserializeArrayFields(r, ["cohorts", "teachers"]));
    
    const availability = db.prepare("SELECT * FROM teacher_availability").all();
    const teacherAvailability = {};
    availability.forEach((a) => {
      const key = `${a.teacher_id}-${a.slot_id}`;
      teacherAvailability[key] = a.available === 1;
    });

    console.log("Bulk load successful:", {
      courses: courses.length,
      cohorts: cohorts.length,
      teachers: teachers.length,
      slots: slots.length,
      courseRuns: courseRuns.length,
      teacherAvailability: Object.keys(teacherAvailability).length,
    });

    res.json({
      courses,
      cohorts,
      teachers,
      slots,
      courseRuns,
      teacherAvailability,
    });
  } catch (error) {
    console.error("Bulk load error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bulk-save", (req, res) => {
  const { courses, cohorts, teachers, slots, courseRuns, teacherAvailability } =
    req.body;

  console.log("Bulk save received:", {
    courses: courses?.length,
    cohorts: cohorts?.length,
    teachers: teachers?.length,
    slots: slots?.length,
    courseRuns: courseRuns?.length,
    teacherAvailability: Object.keys(teacherAvailability || {}).length,
  });

  try {
    db.prepare("DELETE FROM courses").run();
    db.prepare("DELETE FROM cohorts").run();
    db.prepare("DELETE FROM teachers").run();
    db.prepare("DELETE FROM slots").run();
    db.prepare("DELETE FROM course_runs").run();
    db.prepare("DELETE FROM teacher_availability").run();

    if (courses) {
      const stmt = db.prepare(
        "INSERT INTO courses (course_id, name, code, credits, prerequisites) VALUES (?, ?, ?, ?, ?)"
      );
      courses.forEach((c) => {
        const course = serializeArrayFields(c, ["prerequisites"]);
        stmt.run(
          course.course_id,
          course.name,
          course.code,
          course.credits,
          course.prerequisites
        );
      });
    }

    if (cohorts) {
      const stmt = db.prepare(
        "INSERT INTO cohorts (cohort_id, name, start_date, planned_size, courses) VALUES (?, ?, ?, ?, ?)"
      );
      cohorts.forEach((c) => {
        const cohort = serializeArrayFields(c, ["courses"]);
        stmt.run(
          cohort.cohort_id,
          cohort.name,
          cohort.start_date,
          cohort.planned_size,
          cohort.courses
        );
      });
    }

    if (teachers) {
      const stmt = db.prepare(
        "INSERT INTO teachers (teacher_id, name, home_department, compatible_courses) VALUES (?, ?, ?, ?)"
      );
      teachers.forEach((t) => {
        const teacher = serializeArrayFields(t, ["compatible_courses"]);
        stmt.run(
          teacher.teacher_id,
          teacher.name,
          teacher.home_department,
          teacher.compatible_courses
        );
      });
    }

    if (slots) {
      const stmt = db.prepare(
        "INSERT INTO slots (slot_id, year, term, period, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)"
      );
      slots.forEach((s) => {
        stmt.run(s.slot_id, s.year, s.term, s.period, s.start_date, s.end_date);
      });
    }

    if (courseRuns) {
      const stmt = db.prepare(
        "INSERT INTO course_runs (course_id, slot_id, cohorts, teachers) VALUES (?, ?, ?, ?)"
      );
      courseRuns.forEach((r) => {
        const run = serializeArrayFields(r, ["cohorts", "teachers"]);
        stmt.run(run.course_id, run.slot_id, run.cohorts, run.teachers);
      });
    }

    if (teacherAvailability) {
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO teacher_availability (teacher_id, slot_id, available) VALUES (?, ?, ?)"
      );
      Object.entries(teacherAvailability).forEach(([key, available]) => {
        const [teacher_id, slot_id] = key.split("-").map(Number);
        stmt.run(teacher_id, slot_id, available ? 1 : 0);
      });
    }

    console.log("Bulk save completed successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Bulk save error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
