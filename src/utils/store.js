import { LitElement, html, css } from "lit";
import { seedData } from "../data/seedData.js";

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
    this.slots = [];
    this.courseRuns = [];
    this.teacherAvailability = [];
    this.teachingDays = []; // Array of {slot_id, date} objects marking teaching days
    this.examDates = []; // Array of {slot_id, date} objects marking exam dates (single per slot)
    this.prerequisiteProblems = [];
    this.listeners = [];

    // Load data from backend asynchronously
    this.loadFromBackend();
  }

  // Load data from backend
  async loadFromBackend() {
    try {
      const response = await fetch("http://localhost:3001/api/bulk-load");

      if (!response.ok) {
        console.error("Backend load failed, using seed data");
        this.importData(seedData);
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
        this.importData(seedData);
        return;
      }

      // Load data from backend
      this.courses = data.courses || [];
      this.cohorts = data.cohorts || [];
      this.teachers = data.teachers || [];
      this.slots = data.slots || [];
      this.courseRuns = data.courseRuns || [];
      this.teacherAvailability = data.teacherAvailability || [];
      this.teachingDays = data.teachingDays || [];
      this.examDates = data.examDates || [];

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

      // Initialize default teaching days for slots that don't have any
      this.initializeAllTeachingDays();

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
              const prereqStartDate = new Date(prereqSlot.start_date);

              // Calculate when the prerequisite course ends
              let prereqEndDate;
              if (prereqCourse.default_block_length === 2) {
                // For 2-block courses, find the next slot (second block)
                const allSlots = this.slots.sort((a, b) => {
                  const dateA = new Date(a.start_date);
                  const dateB = new Date(b.start_date);
                  return dateA.getTime() - dateB.getTime();
                });

                const prereqSlotIndex = allSlots.findIndex(
                  (s) => s.slot_id === prereqSlot.slot_id
                );

                if (
                  prereqSlotIndex >= 0 &&
                  prereqSlotIndex < allSlots.length - 1
                ) {
                  // For 2-block courses, the course ends AFTER block 2
                  // So we need the slot after block 2
                  if (prereqSlotIndex + 2 < allSlots.length) {
                    // End date is the start of the slot AFTER the second block
                    prereqEndDate = new Date(
                      allSlots[prereqSlotIndex + 2].start_date
                    );
                  } else {
                    // Fallback: add ~8 weeks to start date
                    prereqEndDate = new Date(prereqStartDate);
                    prereqEndDate.setDate(prereqEndDate.getDate() + 56);
                  }
                } else {
                  // Fallback: add ~8 weeks to start date
                  prereqEndDate = new Date(prereqStartDate);
                  prereqEndDate.setDate(prereqEndDate.getDate() + 56);
                }
              } else {
                // For 1-block courses, end date is the start of next slot
                const allSlots = this.slots.sort((a, b) => {
                  const dateA = new Date(a.start_date);
                  const dateB = new Date(b.start_date);
                  return dateA.getTime() - dateB.getTime();
                });

                const prereqSlotIndex = allSlots.findIndex(
                  (s) => s.slot_id === prereqSlot.slot_id
                );

                if (
                  prereqSlotIndex >= 0 &&
                  prereqSlotIndex < allSlots.length - 1
                ) {
                  prereqEndDate = new Date(
                    allSlots[prereqSlotIndex + 1].start_date
                  );
                } else {
                  // Fallback: add 4 weeks to start date
                  prereqEndDate = new Date(prereqStartDate);
                  prereqEndDate.setDate(prereqEndDate.getDate() + 28);
                }
              }

              // The dependent course must start AFTER the prerequisite ends
              if (runDate < prereqEndDate) {
                // Course starts before prerequisite is finished
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
      const response = await fetch("http://localhost:3001/api/bulk-save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courses: this.courses,
          cohorts: this.cohorts,
          teachers: this.teachers,
          slots: this.slots,
          courseRuns: this.courseRuns,
          teacherAvailability: this.teacherAvailability,
          teachingDays: this.teachingDays,
          examDates: this.examDates,
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
      hp: course.hp || 7.5,
      is_law_course: course.is_law_course || false,
      law_type: course.law_type || null,
      default_block_length: course.default_block_length || 1,
      preferred_order_index: course.preferred_order_index || 999,
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
    const id = Math.max(...this.slots.map((s) => s.slot_id), 0) + 1;
    const newSlot = {
      slot_id: id,
      start_date: slot.start_date || "",
      end_date: slot.end_date || "",
      evening_pattern: slot.evening_pattern || "",
      is_placeholder: slot.is_placeholder !== false,
      location: slot.location || "",
      is_law_period: slot.is_law_period || false,
    };
    this.slots.push(newSlot);

    // Generate default teaching days for new slot
    this.generateDefaultTeachingDays(id);

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
    this.notify();
    return newRun;
  }

  getCourseRuns() {
    return this.courseRuns;
  }

  getCourseRunsBySlot(slotId) {
    return this.courseRuns.filter((r) => r.slot_id === slotId);
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

    if (!slot) return [];

    // Find the slot's end date (next slot's start date or add 4 weeks)
    const allSlots = this.slots
      .slice()
      .sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

    const slotIndex = allSlots.findIndex(
      (s) =>
        String(s.slot_id) === String(slot.slot_id) ||
        normalizeDate(s.start_date) === normalizeDate(slot.start_date)
    );

    let endDate = null;
    // Find the next slot whose start_date is strictly greater than this slot's start_date
    for (let i = slotIndex + 1; i < allSlots.length; i++) {
      const candidateDate = new Date(allSlots[i].start_date).getTime();
      const currentStart = new Date(slot.start_date).getTime();
      if (candidateDate > currentStart) {
        endDate = new Date(allSlots[i].start_date);
        break;
      }
    }
    if (!endDate) {
      // No later slot found - add 4 weeks
      endDate = new Date(slot.start_date);
      endDate.setDate(endDate.getDate() + 28);
    }

    // Generate array of all days between start and end
    const days = [];
    const currentDate = new Date(slot.start_date);

    while (currentDate < endDate) {
      days.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  // Teaching days methods
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

  generateDefaultTeachingDays(slotId) {
    const defaultDates = this.getDefaultTeachingDaysPattern(slotId);

    // Remove any existing teaching days for this slot first
    this.teachingDays = this.teachingDays.filter((td) => td.slot_id !== slotId);

    // Add default teaching days with isDefault flag and active state
    defaultDates.forEach((date) => {
      this.teachingDays.push({
        slot_id: slotId,
        date,
        isDefault: true, // This is a standard day
        active: true, // Standard days are active by default
      });
    });
  }

  initializeAllTeachingDays() {
    // Generate default teaching days for all slots that don't have any
    this.slots.forEach((slot) => {
      const hasTeachingDays = this.teachingDays.some(
        (td) => td.slot_id === slot.slot_id
      );
      if (!hasTeachingDays) {
        this.generateDefaultTeachingDays(slot.slot_id);
      }
    });
    this.notify();
  }

  toggleTeachingDay(slotId, date) {
    const defaultDates = this.getDefaultTeachingDaysPattern(slotId);
    const isDefaultDate = defaultDates.includes(date);

    const existingIndex = this.teachingDays.findIndex(
      (td) => td.slot_id === slotId && td.date === date
    );

    if (existingIndex !== -1) {
      const existing = this.teachingDays[existingIndex];

      if (existing.isDefault) {
        // It's a default day - toggle active state
        existing.active = !existing.active;
      } else {
        // It's an alternative day - remove it completely
        this.teachingDays.splice(existingIndex, 1);
      }
    } else {
      // Day doesn't exist - add it
      this.teachingDays.push({
        slot_id: slotId,
        date,
        isDefault: isDefaultDate,
        active: true,
      });
    }
    this.notify();
  }

  getTeachingDayState(slotId, date) {
    const td = this.teachingDays.find(
      (td) => td.slot_id === slotId && td.date === date
    );

    if (!td) return null;

    return {
      isDefault: td.isDefault || false,
      active: td.active !== false, // Default to true for old data
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
    if (data.courses) {
      data.courses.forEach((c) => this.addCourse(c));

      // After adding all courses, convert prerequisite_codes to prerequisite IDs
      if (data.courses.some((c) => c.prerequisite_codes)) {
        this.courses.forEach((course) => {
          const seedCourse = data.courses.find((c) => c.code === course.code);
          if (
            seedCourse?.prerequisite_codes &&
            seedCourse.prerequisite_codes.length > 0
          ) {
            // Convert codes to course_ids
            course.prerequisites = seedCourse.prerequisite_codes
              .map((code) => {
                const prereqCourse = this.courses.find((c) => c.code === code);
                return prereqCourse ? prereqCourse.course_id : null;
              })
              .filter((id) => id !== null);
          }
        });
      }
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
    };
  }

  // Reset to seed data
  async resetToSeedData() {
    // Clear current data
    this.courses = [];
    this.cohorts = [];
    this.teachers = [];
    this.slots = [];
    this.courseRuns = [];
    this.teacherAvailability = [];

    // Reload seed data WITHOUT courseRuns - cohorts should start with empty sequences
    const seedDataWithoutRuns = {
      courses: seedData.courses,
      cohorts: seedData.cohorts,
      teachers: seedData.teachers,
      slots: seedData.slots,
      // courseRuns intentionally omitted - each cohort starts fresh
      teacherAvailability: seedData.teacherAvailability,
    };
    this.importData(seedDataWithoutRuns);
  }
}

export const store = new DataStore();
