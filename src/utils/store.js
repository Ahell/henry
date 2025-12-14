import { LitElement, html, css } from "lit";
import { seedData } from "../data/seedData.js";

export const DEFAULT_SLOT_LENGTH_DAYS = 28;

// Dev-safe alert wrapper: logs as warning in dev, shows native alert in prod
function showAlert(msg) {
  const isDev =
    typeof import.meta !== "undefined"
      ? Boolean(import.meta.env && import.meta.env.DEV)
      : typeof window !== "undefined" &&
        window.location &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");
  if (isDev) {
    console.warn("ALERT suppressed in dev:", msg);
  } else {
    alert(msg);
  }
}

export class DataStore {
  constructor() {
    this.courses = [];
    this.cohorts = [];
    this.teachers = [];
    this.teacherCourses = [];
    this.coursePrerequisites = [];
    this.slots = [];
    this.courseRuns = [];
    this.teacherAvailability = [];
    this.courseSlots = [];
    this.slotDays = [];
    this.courseSlotDays = [];
    this.teachingDays = []; // Array of {slot_id, date} objects marking teaching days
    this.examDates = []; // Array of {slot_id, date} objects marking exam dates (single per slot)
    this.prerequisiteProblems = [];
    this.listeners = [];

    // Load data from backend asynchronously
    this.loadFromBackend();
  }

  _normalizeDateOnly(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  }

  _defaultSlotEndDate(startDate) {
    const start =
      startDate instanceof Date ? new Date(startDate) : new Date(startDate);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start);
    end.setDate(end.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
    return end;
  }

  _normalizeCourses(rawCourses) {
    if (!Array.isArray(rawCourses)) return [];

    const courses = (rawCourses || []).map((c, idx) => {
      const courseId =
        c?.course_id != null && Number.isFinite(Number(c.course_id))
          ? Number(c.course_id)
          : idx + 1;
      const creditsValueRaw = Number.isFinite(Number(c?.credits ?? c?.hp))
        ? Number(c.credits ?? c.hp)
        : 7.5;
      const creditsValue = creditsValueRaw === 15 ? 15 : 7.5;
      return {
        course_id: courseId,
        code: c?.code || "",
        name: c?.name || "",
        credits: creditsValue,
        prerequisites: Array.isArray(c?.prerequisites)
          ? [...c.prerequisites]
          : [],
      };
    });

    const codeToId = new Map();
    courses.forEach((c) => {
      if (c.code) {
        codeToId.set(c.code, c.course_id);
      }
    });

    rawCourses.forEach((raw, idx) => {
      if (Array.isArray(raw?.prerequisite_codes)) {
        const target = courses[idx];
        target.prerequisites = raw.prerequisite_codes
          .map((code) => codeToId.get(code))
          .filter((id) => id != null);
      }
    });

    return courses;
  }

  _getSlotRange(slot) {
    if (!slot) return null;
    const startStr = this._normalizeDateOnly(slot.start_date);
    if (!startStr) return null;
    const endStr =
      this._normalizeDateOnly(slot.end_date) ||
      this._normalizeDateOnly(this._defaultSlotEndDate(startStr));
    if (!endStr) return null;
    return {
      start: new Date(startStr),
      end: new Date(endStr),
      startStr,
      endStr,
    };
  }

  _findOverlappingSlot(startDateStr, endDateStr, ignoreSlotId = null) {
    const normalizedStart = this._normalizeDateOnly(startDateStr);
    const normalizedEnd = this._normalizeDateOnly(endDateStr);
    if (!normalizedStart || !normalizedEnd) return null;

    const start = new Date(normalizedStart);
    const end = new Date(normalizedEnd);

    return this.slots.find((slot) => {
      if (
        ignoreSlotId != null &&
        String(slot.slot_id) === String(ignoreSlotId)
      ) {
        return false;
      }
      const range = this._getSlotRange(slot);
      if (!range) return false;
      return start <= range.end && end >= range.start;
    });
  }

  _assertAllSlotsNonOverlapping() {
    const ranges = [];
    for (const slot of this.slots || []) {
      const range = this._getSlotRange(slot);
      if (!range) {
        const message = "Alla slots måste ha giltiga start- och slutdatum.";
        showAlert(message);
        throw new Error(message);
      }
      ranges.push({ slot, range });
    }

    ranges.sort(
      (a, b) => a.range.start.getTime() - b.range.start.getTime()
    );

    for (let i = 1; i < ranges.length; i++) {
      const prev = ranges[i - 1];
      const current = ranges[i];
      if (current.range.start <= prev.range.end) {
        const message = `Slots ${prev.range.startStr}–${prev.range.endStr} och ${current.range.startStr}–${current.range.endStr} får inte överlappa.`;
        showAlert(message);
        throw new Error(message);
      }
    }
  }

  _normalizeSlotsInPlace() {
    this.slots = (this.slots || []).map((slot) => {
      const startStr = this._normalizeDateOnly(slot.start_date);
      if (!startStr) return slot;
      const expectedEnd = this._defaultSlotEndDate(startStr);
      const endStr = this._normalizeDateOnly(expectedEnd);
      return endStr
        ? { ...slot, start_date: startStr, end_date: endStr }
        : { ...slot, start_date: startStr };
    });
  }

