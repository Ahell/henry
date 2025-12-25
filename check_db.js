import { db } from './server/db/index.js';

try {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='joint_course_run_teachers'").get();
  console.log("Table 'joint_course_run_teachers' exists:", !!tableExists);
  
  if (tableExists) {
      const count = db.prepare("SELECT count(*) as count FROM joint_course_run_teachers").get();
      console.log("Row count:", count);
  } else {
      console.log("Table does not exist. Migrations probably haven't run.");
      // We can try to run them here if we want, but importing db/index.js ALREADY runs them.
      // So if we are here and table doesn't exist, something is wrong with migration execution.
  }
} catch (e) {
  console.error(e);
}