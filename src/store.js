import { LitElement, html, css } from "lit";
import { seedData } from "./seedData.js";

export class DataStore {
  constructor() {
    this.courses = [];
    this.cohorts = [];
    this.teachers = [];
    this.slots = [];
    this.courseRuns = [];
    this.teacherAvailability = [];
    this.listeners = [];

    // Try to load saved data from localStorage first
    const hasSavedData = this.loadData();

    // If no saved data, load seed data
    if (!hasSavedData) {
      this.importData(seedData);
    }
  }

  // Load data from localStorage
  loadData() {
    const savedCourses = localStorage.getItem("kurser");
    const savedCohorts = localStorage.getItem("grupper");
    const savedTeachers = localStorage.getItem("personal");
    const savedSlots = localStorage.getItem("slots");
    const savedCourseRuns = localStorage.getItem("kurstillfallen");
    const savedAvailability = localStorage.getItem("teacherAvailability");

    // Check if any data exists
    if (
      !savedCourses &&
      !savedCohorts &&
      !savedTeachers &&
      !savedSlots &&
      !savedCourseRuns
    ) {
      return false;
    }

    // Load saved data
    if (savedCourses) this.courses = JSON.parse(savedCourses);
    if (savedCohorts) this.cohorts = JSON.parse(savedCohorts);
    if (savedTeachers) this.teachers = JSON.parse(savedTeachers);
    if (savedSlots) this.slots = JSON.parse(savedSlots);
    if (savedCourseRuns) this.courseRuns = JSON.parse(savedCourseRuns);
    if (savedAvailability)
      this.teacherAvailability = JSON.parse(savedAvailability);

    // Validate and fix teacher assignments (ensure one course per teacher per slot)
    this.validateTeacherAssignments();

    // Validate courses have available teachers (remove those that don't)
    const removedCourses = this.validateCoursesHaveTeachers();
    if (removedCourses.length > 0) {
      // Delay alert to after page load
      setTimeout(() => {
        const messages = removedCourses.map(
          (c) =>
            `"${c.courseName}" (${c.courseCode}) för ${c.cohorts.join(", ")}`
        );
        alert(
          `Följande kurser flyttades till depån (ingen lärare tillgänglig):\n\n${messages.join(
            "\n"
          )}`
        );
      }, 100);
      this.saveData(); // Save the changes
    }

    return true;
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
          cohorts: affectedCohorts,
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

  // Subscribe to changes
  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.validateTeacherAssignments();
    const removedCourses = this.validateCoursesHaveTeachers();
    this.listeners.forEach((l) => l());
    this.saveData();

    // Show alert if courses were removed
    if (removedCourses.length > 0) {
      const messages = removedCourses.map(
        (c) => `"${c.courseName}" (${c.courseCode}) för ${c.cohorts.join(", ")}`
      );
      alert(
        `Följande kurser flyttades till depån (ingen lärare tillgänglig):\n\n${messages.join(
          "\n"
        )}`
      );
    }
  }

  saveData() {
    localStorage.setItem("kurser", JSON.stringify(this.courses));
    localStorage.setItem("grupper", JSON.stringify(this.cohorts));
    localStorage.setItem("personal", JSON.stringify(this.teachers));
    localStorage.setItem("slots", JSON.stringify(this.slots));
    localStorage.setItem("kurstillfallen", JSON.stringify(this.courseRuns));
    localStorage.setItem(
      "teacherAvailability",
      JSON.stringify(this.teacherAvailability)
    );
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
  addCohort(cohort) {
    const id = Math.max(...this.cohorts.map((c) => c.cohort_id), 0) + 1;
    const newCohort = {
      cohort_id: id,
      name: cohort.name || "",
      start_date: cohort.start_date || "",
      planned_size: cohort.planned_size || 0,
    };
    this.cohorts.push(newCohort);
    this.notify();
    return newCohort;
  }

  getCohorts() {
    return this.cohorts;
  }

  getCohort(cohortId) {
    return this.cohorts.find((c) => c.cohort_id === cohortId);
  }

  updateCohort(cohortId, updates) {
    const index = this.cohorts.findIndex((c) => c.cohort_id === cohortId);
    if (index !== -1) {
      this.cohorts[index] = { ...this.cohorts[index], ...updates };
      this.notify();
      return this.cohorts[index];
    }
    return null;
  }

  deleteCohort(cohortId) {
    const index = this.cohorts.findIndex((c) => c.cohort_id === cohortId);
    if (index !== -1) {
      this.cohorts.splice(index, 1);
      // Also remove this cohort from all course runs
      this.courseRuns.forEach((run) => {
        if (run.cohorts) {
          run.cohorts = run.cohorts.filter((id) => id !== cohortId);
        }
      });
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

  toggleTeacherAvailabilityForSlot(teacherId, slotDate) {
    // Check if there's already unavailability for this teacher on this slot
    const existing = this.teacherAvailability.find(
      (a) => a.teacher_id === teacherId && a.from_date === slotDate
    );

    if (existing) {
      // Remove it
      this.removeTeacherAvailability(existing.id);
    } else {
      // Add unavailability
      this.addTeacherAvailability({
        teacher_id: teacherId,
        from_date: slotDate,
        to_date: slotDate,
        type: "busy",
      });
    }
  }

  isTeacherUnavailable(teacherId, slotDate) {
    return this.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.type === "busy"
    );
  }

  // Import from Excel/JSON
  importData(data) {
    if (data.courses) {
      data.courses.forEach((c) => this.addCourse(c));
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
  resetToSeedData() {
    // Clear localStorage
    localStorage.removeItem("kurser");
    localStorage.removeItem("grupper");
    localStorage.removeItem("personal");
    localStorage.removeItem("slots");
    localStorage.removeItem("kurstillfallen");
    localStorage.removeItem("teacherAvailability");

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