  // Load data from backend
  async loadFromBackend() {
    try {
      const response = await fetch("http://localhost:3001/api/bulk-load");

      if (!response.ok) {
        console.error("Backend load failed, using seed data");
        this._loadSnapshot(seedData);
        this.notify();
        return;
      }

      const data = await response.json();

      // Check if any data exists
      if (
        (!data.courses || data.courses.length === 0) &&
        (!data.cohorts || data.cohorts.length === 0) &&
        (!data.teachers || data.teachers.length === 0) &&
        (!data.slots || data.slots.length === 0)
      ) {
        console.log("No data in backend, loading seed data");
        this._loadSnapshot(seedData);
        this.notify();
        // Persist seed to backend so subsequent loads have data
        this.saveData().catch((e) =>
          console.error("Failed to persist seed data:", e)
        );
        return;
      }

      // Load data from backend
      this.courses = this._normalizeCourses(data.courses || []);
      this.cohorts = data.cohorts || [];
      this.teachers = data.teachers || [];
      this.teacherCourses = data.teacherCourses || [];
      this.coursePrerequisites = data.coursePrerequisites || [];
      this.slots = data.slots || [];
      this.courseRuns = data.courseRuns || [];
      this.teacherAvailability = data.teacherAvailability || [];
      this.teachingDays = data.teachingDays || [];
      this.examDates = data.examDates || [];
      this.courseSlots = data.courseSlots || [];
      this.slotDays = data.slotDays || [];
      this.courseSlotDays = data.courseSlotDays || [];
      this._ensureTeacherCoursesFromCompatible();
      this._ensurePrerequisitesFromNormalized();
      this._ensureTeacherCompatibleFromCourses();

      // Fallback: if backend omitted courseRuns or teacherAvailability, fall back to seed data
      if (
        (!this.courseRuns || this.courseRuns.length === 0) &&
        seedData.courseRuns &&
        seedData.courseRuns.length > 0
      ) {
        console.warn(
          "Backend returned no courseRuns - falling back to seed data courseRuns"
        );
        this.courseRuns = seedData.courseRuns;
      }

      if (
        (!this.teacherAvailability || this.teacherAvailability.length === 0) &&
        seedData.teacherAvailability &&
        seedData.teacherAvailability.length > 0
      ) {
        console.warn(
          "Backend returned no teacherAvailability - falling back to seed data teacherAvailability"
        );
        this.teacherAvailability = seedData.teacherAvailability;
      }

      // Derive normalized structures if missing
      this._ensureCourseSlotsFromRuns();
      this._ensureSlotDaysFromSlots();
      this._ensureCourseSlotDayDefaults();
      this._normalizeSlotsInPlace();
      this._assertAllSlotsNonOverlapping();

      // Validate and fix teacher assignments (ensure one course per teacher per slot)
      this.validateTeacherAssignments();

      // Validate courses have available teachers (remove those that don't)
      const removedCourses = this.validateCoursesHaveTeachers();

      // If teachers exist but none have `compatible_courses` defined,
      // try to infer from assigned runs or fall back to a random assignment.
      const teachersMissingCompat =
        this.teachers.length > 0 &&
        this.teachers.every(
          (t) => !t.compatible_courses || t.compatible_courses.length === 0
        );

      if (teachersMissingCompat) {
        // Infer from assigned runs where possible
        for (const teacher of this.teachers) {
          const assignedCourseIds = new Set();
          for (const run of this.courseRuns) {
            if (
              run.teacher_id === teacher.teacher_id ||
              (run.teachers && run.teachers.includes(teacher.teacher_id))
            ) {
              assignedCourseIds.add(run.course_id);
            }
          }
          if (assignedCourseIds.size > 0) {
            teacher.compatible_courses = Array.from(assignedCourseIds);
          }
        }

        // If still missing, assign random compatible courses so the UI can show options
        const stillMissing = this.teachers.some(
          (t) => !t.compatible_courses || t.compatible_courses.length === 0
        );
        if (stillMissing) {
          this.randomizeTeacherCourses(2, 5);
        }
      }

      // Calculate prerequisite problems
      this.prerequisiteProblems = this.findCoursesWithMissingPrerequisites();

      // Notify listeners that data is loaded
      this.listeners.forEach((l) => l());

      if (removedCourses.length > 0) {
        // Delay alert to after page load
        setTimeout(() => {
          let message = `Följande kurser flyttades till depån (ingen lärare tillgänglig):\n\n`;
          message += removedCourses
            .map(
              (c) =>
                `"${c.courseName}" (${c.courseCode}) för ${c.cohorts.join(
                  ", "
                )}`
            )
            .join("\n");

          // Add prerequisite warnings if any
          if (this.prerequisiteProblems.length > 0) {
            message += `\n\n⚠️ VARNING: Följande kurser saknar nu sina spärrkurser:\n\n`;
            const problemsByCourseCohort = new Map();
            for (const p of this.prerequisiteProblems) {
              const key = `${p.cohortName}-${p.courseCode}`;
              if (!problemsByCourseCohort.has(key)) {
                problemsByCourseCohort.set(key, {
                  cohortName: p.cohortName,
                  courseCode: p.courseCode,
                  courseName: p.courseName,
                  missingPrereqs: [],
                });
              }
              problemsByCourseCohort
                .get(key)
                .missingPrereqs.push(p.missingPrereqCode);
            }
            message += Array.from(problemsByCourseCohort.values())
              .map(
                (p) =>
                  `${p.cohortName}: "${
                    p.courseName
                  }" saknar spärrkurs ${p.missingPrereqs.join(", ")}`
              )
              .join("\n");
          }

          showAlert(message);
        }, 100);
        this.saveData(); // Save the changes
      } else if (this.prerequisiteProblems.length > 0) {
        // Show only prerequisite warnings if no courses were removed but there are issues
        setTimeout(() => {
          let message = `⚠️ VARNING: Följande kurser saknar sina spärrkurser:\n\n`;
          const problemsByCourseCohort = new Map();
          for (const p of this.prerequisiteProblems) {
            const key = `${p.cohortName}-${p.courseCode}`;
            if (!problemsByCourseCohort.has(key)) {
              problemsByCourseCohort.set(key, {
                cohortName: p.cohortName,
                courseCode: p.courseCode,
                courseName: p.courseName,
                missingPrereqs: [],
              });
            }
            problemsByCourseCohort
              .get(key)
              .missingPrereqs.push(p.missingPrereqCode);
          }
          message += Array.from(problemsByCourseCohort.values())
            .map(
              (p) =>
                `${p.cohortName}: "${
                  p.courseName
                }" saknar spärrkurs ${p.missingPrereqs.join(", ")}`
            )
            .join("\n");

          showAlert(message);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to load from backend:", error);
      console.log("Loading seed data as fallback");
      this.importData(seedData);
    }
  }

  // Ensure each teacher is only assigned to one course per slot
  validateTeacherAssignments() {
    // Group runs by slot
    const runsBySlot = new Map();
    for (const run of this.courseRuns) {
      if (!runsBySlot.has(run.slot_id)) {
        runsBySlot.set(run.slot_id, []);
      }
      runsBySlot.get(run.slot_id).push(run);
    }

    // For each slot, ensure each teacher only appears in one course
    for (const [slotId, runsInSlot] of runsBySlot) {
      const teacherToCourse = new Map(); // teacherId -> courseId

      for (const run of runsInSlot) {
        if (!run.teachers) continue;

        const validTeachers = [];
        for (const teacherId of run.teachers) {
          if (!teacherToCourse.has(teacherId)) {
            // First time seeing this teacher in this slot - keep them
            teacherToCourse.set(teacherId, run.course_id);
            validTeachers.push(teacherId);
          } else if (teacherToCourse.get(teacherId) === run.course_id) {
            // Same course (different cohort run) - keep them
            validTeachers.push(teacherId);
          }
          // else: teacher already assigned to different course - skip
        }
        run.teachers = validTeachers;
      }
    }
  }

  // Remove courses that have no available teachers
  validateCoursesHaveTeachers() {
    const removedCourses = [];

    // Group runs by slot and course
    const slotCourseRuns = new Map(); // "slotId-courseId" -> runs[]
    for (const run of this.courseRuns) {
      const key = `${run.slot_id}-${run.course_id}`;
      if (!slotCourseRuns.has(key)) {
        slotCourseRuns.set(key, []);
      }
      slotCourseRuns.get(key).push(run);
    }

    // Check each course in each slot
    for (const [key, runs] of slotCourseRuns) {
      if (runs.length === 0) continue;

      const courseId = runs[0].course_id;
      const slotId = runs[0].slot_id;
      const slot = this.getSlot(slotId);
      const slotDate = slot?.start_date;

      if (!slotDate) continue;

      // Check if any teacher is assigned to this course
      const hasAssignedTeacher = runs.some(
        (r) => r.teachers && r.teachers.length > 0
      );
      if (hasAssignedTeacher) continue;

      // Check if any compatible teacher is available
      const teachersAssignedToThisCourse = new Set();
      runs.forEach((r) => {
        if (r.teachers) {
          r.teachers.forEach((tid) => teachersAssignedToThisCourse.add(tid));
        }
      });

      const availableTeachers = this.teachers.filter((t) => {
        if (!t.compatible_courses || !t.compatible_courses.includes(courseId)) {
          return false;
        }
        const isAssignedToThisCourse = teachersAssignedToThisCourse.has(
          t.teacher_id
        );
        const isUnavailable = this.isTeacherUnavailable(t.teacher_id, slotDate);
        return isAssignedToThisCourse || !isUnavailable;
      });

      if (availableTeachers.length === 0) {
        // No available teachers - remove all runs for this course in this slot
        const course = this.getCourse(courseId);
        const affectedCohorts = runs
          .flatMap((r) => r.cohorts || [])
          .map((cohortId) => this.getCohort(cohortId)?.name)
          .filter(Boolean);

        removedCourses.push({
          courseName: course?.name || "Okänd kurs",
          courseCode: course?.code || "",
          courseId: courseId,
          cohorts: affectedCohorts,
          cohortIds: runs.flatMap((r) => r.cohorts || []),
        });

        // Remove the runs
        for (const run of runs) {
          const index = this.courseRuns.findIndex(
            (r) => r.run_id === run.run_id
          );
          if (index !== -1) {
            this.courseRuns.splice(index, 1);
          }
        }
      }
    }

    return removedCourses;
  }

  // Find courses that are missing their prerequisites
  findCoursesWithMissingPrerequisites() {
    const problems = []; // { cohortId, cohortName, courseId, courseName, missingPrereqId, missingPrereqName }

    // Get all cohorts
    for (const cohort of this.cohorts) {
      // Get all runs for this cohort
      const cohortRuns = this.courseRuns.filter(
        (r) => r.cohorts && r.cohorts.includes(cohort.cohort_id)
      );

      // For each run, check if its prerequisites are scheduled before it
      for (const run of cohortRuns) {
        const course = this.getCourse(run.course_id);
        if (
          !course ||
          !course.prerequisites ||
          course.prerequisites.length === 0
        ) {
          continue;
        }

        const slot = this.getSlot(run.slot_id);
        if (!slot) continue;
        const runDate = new Date(slot.start_date);

        // Check each prerequisite
        for (const prereqId of course.prerequisites) {
          const prereqCourse = this.getCourse(prereqId);
          if (!prereqCourse) continue;

          // Find if prerequisite is scheduled for this cohort
          const prereqRun = cohortRuns.find((r) => r.course_id === prereqId);

          if (!prereqRun) {
            // Prerequisite not scheduled at all
            problems.push({
              type: "missing",
              cohortId: cohort.cohort_id,
              cohortName: cohort.name,
              courseId: course.course_id,
              courseName: course.name,
              courseCode: course.code,
              runId: run.run_id,
              missingPrereqId: prereqId,
              missingPrereqName: prereqCourse.name,
              missingPrereqCode: prereqCourse.code,
            });
          } else {
            // Check that prerequisite is completely finished before this course starts
            const prereqSlot = this.getSlot(prereqRun.slot_id);
            if (prereqSlot) {
              const prereqRange = this._getSlotRange(prereqSlot);
              const prereqEndDate = prereqRange?.end;

              // The dependent course must start AFTER the prerequisite ends
              if (prereqEndDate && runDate <= prereqEndDate) {
                problems.push({
                  type: "before_prerequisite",
                  cohortId: cohort.cohort_id,
                  cohortName: cohort.name,
                  courseId: course.course_id,
                  courseName: course.name,
                  courseCode: course.code,
                  runId: run.run_id,
                  missingPrereqId: prereqId,
                  missingPrereqName: prereqCourse.name,
                  missingPrereqCode: prereqCourse.code,
                });
              }
            }
          }
        }
      }
    }

    return problems;
  }

  // Subscribe to changes
  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.validateTeacherAssignments();
    const removedCourses = this.validateCoursesHaveTeachers();

    // Get previous prerequisite problems to detect new ones
    const previousProblems = new Set(
      (this.prerequisiteProblems || []).map(
        (p) => `${p.cohortId}-${p.runId}-${p.missingPrereqId}`
      )
    );

    // Check for prerequisite problems after removing courses
    this.prerequisiteProblems = this.findCoursesWithMissingPrerequisites();

    // Find NEW prerequisite problems (ones that weren't there before)
    const newProblems = this.prerequisiteProblems.filter(
      (p) =>
        !previousProblems.has(`${p.cohortId}-${p.runId}-${p.missingPrereqId}`)
    );

    this.listeners.forEach((l) => l());
    this.saveData();

    // Show alert if courses were removed
    if (removedCourses.length > 0) {
      let message = `Följande kurser flyttades till depån (ingen lärare tillgänglig):\n\n`;
      message += removedCourses
        .map(
          (c) =>
            `"${c.courseName}" (${c.courseCode}) för ${c.cohorts.join(", ")}`
        )
        .join("\n");

      // Add prerequisite warnings if any NEW problems exist
      if (newProblems.length > 0) {
        message += `\n\n⚠️ VARNING: Följande kurser saknar nu sina spärrkurser:\n\n`;
        const problemsByCourseCohort = new Map();
        for (const p of newProblems) {
          const key = `${p.cohortName}-${p.courseCode}`;
          if (!problemsByCourseCohort.has(key)) {
            problemsByCourseCohort.set(key, {
              cohortName: p.cohortName,
              courseCode: p.courseCode,
              courseName: p.courseName,
              missingPrereqs: [],
            });
          }
          problemsByCourseCohort
            .get(key)
            .missingPrereqs.push(p.missingPrereqCode);
        }
        message += Array.from(problemsByCourseCohort.values())
          .map(
            (p) =>
              `${p.cohortName}: "${
                p.courseName
              }" saknar spärrkurs ${p.missingPrereqs.join(", ")}`
          )
          .join("\n");
      }

      showAlert(message);
    } else if (newProblems.length > 0) {
      // Show alert only for new prerequisite problems even if no courses were removed
      let message = `⚠️ VARNING: Följande kurser saknar nu sina spärrkurser:\n\n`;
      const problemsByCourseCohort = new Map();
      for (const p of newProblems) {
        const key = `${p.cohortName}-${p.courseCode}`;
        if (!problemsByCourseCohort.has(key)) {
          problemsByCourseCohort.set(key, {
            cohortName: p.cohortName,
            courseCode: p.courseCode,
            courseName: p.courseName,
            missingPrereqs: [],
          });
        }
        problemsByCourseCohort
          .get(key)
          .missingPrereqs.push(p.missingPrereqCode);
      }
      message += Array.from(problemsByCourseCohort.values())
        .map(
          (p) =>
            `${p.cohortName}: "${
              p.courseName
            }" saknar spärrkurs ${p.missingPrereqs.join(", ")}`
        )
        .join("\n");

      showAlert(message);
    }
  }

  async saveData() {
    try {
      this._syncTeacherCoursesFromTeachers();
      this._syncCoursePrerequisitesFromCourses();
      this._normalizeSlotsInPlace();
      this._assertAllSlotsNonOverlapping();
      const response = await fetch("http://localhost:3001/api/bulk-save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courses: this.courses,
          cohorts: this.cohorts,
          teachers: this.teachers,
          teacherCourses: this.teacherCourses,
          coursePrerequisites: this.coursePrerequisites,
          slots: this.slots,
          courseRuns: this.courseRuns,
          teacherAvailability: this.teacherAvailability,
          teachingDays: this.teachingDays,
          examDates: this.examDates,
          courseSlots: this.courseSlots,
          slotDays: this.slotDays,
          courseSlotDays: this.courseSlotDays,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend save failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to save to backend:", error);
      throw error;
    }
  }

  renumberCohorts() {
    // Sort cohorts by start_date
    const sortedCohorts = [...this.cohorts].sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date)
    );

    // Assign sequential names
    sortedCohorts.forEach((cohort, index) => {
      cohort.name = `Kull ${index + 1}`;
    });

    // Update the cohorts array with the renamed cohorts
    this.cohorts = sortedCohorts;
  }

  // Courses
  addCourse(course) {
    const id = Math.max(...this.courses.map((c) => c.course_id), 0) + 1;
    const newCourse = {
      course_id: id,
      code: course.code || "",
      name: course.name || "",
      credits:
        Number.isFinite(Number(course.credits)) &&
        Number(course.credits) === 15
          ? 15
          : 7.5,
      prerequisites: course.prerequisites || [], // Array of course_ids that must be completed before this course
    };
    this.courses.push(newCourse);
    this.notify();
    return newCourse;
  }

  getCourses() {
    return this.courses;
  }

  getCourse(courseId) {
    return this.courses.find((c) => c.course_id === courseId);
  }

  // Get all prerequisites for a course, including transitive ones (prerequisites of prerequisites)
  getAllPrerequisites(courseId, visited = new Set()) {
    if (visited.has(courseId)) return []; // Prevent circular dependencies
    visited.add(courseId);

    const course = this.getCourse(courseId);
    if (!course || !course.prerequisites || course.prerequisites.length === 0) {
      return [];
    }

    let allPrereqs = [...course.prerequisites];

    // Recursively get prerequisites of prerequisites
    for (const prereqId of course.prerequisites) {
      const transitivePrereqs = this.getAllPrerequisites(prereqId, visited);
      for (const transitive of transitivePrereqs) {
        if (!allPrereqs.includes(transitive)) {
          allPrereqs.push(transitive);
        }
      }
    }

    return allPrereqs;
  }

  updateCourse(courseId, updates) {
    const index = this.courses.findIndex((c) => c.course_id === courseId);
    if (index !== -1) {
      this.courses[index] = { ...this.courses[index], ...updates };
      this.notify();
      return this.courses[index];
    }
    return null;
  }

  deleteCourse(courseId) {
    const index = this.courses.findIndex((c) => c.course_id === courseId);
    if (index !== -1) {
      this.courses.splice(index, 1);
      // Also remove any course runs that reference this course
      this.courseRuns = this.courseRuns.filter((r) => r.course_id !== courseId);
      this.notify();
      return true;
    }
    return false;
  }

  // Cohorts
  async addCohort(cohort) {
    console.log("🟢 addCohort called with:", cohort);
    const id = Math.max(...this.cohorts.map((c) => c.cohort_id), 0) + 1;
    const newCohort = {
      cohort_id: id,
      name: cohort.name || "",
      start_date: cohort.start_date || "",
      planned_size: cohort.planned_size || 0,
    };
    this.cohorts.push(newCohort);
    console.log("🟢 Cohorts after push:", this.cohorts.length);

    this.renumberCohorts();
    console.log(
      "🟢 Cohorts after renumber:",
      this.cohorts.map((c) => c.name)
    );

    console.log("🟢 Calling notify with", this.listeners.length, "listeners");
    this.notify();
    console.log("🟢 addCohort complete");
    return newCohort;
  }
  getCohorts() {
    return this.cohorts;
  }

  getCohort(cohortId) {
    return this.cohorts.find((c) => c.cohort_id === cohortId);
  }

  async updateCohort(cohortId, updates) {
    const index = this.cohorts.findIndex((c) => c.cohort_id === cohortId);
    if (index !== -1) {
      this.cohorts[index] = { ...this.cohorts[index], ...updates };

      // If start_date changed, renumber all cohorts
      if (updates.start_date) {
        this.renumberCohorts();
      }

      this.notify();
      return this.cohorts[index];
    }
    return null;
  }

  async deleteCohort(cohortId) {
    const index = this.cohorts.findIndex((c) => c.cohort_id === cohortId);
    if (index !== -1) {
      this.cohorts.splice(index, 1);

      // Remove this cohort from all course runs and cleanup empty runs
      this.courseRuns = this.courseRuns.filter((run) => {
        if (run.cohorts) {
          run.cohorts = run.cohorts.filter((id) => id !== cohortId);
          // Remove course run if it has no cohorts left
          return run.cohorts.length > 0;
        }
        return true;
      });

      // Renumber remaining cohorts
      this.renumberCohorts();

      this.notify();
      return true;
    }
    return false;
  }

  // Teachers
  addTeacher(teacher) {
    const id = Math.max(...this.teachers.map((t) => t.teacher_id), 0) + 1;
    const newTeacher = {
      teacher_id: id,
      name: teacher.name || "",
      home_department: teacher.home_department || "",
      compatible_courses: teacher.compatible_courses || [],
    };
    this.teachers.push(newTeacher);
    this.notify();
    return newTeacher;
  }

  getTeachers() {
    return this.teachers;
  }

  getTeacher(teacherId) {
    return this.teachers.find((t) => t.teacher_id === teacherId);
  }

  updateTeacher(teacherId, updates) {
    const index = this.teachers.findIndex((t) => t.teacher_id === teacherId);
    if (index !== -1) {
      this.teachers[index] = { ...this.teachers[index], ...updates };
      this.notify();
      return this.teachers[index];
    }
    return null;
  }

  deleteTeacher(teacherId) {
    const index = this.teachers.findIndex((t) => t.teacher_id === teacherId);
    if (index !== -1) {
      this.teachers.splice(index, 1);
      // Also remove this teacher from all course runs
      this.courseRuns.forEach((run) => {
        if (run.teachers) {
          run.teachers = run.teachers.filter((id) => id !== teacherId);
        }
        if (run.teacher_id === teacherId) {
          run.teacher_id = null;
        }
      });
      this.notify();
      return true;
    }
    return false;
  }

  // Randomly assign compatible courses to each teacher
  randomizeTeacherCourses(minCourses = 2, maxCourses = 5) {
    const allCourseIds = this.courses.map((c) => c.course_id);

    this.teachers.forEach((teacher) => {
      // Shuffle courses
      const shuffled = [...allCourseIds].sort(() => Math.random() - 0.5);
      // Pick random number of courses between min and max
      const numCourses =
        Math.floor(Math.random() * (maxCourses - minCourses + 1)) + minCourses;
      teacher.compatible_courses = shuffled.slice(0, numCourses);
    });

    this.notify();
  }

  // Slots
  addSlot(slot) {
    const startStr = this._normalizeDateOnly(slot.start_date);
    if (!startStr) {
      const message = "Kan inte skapa slot utan giltigt startdatum.";
      showAlert(message);
      throw new Error(message);
    }

    const explicitEnd = this._normalizeDateOnly(slot.end_date);
    const endDateObj = explicitEnd
      ? new Date(explicitEnd)
      : this._defaultSlotEndDate(startStr);
    const endStr = this._normalizeDateOnly(endDateObj);

    if (!endStr) {
      const message = "Kan inte skapa slot utan giltigt slutdatum.";
      showAlert(message);
      throw new Error(message);
    }

    if (new Date(endStr) <= new Date(startStr)) {
      const message = "Slotens slutdatum måste vara efter startdatum.";
      showAlert(message);
      throw new Error(message);
    }

    const overlapping = this._findOverlappingSlot(startStr, endStr);
    if (overlapping) {
      const overlappingRange = this._getSlotRange(overlapping);
      const conflictEnd =
        overlappingRange?.endStr ||
        overlapping.end_date ||
        this._normalizeDateOnly(
          this._defaultSlotEndDate(overlapping.start_date)
        );
      const message = `Slot ${startStr}–${endStr} krockar med befintlig slot ${overlapping.start_date}–${conflictEnd}.`;
      showAlert(message);
      throw new Error(message);
    }

    const id = Math.max(...this.slots.map((s) => s.slot_id), 0) + 1;
    const newSlot = {
      slot_id: id,
      start_date: startStr,
      end_date: endStr,
      evening_pattern: slot.evening_pattern || "",
      is_placeholder: slot.is_placeholder !== false,
      location: slot.location || "",
      is_law_period: slot.is_law_period || false,
    };
    this.slots.push(newSlot);

    // Generate default teaching days for new slot
    this.generateDefaultTeachingDays(id);
    // Keep normalized slotDays in sync
    this._ensureSlotDaysFromSlots();

    this.notify();
    return newSlot;
  }

  getSlots() {
    return this.slots;
  }

  getSlot(slotId) {
    return this.slots.find((s) => s.slot_id === slotId);
  }

  // Course Runs
  addCourseRun(run) {
    const id = Math.max(...this.courseRuns.map((r) => r.run_id), 0) + 1;
    const newRun = {
      run_id: id,
      course_id: run.course_id,
      slot_id: run.slot_id,
      teacher_id: run.teacher_id,
      teachers: run.teachers || [],
      cohorts: run.cohorts || [],
      planned_students: run.planned_students || 0,
      status: run.status || "planerad",
    };
    this.courseRuns.push(newRun);
    // Ensure the normalized course-slot link exists
    this._ensureCourseSlotsFromRuns();
    this.notify();
    return newRun;
  }

  getCourseRuns() {
    return this.courseRuns;
  }

  getCourseRunsBySlot(slotId) {
    return this.courseRuns.filter((r) => r.slot_id === slotId);
  }

  deleteSlot(slotId) {
    // Prevent removal if there are course runs in the slot
    const runs = this.getCourseRunsBySlot(slotId);
    if (runs && runs.length > 0) {
      const message = "Kan inte ta bort slot som har tilldelade kurskörningar.";
      showAlert(message);
      throw new Error(message);
    }

    const idx = this.slots.findIndex((s) => String(s.slot_id) === String(slotId));
    if (idx === -1) return false;

    // Remove slot
    this.slots.splice(idx, 1);

    // Remove any slotDays for this slot
    this.slotDays = this.slotDays.filter((sd) => String(sd.slot_id) !== String(slotId));

    // Remove any cohort_slot_courses / courseSlots referencing slot
    this.courseSlots = (this.courseSlots || []).filter((cs) => String(cs.slot_id) !== String(slotId));

    // Recompute derived data
    this._ensureCourseSlotsFromRuns();
    this._ensureSlotDaysFromSlots();
    this.notify();
    return true;
  }

  // Teacher Availability
  addTeacherAvailability(availability) {
    const id = Math.max(...this.teacherAvailability.map((a) => a.id), 0) + 1;
    const newAvailability = {
      id,
      teacher_id: availability.teacher_id,
      from_date: availability.from_date || "",
      to_date: availability.to_date || "",
      slot_id: availability.slot_id || null, // Optional: for slot-level entries
      type: availability.type || "busy", // 'busy' eller 'free'
    };
    this.teacherAvailability.push(newAvailability);
    this.notify();
    return newAvailability;
  }

  getTeacherAvailability(teacherId) {
    return this.teacherAvailability.filter((a) => a.teacher_id === teacherId);
  }

  getAllTeacherAvailability() {
    return this.teacherAvailability;
  }

  removeTeacherAvailability(id) {
    const index = this.teacherAvailability.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.teacherAvailability.splice(index, 1);
      this.notify();
      return true;
    }
    return false;
  }

