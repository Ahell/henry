import { db } from './server/db/index.js';

db.prepare("SELECT * FROM joint_course_runs LIMIT 1").get();
db.prepare("SELECT joint_run_id FROM cohort_slot_courses WHERE joint_run_id IS NOT NULL LIMIT 1").get();
