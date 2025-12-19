import { db } from "../../../../db/index.js";

export function insertTeachers(teachers = []) {
  if (!teachers.length) return;
  const stmt = db.prepare(
    "INSERT INTO teachers (teacher_id, name, home_department, created_at) VALUES (?, ?, ?, ?)"
  );
  teachers.forEach((t) => {
    stmt.run(
      t.teacher_id,
      t.name,
      t.home_department,
      t.created_at || new Date().toISOString()
    );
  });
}

