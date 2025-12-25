import { db } from './server/db/index.js';
console.log("DB initialized and migrations run.");

const row = db.prepare("SELECT * FROM joint_course_runs LIMIT 1").get();
console.log("Sample JointCourseRun:", row);

const child = db.prepare("SELECT joint_run_id FROM cohort_slot_courses WHERE joint_run_id IS NOT NULL LIMIT 1").get();
console.log("Sample Child with Link:", child);
