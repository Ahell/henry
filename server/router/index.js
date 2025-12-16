import express from "express";
import adminRouter from "./admin.js";
import availabilityRouter from "./availability.js";
import bulkRouter from "./bulk.js";
import cohortsRouter from "./cohorts.js";
import courseRunsRouter from "./courseRuns.js";
import coursesRouter from "./courses.js";
import slotsRouter from "./slots.js";
import teachersRouter from "./teachers.js";

const router = express.Router();

router.use("/courses", coursesRouter);
router.use("/cohorts", cohortsRouter);
router.use("/teachers", teachersRouter);
router.use("/slots", slotsRouter);
router.use("/course-runs", courseRunsRouter);
router.use("/teacher-availability", availabilityRouter);
router.use(bulkRouter);
router.use("/admin", adminRouter);

export default router;
