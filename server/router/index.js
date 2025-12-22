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

router.use("/admin", adminRouter);
router.use("/bulk", bulkRouter);
router.use("/cohorts", cohortsRouter);
router.use("/course-runs", courseRunsRouter);
router.use("/courses", coursesRouter);
router.use("/slots", slotsRouter);
router.use("/teacher-availability", availabilityRouter);
router.use("/teachers", teachersRouter);

export default router;
