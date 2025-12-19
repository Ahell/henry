import { db } from "../../../../db/index.js";

export function insertCohorts(cohorts = []) {
  if (!cohorts.length) return;
  const stmt = db.prepare(
    "INSERT INTO cohorts (cohort_id, name, start_date, planned_size) VALUES (?, ?, ?, ?)"
  );
  cohorts.forEach((c) => {
    stmt.run(c.cohort_id, c.name, c.start_date, c.planned_size);
  });
}

