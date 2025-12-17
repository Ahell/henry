import { seedData } from "../../../data/seedData.js";
import { DataService } from "./data.service.js"; // Moved import inside
import { showAlert } from "../../../shared/utils/ui.js";

export class DataServiceManager {
  constructor(store) {
    this.store = store;
    this.dataService = new DataService(store);
  }

  _syncStoreCollections() {
    this.store.cohorts = this.store.cohortsManager.getCohorts();
    this.store.slots = this.store.slotsManager.getSlots();
  }

  hydrate(data) {
    // Load data from backend
    this.store.coursesManager.load(data.courses, data.coursePrerequisites);
    this.store.teachersManager.load(data.teachers, data.teacherCourses);
    this.store.examDatesManager.load(data.examDates || []);
    this.store.courseRunsManager.load(data.courseRuns || [], data.courseSlots || []);
    this.store.cohortsManager.load(data.cohorts || []);
    this.store.slotsManager.load(data.slots || []);
    this.store.availabilityManager.load(data.teacherAvailability || []);
    this.store.teachingDaysManager.loadTeachingDays(data.teachingDays || []);
    this.store.teachingDaysManager.loadSlotDays(data.slotDays || []);
    this.store.teachingDaysManager.loadCourseSlotDays(data.courseSlotDays || []);
    this.store.teachersManager.ensureTeacherCoursesFromCompatible();
    this.store.coursesManager.ensurePrerequisitesFromNormalized();
    this.store.teachersManager.ensureTeacherCompatibleFromCourses();

    // Fallback: if backend omitted courseRuns or teacherAvailability, fall back to seed data
    if (
      (!this.store.courseRunsManager.courseRuns || this.store.courseRunsManager.courseRuns.length === 0) &&
      seedData.courseRuns &&
      seedData.courseRuns.length > 0
    ) {
      console.warn(
        "Backend returned no courseRuns - falling back to seed data courseRuns"
      );
      this.store.courseRunsManager.load(seedData.courseRuns, seedData.courseSlots || []);
    }

    if (
      (!this.store.teacherAvailability || this.store.availabilityManager.getAllTeacherAvailability().length === 0) &&
      seedData.teacherAvailability &&
      seedData.teacherAvailability.length > 0
    ) {
      console.warn(
        "Backend returned no teacherAvailability - falling back to seed data teacherAvailability"
      );
      this.store.availabilityManager.load(seedData.teacherAvailability);
    }

    // Derive normalized structures if missing
    this.store.courseRunsManager.ensureCourseSlotsFromRuns();
    this.store.slotsManager.ensureSlotDaysFromSlots();
    this._syncStoreCollections();
    this.store.teachingDaysManager._ensureCourseSlotDayDefaults();
    this.store.slots = this.store.normalizer.normalizeSlotsInPlace(this.store.slots);
    this.store.validator.assertAllSlotsNonOverlapping();

    // Validate and fix teacher assignments (ensure one course per teacher per slot)
    this.store.validator.validateTeacherAssignments();

    // Validate courses have available teachers (remove those that don't)
    const removedCourses = this.store.validator.validateCoursesHaveTeachers();

    // If teachers exist but none have `compatible_courses` defined,
    // try to infer from assigned runs or fall back to a random assignment.
    const teachersMissingCompat =
      this.store.teachersManager.getTeachers().length > 0 &&
      this.store.teachersManager.getTeachers().every(
        (t) => !t.compatible_courses || t.compatible_courses.length === 0
      );

    if (teachersMissingCompat) {
      // Infer from assigned runs where possible
      for (const teacher of this.store.teachersManager.getTeachers()) {
        const assignedCourseIds = new Set();
        for (const run of this.store.courseRunsManager.courseRuns) {
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
      const stillMissing = this.store.teachersManager.getTeachers().some(
        (t) => !t.compatible_courses || t.compatible_courses.length === 0
      );
      if (stillMissing) {
        this.store.teachersManager.randomizeTeacherCourses(2, 5);
      }
    }

    // Calculate prerequisite problems
    this.store.prerequisiteProblems =
      this.store.prerequisites.findCoursesWithMissingPrerequisites();

    // Notify listeners that data is loaded
    this.store.events.notify();

    // Handle alerts for removed courses and prerequisite problems
    this._handleLoadAlerts(removedCourses);
  }

  // Load data from backend
  async loadFromBackend() {
    return this.dataService.loadFromBackend();
  }

  _handleLoadAlerts(removedCourses) {
    if (removedCourses.length > 0) {
      // Delay alert to after page load
      setTimeout(() => {
        let message = `Följande kurser flyttades till depån (ingen lärare tillgänglig):\n\n`;
        message += removedCourses
          .map(
            (c) =>
              `"${c.courseName}" (${c.courseCode}) för ${c.cohorts.join(", ")}`
          )
          .join("\n");

        // Add prerequisite warnings if any
        if (this.store.prerequisiteProblems.length > 0) {
          message += `\n\n⚠️ VARNING: Följande kurser saknar nu sina spärrkurser:\n\n`;
          const problemsByCourseCohort = new Map();
          for (const p of this.store.prerequisiteProblems) {
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
                `${p.cohortName}: "${p.courseName}" saknar spärrkurs ${p.missingPrereqs.join(", ")}`
            )
            .join("\n");
        }

        showAlert(message);
      }, 100);
    } else if (this.store.prerequisiteProblems.length > 0) {
      // Show only prerequisite warnings if no courses were removed but there are issues
      setTimeout(() => {
        let message = `⚠️ VARNING: Följande kurser saknar sina spärrkurser:\n\n`;
        const problemsByCourseCohort = new Map();
        for (const p of this.store.prerequisiteProblems) {
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
              `${p.cohortName}: "${p.courseName}" saknar spärrkurs ${p.missingPrereqs.join(", ")}`
          )
          .join("\n");

        showAlert(message);
      }, 100);
    }
  }

  async saveData() {
    this.store.teachersManager.syncTeacherCoursesFromTeachers();
    this.store.coursesManager.syncCoursePrerequisitesFromCourses();
    return this.dataService.saveData();
  }

  getDataSnapshot() {
    return {
      courses: this.store.coursesManager.getCourses(),
      cohorts: this.store.cohortsManager.getCohorts(),
      teachers: this.store.teachersManager.getTeachers(),
      teacherCourses: this.store.teachersManager.teacherCourses,
      coursePrerequisites: this.store.coursesManager.coursePrerequisites,
      slots: this.store.slotsManager.getSlots(),
      courseRuns: this.store.courseRunsManager.courseRuns,
      teacherAvailability: this.store.teacherAvailability,
      teachingDays: this.store.teachingDays,
      examDates: this.store.examDatesManager.examDates,
      courseSlots: this.store.courseRunsManager.courseSlots,
      slotDays: this.store.slotDays,
      courseSlotDays: this.store.courseSlotDays,
    };
  }

  importData(data) {
    // Reset current state so repeated imports don't accumulate duplicates
    this.store.coursesManager.load([], []); // Clear current courses and prereqs
    this.store.cohortsManager.load([]); // Clear current cohorts
    this.store.teachersManager.load([], []); // Clear teachers and teacherCourses
    this.store.slotsManager.load([]); // Clear slots
    this.store.courseRunsManager.load([], []); // Clear courseRuns and courseSlots
    this.store.availabilityManager.load([]); // Clear teacherAvailability
    this.store.teachingDaysManager.loadTeachingDays([]); // Clear teachingDays
    this.store.examDatesManager.load([]); // Clear examDates
    this.store.teachingDaysManager.loadSlotDays([]); // Clear slotDays
    this.store.teachingDaysManager.loadCourseSlotDays([]); // Clear courseSlotDays

    if (data.courses) {
      this.store.coursesManager.load(null, null, this.store.normalizer.normalizeCourses(data.courses || []));
    }
    if (data.cohorts) {
      this.store.cohortsManager.load(data.cohorts);
    }
    if (data.teachers) {
      this.store.teachersManager.load(
        data.teachers,
        data.teacherCourses || []
      );
    }
    if (data.slots) {
      // Need to add slots one by one to trigger validation and default teaching day generation
      data.slots.forEach((s) => this.store.slotsManager.addSlot(s));
    }
    if (data.courseRuns) {
      data.courseRuns.forEach((r) => this.store.courseRunsManager.addCourseRun(r));
    }
    if (data.teacherAvailability) {
      this.store.availabilityManager.load(data.teacherAvailability);
    }
    if (data.coursePrerequisites) {
      this.store.coursesManager.load(this.store.coursesManager.getCourses(), data.coursePrerequisites);
    }
    if (data.teachingDays) {
      this.store.teachingDaysManager.loadTeachingDays(data.teachingDays);
    }
    if (data.examDates) {
      this.store.examDatesManager.load(data.examDates);
    }
    if (data.courseSlots) {
      this.store.courseRunsManager.load(this.store.courseRunsManager.getCourseRuns(), data.courseSlots);
    }
    if (data.slotDays) {
      this.store.teachingDaysManager.loadSlotDays(data.slotDays);
    }
    if (data.courseSlotDays) {
      this.store.teachingDaysManager.loadCourseSlotDays(data.courseSlotDays);
    }
    this.store.courseRunsManager.ensureCourseSlotsFromRuns();
    this.store.slotsManager.ensureSlotDaysFromSlots();
    this._syncStoreCollections();
    this.store.events.notify();
  }

  // Export for Excel
  exportData() {
    return {
      courses: this.store.coursesManager.getCourses(),
      cohorts: this.store.cohortsManager.getCohorts(),
      teachers: this.store.teachersManager.getTeachers(),
      slots: this.store.slotsManager.getSlots(),
      courseRuns: this.store.courseRunsManager.courseRuns,
      teacherAvailability: this.store.teacherAvailability,
      courseSlots: this.store.courseRunsManager.courseSlots,
      slotDays: this.store.slotDays,
      courseSlotDays: this.store.courseSlotDays,
    };
  }

  // Reset to seed data
  async resetToSeedData() {
    // Clear current data using manager load methods
    this.store.coursesManager.load([], []);
    this.store.cohortsManager.load([]);
    this.store.teachersManager.load([], []);
    this.store.slotsManager.load([]);
    this.store.courseRunsManager.load([], []);
    this.store.availabilityManager.load([]);
    this.store.teachingDaysManager.loadTeachingDays([]);
    this.store.examDatesManager.load([]);
    this.store.teachingDaysManager.loadSlotDays([]);
    this.store.teachingDaysManager.loadCourseSlotDays([]);

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

  // Load seed data into database
  async loadSeedDataToDatabase() {
    try {
      // Load seedData into frontend store using importData
      this.importData(seedData);

      // Notify listeners
      this.store.events.notify();

      // Save to backend (will replace all existing data via bulk-save)
      await this.saveData();

      // Reload from backend to confirm persistence
      await this.loadFromBackend();

      return { success: true, message: "Seed data loaded successfully" };
    } catch (error) {
      console.error("Failed to load seed data:", error);
      throw error;
    }
  }

  // Reset database without loading seed data
  async resetDatabase() {
    try {
      // 1. Call backend reset-all endpoint to clear all tables
      const response = await fetch('http://localhost:3001/api/admin/reset-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Reset failed: ${response.statusText}`);
      }

      // Clear frontend data (without seeding) so UI reflects the empty database
      this.importData({});

      return { success: true, message: "Database reset" };
    } catch (error) {
      console.error("Failed to reset database:", error);
      throw error;
    }
  }

  // Public utility methods (delegate to services)
  normalizeDateOnly(value) {
    return this.store.normalizer.normalizeDateOnly(value);
  }

  defaultSlotEndDate(startDate) {
    return this.store.normalizer.defaultSlotEndDate(startDate);
  }
}