  toggleTeacherAvailabilityForSlot(teacherId, slotDate, slotId) {
    // Check if there's a slot-level unavailability entry for THIS specific slot
    const slotEntry = this.teacherAvailability.find(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.slot_id === slotId
    );

    if (slotEntry) {
      // Remove slot-level entry
      this.removeTeacherAvailability(slotEntry.id);
      return;
    }

    // Check if ALL days are individually marked (happens when painting in detail view)
    const days = this.getSlotDays(slotId);
    const dayEntries = days
      .map((day) =>
        this.teacherAvailability.find(
          (a) =>
            a.teacher_id === teacherId &&
            a.from_date === day &&
            a.type === "busy" &&
            !a.slot_id // Day-level entries don't have slot_id
        )
      )
      .filter(Boolean);

    if (dayEntries.length === days.length && days.length > 0) {
      // All days are marked - remove them all
      dayEntries.forEach((entry) => this.removeTeacherAvailability(entry.id));
    } else {
      // Add slot-level unavailability
      this.addTeacherAvailability({
        teacher_id: teacherId,
        from_date: slotDate,
        to_date: slotDate,
        slot_id: slotId,
        type: "busy",
      });
    }
  }

  toggleTeacherAvailabilityForDay(teacherId, dateStr) {
    // Check if there's already unavailability for this teacher on this day
    const existing = this.teacherAvailability.find(
      (a) => a.teacher_id === teacherId && a.from_date === dateStr
    );

    if (existing) {
      // Remove it
      this.removeTeacherAvailability(existing.id);
    } else {
      // Add unavailability
      this.addTeacherAvailability({
        teacher_id: teacherId,
        from_date: dateStr,
        to_date: dateStr,
        type: "busy",
      });
    }
  }

  isTeacherUnavailable(teacherId, slotDate, slotId = null) {
    // Check if there's a slot-level unavailability entry
    const hasSlotEntry = this.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.type === "busy" &&
        a.slot_id && // Is a slot-level entry
        (slotId === null || a.slot_id === slotId) // Match specific slot if provided
    );

    if (hasSlotEntry) return true;

    // Check if ALL days in the slot are individually marked as unavailable
    const days = this.getSlotDays(slotId || slotDate);
    if (days.length === 0) return false;

    // Must have at least one unavailable day AND all days must be unavailable
    const unavailableDays = days.filter((day) =>
      this.teacherAvailability.some(
        (a) =>
          a.teacher_id === teacherId &&
          a.from_date === day &&
          a.type === "busy" &&
          !a.slot_id // Only count day-level entries
      )
    );

    return unavailableDays.length > 0 && unavailableDays.length === days.length;
  }

  // Check if teacher is unavailable on a specific day (for detail view)
  isTeacherUnavailableOnDay(teacherId, dateStr) {
    return this.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === dateStr &&
        a.type === "busy"
    );
  }

  // Get percentage of days in a slot where teacher is unavailable (0.0 to 1.0)
  getTeacherUnavailablePercentageForSlot(teacherId, slotDate, slotId = null) {
    // Check if there's a slot-level unavailability entry (100%)
    const hasSlotEntry = this.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.type === "busy" &&
        a.slot_id && // Is a slot-level entry
        (slotId === null || a.slot_id === slotId) // Match specific slot if provided
    );

    if (hasSlotEntry) return 1.0; // 100% unavailable

    // Check individual days
    const days = this.getSlotDays(slotId || slotDate);
    if (days.length === 0) return 0;

    const unavailableDays = days.filter((day) =>
      this.teacherAvailability.some(
        (a) =>
          a.teacher_id === teacherId &&
          a.from_date === day &&
          a.type === "busy" &&
          !a.slot_id // Only count day-level entries
      )
    );

    return unavailableDays.length / days.length;
  }

  // Get all individual days within a slot (for detail view)
  getSlotDays(slotDateOrId) {
    if (!slotDateOrId) return [];

    const normalizeDate = (value) => (value || "").split("T")[0];

    const normalizedDate =
      typeof slotDateOrId === "string" ? normalizeDate(slotDateOrId) : null;

    // Support both slot_id (number/string) and start_date (string)
    const slot =
      this.slots.find((s) => String(s.slot_id) === String(slotDateOrId)) ||
      this.slots.find(
        (s) => normalizeDate(s.start_date) === normalizedDate
      );

    // Prefer normalized slotDays if they exist
    if (
      slot?.slot_id &&
      Array.isArray(this.slotDays) &&
      this.slotDays.some(
        (sd) => String(sd.slot_id) === String(slot.slot_id)
      )
    ) {
      return this.slotDays
        .filter((sd) => String(sd.slot_id) === String(slot.slot_id))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        .map((sd) => normalizeDate(sd.date));
    }

    if (!slot) return [];

    return this._computeSlotDayRange(slot);
  }
  _computeSlotDayRange(slot) {
    if (!slot) return [];

    const slotRange = this._getSlotRange(slot);
    if (!slotRange) return [];

    const allSlots = this.slots
      .slice()
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

    const normalizeDate = (value) => (value || "").split("T")[0];
    const slotIndex = allSlots.findIndex(
      (s) =>
        String(s.slot_id) === String(slot.slot_id) ||
        normalizeDate(s.start_date) === normalizeDate(slot.start_date)
    );

    let endDate = new Date(slotRange.end);
    for (let i = slotIndex + 1; i < allSlots.length; i++) {
      const candidateStart = new Date(allSlots[i].start_date);
      if (Number.isNaN(candidateStart.getTime())) continue;
      if (candidateStart > slotRange.start) {
        const candidateEnd = new Date(candidateStart);
        candidateEnd.setDate(candidateEnd.getDate() - 1);
        if (candidateEnd < endDate) {
          endDate = candidateEnd;
        }
        break;
      }
    }
    if (!endDate || Number.isNaN(endDate.getTime())) {
      endDate = this._defaultSlotEndDate(slotRange.start);
    }

    const days = [];
    const currentDate = new Date(slotRange.start);

    while (currentDate <= endDate) {
      days.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  _ensureCourseSlotsFromRuns() {
    if (!Array.isArray(this.courseSlots)) {
      this.courseSlots = [];
    }

    const existingKeys = new Set(
      this.courseSlots.map((cs) => `${cs.course_id}-${cs.slot_id}`)
    );
    let nextId =
      this.courseSlots.reduce(
        (max, cs) => Math.max(max, cs.course_slot_id || 0),
        0
      ) + 1;

    for (const run of this.courseRuns || []) {
      if (run.course_id == null || run.slot_id == null) continue;
      const key = `${run.course_id}-${run.slot_id}`;
      if (existingKeys.has(key)) continue;

      this.courseSlots.push({
        course_slot_id: nextId++,
        course_id: run.course_id,
        slot_id: run.slot_id,
        created_at: run.created_at || new Date().toISOString(),
      });
      existingKeys.add(key);
    }
  }

  _ensureSlotDaysFromSlots() {
    if (!Array.isArray(this.slotDays)) {
      this.slotDays = [];
    }

    const normalizeDate = (value) => (value || "").split("T")[0];
    let nextId =
      this.slotDays.reduce(
        (max, sd) => Math.max(max, sd.slot_day_id || 0),
        0
      ) + 1;

    for (const slot of this.slots || []) {
      const hasDays = this.slotDays.some(
        (sd) => String(sd.slot_id) === String(slot.slot_id)
      );
      if (hasDays) continue;

      const days = this._computeSlotDayRange(slot);
      days.forEach((date) =>
        this.slotDays.push({
          slot_day_id: nextId++,
          slot_id: slot.slot_id,
          date: normalizeDate(date),
        })
      );
    }
  }

  _ensureCourseSlotDayDefaults() {
    if (!Array.isArray(this.courseSlotDays)) {
      this.courseSlotDays = [];
    }
    const normalizeDate = (v) => (v || "").split("T")[0];
    let nextId =
      this.courseSlotDays.reduce(
        (max, csd) => Math.max(max, csd.course_slot_day_id || 0),
        0
      ) + 1;

    for (const cs of this.courseSlots || []) {
      const defaults = this.getDefaultTeachingDaysPattern(cs.slot_id);
      defaults.forEach((d) => {
        const exists = this.courseSlotDays.some(
          (csd) =>
            String(csd.course_slot_id) === String(cs.course_slot_id) &&
            normalizeDate(csd.date) === normalizeDate(d)
        );
        if (!exists) {
          this.courseSlotDays.push({
            course_slot_day_id: nextId++,
            course_slot_id: cs.course_slot_id,
            date: normalizeDate(d),
            is_default: 1,
            active: 1,
          });
        }
      });
    }
  }

  _loadSnapshot(data) {
    this.courses = this._normalizeCourses(data.courses || []);
    this.cohorts = data.cohorts || [];
    this.teachers = data.teachers || [];
    this.teacherCourses = data.teacherCourses || [];
    this.slots = data.slots || [];
    this.courseRuns = data.courseRuns || [];
    this.teacherAvailability = data.teacherAvailability || [];
    this.teachingDays = data.teachingDays || [];
    this.examDates = data.examDates || [];
    this.courseSlots = data.courseSlots || [];
    this.slotDays = data.slotDays || [];
    this.courseSlotDays = data.courseSlotDays || [];
    this._ensureCourseSlotsFromRuns();
    this._ensureSlotDaysFromSlots();
    this._ensureCourseSlotDayDefaults();
    this._ensureTeacherCoursesFromCompatible();
  }

  // Teaching days methods (default pattern only; actual aktiva dagar finns i courseSlotDays)
  getDefaultTeachingDaysPattern(slotId) {
    const slot = this.slots.find((s) => s.slot_id === slotId);
    if (!slot) return [];

    const startDate = new Date(slot.start_date);
    const teachingDays = [];

    // Helper function to get date of specific weekday in specific week
    const getDateOfWeekday = (baseDate, weekOffset, targetWeekday) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + weekOffset * 7);

      // targetWeekday: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const currentDay = date.getDay();
      const daysToAdd = (targetWeekday - currentDay + 7) % 7;
      date.setDate(date.getDate() + daysToAdd);

      return date.toISOString().split("T")[0];
    };

    // Week 1: Monday and Thursday
    teachingDays.push(getDateOfWeekday(startDate, 0, 1)); // Monday
    teachingDays.push(getDateOfWeekday(startDate, 0, 4)); // Thursday

    // Week 2: Tuesday and Thursday
    teachingDays.push(getDateOfWeekday(startDate, 1, 2)); // Tuesday
    teachingDays.push(getDateOfWeekday(startDate, 1, 4)); // Thursday

    // Week 3: Tuesday and Thursday
    teachingDays.push(getDateOfWeekday(startDate, 2, 2)); // Tuesday
    teachingDays.push(getDateOfWeekday(startDate, 2, 4)); // Thursday

    // Week 4: Monday and Friday (exam)
    teachingDays.push(getDateOfWeekday(startDate, 3, 1)); // Monday
    teachingDays.push(getDateOfWeekday(startDate, 3, 5)); // Friday (Tenta)

    return teachingDays;
  }

  // No-op legacy hooks (defaults hanteras nu per kursSlot via courseSlotDays)
  generateDefaultTeachingDays() {}
  initializeAllTeachingDays() {}

  toggleTeachingDay(slotId, date, courseId = null) {
    const defaultDates = this.getDefaultTeachingDaysPattern(slotId);
    const isDefaultDate = defaultDates.includes(date);

    if (courseId != null) {
      const specificIndex = this.teachingDays.findIndex(
        (td) =>
          td.slot_id === slotId &&
          td.date === date &&
          td.course_id === courseId
      );
      const baseState =
        this.getTeachingDayState(slotId, date, courseId) || {
          isDefault: isDefaultDate,
          active: false,
        };
      const desiredActive = !(baseState.active ?? false);

      if (specificIndex !== -1) {
        // Toggle the course-specific entry directly
        this.teachingDays[specificIndex].active = desiredActive;
      } else {
        // Create a course-specific override (active or inactive) without touching generic
        this.teachingDays.push({
          slot_id: slotId,
          date,
          course_id: courseId,
          isDefault: baseState.isDefault ?? isDefaultDate,
          active: desiredActive,
        });
      }
      this.notify();
      this.saveData().catch((err) =>
        console.error("Failed to save teaching day change:", err)
      );
      return;
    }

    // courseId == null: applicera på alla kursSlotar i slotten (ingen generisk teachingDay)
    const courseSlotsInSlot = (this.courseSlots || []).filter(
      (cs) => String(cs.slot_id) === String(slotId)
    );
    courseSlotsInSlot.forEach((cs) => {
      this.toggleCourseSlotDay(slotId, cs.course_id, date, {
        skipSave: true,
        skipNotify: true,
      });
    });
    this.notify();
    this.saveData().catch((err) =>
      console.error("Failed to save teaching day change:", err)
    );
  }

  getTeachingDayState(slotId, date, courseId = null) {
    const normalizeDate = (v) => (v || "").split("T")[0];

    if (courseId != null) {
      // First, check courseSlotDay overrides (persisted per kurs)
      const courseSlot = this.getCourseSlot(courseId, slotId);
      if (courseSlot) {
        const csd = (this.courseSlotDays || []).find(
          (csd) =>
            String(csd.course_slot_id) === String(courseSlot.course_slot_id) &&
            normalizeDate(csd.date) === normalizeDate(date)
        );
        if (csd) {
          return {
            isDefault: Boolean(csd.is_default),
            active: csd.active !== false,
          };
        }
        // Om inget csd men datumet ligger i defaultmönstret: anta aktiv standarddag
        const defaultDates = this.getDefaultTeachingDaysPattern(slotId);
        if (defaultDates.includes(normalizeDate(date))) {
          return { isDefault: true, active: true };
        }
      }

      // If no courseSlotDay, fall back to course-specific teachingDays entry or generic
      const td =
        this.teachingDays.find(
          (t) =>
            t.slot_id === slotId &&
            t.date === date &&
            t.course_id === courseId
        ) ||
        this.teachingDays.find(
          (t) =>
            t.slot_id === slotId &&
            t.date === date &&
            (t.course_id === null || t.course_id === undefined)
        );

      if (!td) return null;

      return {
        isDefault: td.isDefault || false,
        active: td.active !== false,
      };
    }

    // courseId === null: merge per-kurs data för alla kursSlotar i slotten
    const courseSlotsInSlot = (this.courseSlots || []).filter(
      (cs) => String(cs.slot_id) === String(slotId)
    );
    const matches = [];
    courseSlotsInSlot.forEach((cs) => {
      const hit = (this.courseSlotDays || []).find(
        (csd) =>
          String(csd.course_slot_id) === String(cs.course_slot_id) &&
          normalizeDate(csd.date) === normalizeDate(date)
      );
      if (hit) matches.push(hit);
    });

    if (matches.length > 0) {
      const anyActive = matches.some((m) => m.active !== false);
      const anyDefault = matches.some((m) => m.is_default);
      const anyDefaultInactive = matches.some(
        (m) => m.is_default && m.active === false
      );
      if (anyActive) {
        return { isDefault: anyDefault, active: true };
      }
      if (anyDefaultInactive) {
        return { isDefault: true, active: false };
      }
      return { isDefault: false, active: false };
    }

    // Om inga per-kurs-poster men datum är del av slotens defaultmönster, visa aktiv standard
    const defaultDates = this.getDefaultTeachingDaysPattern(slotId);
    if (defaultDates.includes(normalizeDate(date))) {
      return { isDefault: true, active: true };
    }

    // Fall back to generic teachingDays if no per-kurs data finns
    const generic = this.teachingDays.find(
      (t) =>
        t.slot_id === slotId &&
        t.date === date &&
        (t.course_id === null || t.course_id === undefined)
    );
    if (!generic) return null;
    return {
      isDefault: generic.isDefault || false,
      active: generic.active !== false,
    };
  }

  getTeachingDaysForSlot(slotId) {
    return this.teachingDays
      .filter((td) => td.slot_id === slotId)
      .map((td) => td.date);
  }

  isTeachingDay(slotId, date) {
    return this.teachingDays.some(
      (td) => td.slot_id === slotId && td.date === date
    );
  }

  // Exam date management methods
  setExamDate(slotId, date) {
    // Remove any existing exam date for this slot (radio button behavior)
    this.examDates = this.examDates.filter((ed) => ed.slot_id !== slotId);

    // Add the new exam date
    this.examDates.push({
      slot_id: slotId,
      date,
      locked: true, // Exam dates are locked by default
    });

    this.notify();
  }

  clearExamDate(slotId) {
    this.examDates = this.examDates.filter((ed) => ed.slot_id !== slotId);
    this.notify();
  }

  getExamDate(slotId) {
    const examDate = this.examDates.find((ed) => ed.slot_id === slotId);
    return examDate ? examDate.date : null;
  }

  isExamDate(slotId, date) {
    return this.examDates.some(
      (ed) => ed.slot_id === slotId && ed.date === date
    );
  }

  isExamDateLocked(slotId) {
    const examDate = this.examDates.find((ed) => ed.slot_id === slotId);
    return examDate ? examDate.locked : false;
  }

  unlockExamDate(slotId) {
    const examDate = this.examDates.find((ed) => ed.slot_id === slotId);
    if (examDate) {
      examDate.locked = false;
      this.notify();
    }
  }

  lockExamDate(slotId) {
    const examDate = this.examDates.find((ed) => ed.slot_id === slotId);
    if (examDate) {
      examDate.locked = true;
      this.notify();
    }
  }

  // Import from Excel/JSON
  importData(data) {
    // Reset current state so repeated imports don't accumulate duplicates
    this.courses = [];
    this.cohorts = [];
    this.teachers = [];
    this.teacherCourses = [];
    this.coursePrerequisites = [];
    this.slots = [];
    this.courseRuns = [];
    this.teacherAvailability = [];
    this.teachingDays = [];
    this.examDates = [];
    this.courseSlots = [];
    this.slotDays = [];
    this.courseSlotDays = [];

    if (data.courses) {
      this.courses = this._normalizeCourses(data.courses || []);
    }
    if (data.cohorts) {
      data.cohorts.forEach((c) => this.addCohort(c));
    }
    if (data.teachers) {
      data.teachers.forEach((t) => this.addTeacher(t));
    }
    if (data.slots) {
      data.slots.forEach((s) => this.addSlot(s));
    }
    if (data.courseRuns) {
      data.courseRuns.forEach((r) => this.addCourseRun(r));
    }
    if (data.teacherAvailability) {
      data.teacherAvailability.forEach((a) => this.addTeacherAvailability(a));
    }
    if (data.teacherCourses) {
      this.teacherCourses = data.teacherCourses;
    }
    if (data.coursePrerequisites) {
      this.coursePrerequisites = data.coursePrerequisites;
    }
    if (data.teachingDays) {
      this.teachingDays = data.teachingDays;
    }
    if (data.examDates) {
      this.examDates = data.examDates;
    }
    if (data.courseSlots) {
      this.courseSlots = data.courseSlots;
    }
    if (data.slotDays) {
      this.slotDays = data.slotDays;
    }
    if (data.courseSlotDays) {
      this.courseSlotDays = data.courseSlotDays;
    }
    this._ensureCourseSlotsFromRuns();
    this._ensureSlotDaysFromSlots();
    this.notify();
  }

  // Export for Excel
  exportData() {
    return {
      courses: this.courses,
      cohorts: this.cohorts,
      teachers: this.teachers,
      slots: this.slots,
      courseRuns: this.courseRuns,
      teacherAvailability: this.teacherAvailability,
      courseSlots: this.courseSlots,
      slotDays: this.slotDays,
      courseSlotDays: this.courseSlotDays,
    };
  }

  // Reset to seed data
  async resetToSeedData() {
    // Clear current data
    this.courses = [];
    this.cohorts = [];
    this.teachers = [];
    this.teacherCourses = [];
    this.slots = [];
    this.courseRuns = [];
    this.teacherAvailability = [];
    this.teachingDays = [];
    this.examDates = [];
    this.courseSlots = [];
    this.slotDays = [];
    this.courseSlotDays = [];

    // Reload seed data WITHOUT courseRuns - cohorts should start with empty sequences
    const seedDataWithoutRuns = {
      courses: seedData.courses,
      cohorts: seedData.cohorts,
      teachers: seedData.teachers,
      slots: seedData.slots,
      // courseRuns intentionally omitted - each cohort starts fresh
      teacherAvailability: seedData.teacherAvailability,
      courseSlots: seedData.courseSlots || [],
      slotDays: seedData.slotDays || [],
      courseSlotDays: seedData.courseSlotDays || [],
    };
    this.importData(seedDataWithoutRuns);
  }

  getCourseSlots() {
    return this.courseSlots || [];
  }

  getCourseSlot(courseId, slotId) {
    return (this.courseSlots || []).find(
      (cs) =>
        String(cs.course_id) === String(courseId) &&
        String(cs.slot_id) === String(slotId)
    );
  }

  getCourseSlotDays(courseSlotId) {
    return (this.courseSlotDays || [])
      .filter((csd) => String(csd.course_slot_id) === String(courseSlotId))
      .filter((csd) => csd.active !== false)
      .map((csd) => (csd.date || csd.slot_day_id_date || "").split("T")[0]);
  }

  getCourseSlotDaysForCourse(slotId, courseId) {
    const courseSlot = this.getCourseSlot(courseId, slotId);
    if (!courseSlot) return [];
    return this.getCourseSlotDays(courseSlot.course_slot_id);
  }

  getCompatibleCourseIds(teacherId) {
    if (this.teacherCourses && this.teacherCourses.length > 0) {
      return this.teacherCourses
        .filter((tc) => String(tc.teacher_id) === String(teacherId))
        .map((tc) => tc.course_id);
    }
    const teacher = this.teachers.find((t) => t.teacher_id === teacherId);
    return teacher?.compatible_courses || [];
  }

  _ensureTeacherCoursesFromCompatible() {
    if (!Array.isArray(this.teacherCourses)) {
      this.teacherCourses = [];
    }
    const existingKeys = new Set(
      this.teacherCourses.map((tc) => `${tc.teacher_id}-${tc.course_id}`)
    );
    for (const t of this.teachers || []) {
      const compat = Array.isArray(t.compatible_courses)
        ? t.compatible_courses
        : [];
      compat.forEach((cid) => {
        const key = `${t.teacher_id}-${cid}`;
        if (!existingKeys.has(key)) {
          this.teacherCourses.push({ teacher_id: t.teacher_id, course_id: cid });
          existingKeys.add(key);
        }
      });
    }
  }

  _ensureTeacherCompatibleFromCourses() {
    if (!Array.isArray(this.teachers)) return;
    const byTeacher = new Map();
    for (const tc of this.teacherCourses || []) {
      const list = byTeacher.get(tc.teacher_id) || [];
      list.push(tc.course_id);
      byTeacher.set(tc.teacher_id, list);
    }
    this.teachers.forEach((t) => {
      if (byTeacher.has(t.teacher_id)) {
        t.compatible_courses = byTeacher.get(t.teacher_id);
      }
    });
  }

  _syncTeacherCoursesFromTeachers() {
    if (!Array.isArray(this.teachers)) return;
    const next = [];
    const seen = new Set();
    this.teachers.forEach((t) => {
      (t.compatible_courses || []).forEach((cid) => {
        const key = `${t.teacher_id}-${cid}`;
        if (!seen.has(key)) {
          next.push({ teacher_id: t.teacher_id, course_id: cid });
          seen.add(key);
        }
      });
    });
    this.teacherCourses = next;
  }

  _ensurePrerequisitesFromNormalized() {
    if (!Array.isArray(this.courses)) return;
    const byCourse = new Map();
    (this.coursePrerequisites || []).forEach((cp) => {
      const list = byCourse.get(cp.course_id) || [];
      list.push(cp.prerequisite_course_id);
      byCourse.set(cp.course_id, list);
    });
    this.courses.forEach((c) => {
      if (byCourse.has(c.course_id)) {
        c.prerequisites = byCourse.get(c.course_id);
      }
    });
  }

  _syncCoursePrerequisitesFromCourses() {
    if (!Array.isArray(this.courses)) return;
    const next = [];
    const seen = new Set();
    this.courses.forEach((c) => {
      (c.prerequisites || []).forEach((pid) => {
        const key = `${c.course_id}-${pid}`;
        if (!seen.has(key)) {
          next.push({ course_id: c.course_id, prerequisite_course_id: pid });
          seen.add(key);
        }
      });
    });
    this.coursePrerequisites = next;
  }

  toggleCourseSlotDay(
    slotId,
    courseId,
    dateStr,
    { skipSave = false, skipNotify = false } = {}
  ) {
    const courseSlot = this.getCourseSlot(courseId, slotId);
    if (!courseSlot) {
      return;
    }
    if (!Array.isArray(this.courseSlotDays)) {
      this.courseSlotDays = [];
    }
    const normalizeDate = (value) => (value || "").split("T")[0];
    const normalizedDate = normalizeDate(dateStr);
    const defaultDates = this.getDefaultTeachingDaysPattern(slotId);
    const isDefault = defaultDates.includes(normalizedDate);

    const existingIdx = this.courseSlotDays.findIndex(
      (csd) =>
        String(csd.course_slot_id) === String(courseSlot.course_slot_id) &&
        normalizeDate(csd.date) === normalizedDate
    );

    if (existingIdx >= 0) {
      const record = this.courseSlotDays[existingIdx];
      if (record.is_default) {
        // Default days toggle active/inactive but stay in DB
        record.active = record.active === false;
      } else {
        // Non-default days are removed when toggled off
        this.courseSlotDays.splice(existingIdx, 1);
      }
    } else {
      const nextId =
        this.courseSlotDays.reduce(
          (max, csd) => Math.max(max, csd.course_slot_day_id || 0),
          0
        ) + 1;
      this.courseSlotDays.push({
        course_slot_day_id: nextId,
        course_slot_id: courseSlot.course_slot_id,
        date: normalizedDate,
        is_default: isDefault ? 1 : 0,
        active: isDefault ? 0 : 1, // default dates start inactive when toggled, non-default start active
      });
    }
    if (!skipNotify) this.notify();
    if (!skipSave) {
      // Persist course-specific day changes
      this.saveData().catch((err) =>
        console.error("Failed to save course slot day change:", err)
      );
    }
  }

  // Explicit reload helper so vyer kan dra in färska data (t.ex. vid byte av kursläge)
  async refreshFromBackend() {
    return this.loadFromBackend();
  }
}

export const store = new DataStore();
