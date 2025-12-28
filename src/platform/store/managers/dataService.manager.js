import { DataService } from "../../services/data.service.js"; // Moved import inside
import { showAlert } from "../../../utils/ui.js";

export class DataServiceManager {
  constructor(store) {
    this.store = store;
    this.dataService = new DataService();
  }

  _syncStoreCollections() {
    this.store.cohorts = this.store.cohortsManager.getCohorts();
    this.store.slots = this.store.slotsManager.getSlots();
  }

  hydrate(data) {
    // Load data from backend
    this.store.businessLogicManager.load(data.businessLogic);
    this.store.coursesManager.load(
      data.courses,
      data.coursePrerequisites,
      null,
      data.courseExaminators || [],
      data.courseKursansvarig || []
    );
    this.store.teachersManager.load(data.teachers, data.teacherCourses);
    this.store.examDatesManager.load(data.examDates || []);

    // FIX: Do not load courseSlots directly from backend to avoid "synthetic ID explosion".
    // Instead, regenerate normalized base IDs locally and remap the incoming data.
    this.store.courseRunsManager.load(
      data.courseRuns || [],
      [] // Ignore backend courseSlots (which are actually expanded cohortSlotCourses)
    );
    this.store.courseRunsManager.ensureCourseSlotsFromRuns();

    // Create mapping from Backend ID (expanded) -> Local Base ID (normalized)
    const expandedIdToBaseId = new Map();
    const baseSlots = this.store.courseRunsManager.courseSlots;
    
    // Index base slots by key
    const keyToBaseId = new Map();
    baseSlots.forEach((cs) => {
      keyToBaseId.set(`${cs.course_id}-${cs.slot_id}`, cs.course_slot_id);
    });

    // Use the raw cohortSlotCourses table if available (new backend), otherwise fallback to courseSlots (legacy)
    // The cohortSlotCourses table contains the mapping from synthetic ID (cohort_slot_course_id) 
    // to course_id/slot_id, which allows us to find the base ID.
    const backendMappingSource = data.cohortSlotCourses || data.courseSlots || [];

    backendMappingSource.forEach((es) => {
      const baseId = keyToBaseId.get(`${es.course_id}-${es.slot_id}`);
      // Handle both ID field names depending on backend payload shape
      const expandedId = es.cohort_slot_course_id ?? es.course_slot_id;

      if (baseId != null && expandedId != null) {
        expandedIdToBaseId.set(String(expandedId), baseId);
      }
    });

    // Remap courseSlotDays to use local base IDs
    const remappedCourseSlotDays = (data.courseSlotDays || []).map((csd) => {
      const expandedId = csd.course_slot_id;
      const baseId = expandedIdToBaseId.get(String(expandedId));
      return baseId ? { ...csd, course_slot_id: baseId } : csd;
    });

    this.store.cohortsManager.load(data.cohorts || []);
    this.store.slotsManager.load(data.slots || []);
    this.store.availabilityManager.load(data.teacherAvailability || []);
    this.store.teachingDaysManager.loadTeachingDays(data.teachingDays || []);
    this.store.slotDays = data.slotDays || [];
    this.store.teachingDaysManager.loadCourseSlotDays(
      remappedCourseSlotDays || []
    );
    this.store.teachersManager.ensureTeacherCoursesFromCompatible();
    this.store.coursesManager.ensurePrerequisitesFromNormalized();
    this.store.coursesManager.ensureExaminatorsFromNormalized();
    this.store.coursesManager.ensureKursansvarigFromNormalized();
    this.store.teachersManager.ensureTeacherCompatibleFromCourses();

    // Derive normalized structures if missing
    this.store.courseRunsManager.ensureCourseSlotsFromRuns(); // Redundant but safe
    this._syncStoreCollections();
    this.store.teachingDaysManager._ensureCourseSlotDayDefaults();
    this.store.slotDays = this.store.slotsManager.slotDays;
    this.store.validator.assertAllSlotsNonOverlapping();

    // One-time validation during data load (different from reactive notify() validation)
    // This runs once on startup/reload, whereas EventManager.notify() runs on every mutation

    // Validate and fix teacher assignments (ensure one course per teacher per slot)
    this.store.validator.validateTeacherAssignments();

    // If teachers exist but none have `compatible_courses` defined,
    // try to infer from assigned runs or fall back to a random assignment.
    const teachersMissingCompat =
      this.store.teachersManager.getTeachers().length > 0 &&
      this.store.teachersManager
        .getTeachers()
        .every(
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
      const stillMissing = this.store.teachersManager
        .getTeachers()
        .some(
          (t) => !t.compatible_courses || t.compatible_courses.length === 0
        );
      if (stillMissing) {
        this.store.teachersManager.randomizeTeacherCourses(2, 5);
      }
    }

    // Calculate prerequisite problems
    this.store.prerequisiteProblems =
      this.store.prerequisites.findCoursesWithMissingPrerequisites();

    this.store.initializeCommitSnapshot(this.getDataSnapshot());

    // Notify listeners that data is loaded
    this.store.events.notify();

    // Handle alerts for prerequisite problems
    this._handleLoadAlerts();
  }

  // Load data from backend
  async loadData() {
    const data = await this.dataService.loadData();
    if (data) {
      this.hydrate(data);
    }
    return data;
  }

  _handleLoadAlerts() {
    if (this.store.prerequisiteProblems.length > 0) {
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
              `${p.cohortName}: "${
                p.courseName
              }" saknar spärrkurs ${p.missingPrereqs.join(", ")}`
          )
          .join("\n");

        showAlert(message);
      }, 100);
    }
  }

  async saveData() {
    this.store.teachersManager.syncTeacherCoursesFromTeachers();
    this.store.coursesManager.syncCoursePrerequisitesFromCourses();
    this.store.coursesManager.syncCourseExaminatorsFromCourses();
    this.store.coursesManager.syncCourseKursansvarigFromCourses();
    return this.dataService.saveData(this.getDataSnapshot());
  }

  getDataSnapshot() {
    const courseRuns = this.store.courseRunsManager.courseRuns;
    const courseSlots = this.store.courseRunsManager.courseSlots;
    const { cohortSlotCourses, courseSlotDays: expandedCourseSlotDays } =
      buildCohortSlotCoursesAndDays(
        courseRuns,
        courseSlots,
        this.store.courseSlotDays
      );
    return {
      courses: this.store.coursesManager.getCourses(),
      cohorts: this.store.cohortsManager.getCohorts(),
      teachers: this.store.teachersManager.getTeachers(),
      teacherCourses: this.store.teachersManager.teacherCourses,
      coursePrerequisites: this.store.coursesManager.coursePrerequisites,
      courseExaminators: this.store.coursesManager.courseExaminators,
      courseKursansvarig: this.store.coursesManager.courseKursansvarig,
      slots: this.store.slotsManager.getSlots(),
      courseRuns,
      teacherAvailability: this.store.teacherAvailability,
      teachingDays: this.store.teachingDays,
      examDates: this.store.examDatesManager.examDates,
      // Persist scheduling via the backend's canonical "cohort_slot_courses" shape.
      cohortSlotCourses,
      courseSlots: cohortSlotCourses,
      slotDays: this.store.slotDays,
      courseSlotDays: expandedCourseSlotDays,
      businessLogic: this.store.businessLogicManager.getBusinessLogic(),
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
    this.store.businessLogicManager.load(data.businessLogic);

    const courseExaminators = Array.isArray(data.courseExaminators)
      ? data.courseExaminators
      : [];
    const courseKursansvarig = Array.isArray(data.courseKursansvarig)
      ? data.courseKursansvarig
      : [];

    if (data.courses) {
      this.store.coursesManager.load(
        data.courses || [],
        data.coursePrerequisites || [],
        null,
        courseExaminators,
        courseKursansvarig
      );
    }
    if (data.cohorts) {
      this.store.cohortsManager.load(data.cohorts);
    }
    if (data.teachers) {
      this.store.teachersManager.load(data.teachers, data.teacherCourses || []);
    }
    if (data.slots) {
      // Need to add slots one by one to trigger validation and default teaching day generation
      data.slots.forEach((s) => this.store.slotsManager.addSlot(s));
    }
    if (data.courseRuns) {
      data.courseRuns.forEach((r) =>
        this.store.courseRunsManager.addCourseRun(r)
      );
    }
    if (data.teacherAvailability) {
      this.store.availabilityManager.load(data.teacherAvailability);
    }
    if (data.coursePrerequisites) {
      this.store.coursesManager.load(
        this.store.coursesManager.getCourses(),
        data.coursePrerequisites,
        null,
        courseExaminators.length > 0
          ? courseExaminators
          : this.store.coursesManager.courseExaminators,
        courseKursansvarig.length > 0
          ? courseKursansvarig
          : this.store.coursesManager.courseKursansvarig
      );
    }
    if (data.teachingDays) {
      this.store.teachingDaysManager.loadTeachingDays(data.teachingDays);
    }
    if (data.examDates) {
      this.store.examDatesManager.load(data.examDates);
    }
    if (data.slotDays) {
      this.store.slotDays = data.slotDays;
    }
    const hasBaseCourseSlots = Array.isArray(data.courseSlots)
      ? data.courseSlots.some((cs) => cs?.course_slot_id != null)
      : false;
    if (hasBaseCourseSlots) {
      this.store.courseRunsManager.load(
        this.store.courseRunsManager.getCourseRuns(),
        data.courseSlots
      );
    }
    this.store.courseRunsManager.ensureCourseSlotsFromRuns();
    const baseSlots = this.store.courseRunsManager.courseSlots || [];
    const keyToBaseId = new Map();
    baseSlots.forEach((cs) => {
      keyToBaseId.set(`${cs.course_id}-${cs.slot_id}`, cs.course_slot_id);
    });
    const expandedIdToBaseId = new Map();
    const mappingSource = data.cohortSlotCourses || data.courseSlots || [];
    mappingSource.forEach((es) => {
      const baseId = keyToBaseId.get(`${es.course_id}-${es.slot_id}`);
      const expandedId = es.cohort_slot_course_id ?? es.course_slot_id;
      if (baseId != null && expandedId != null) {
        expandedIdToBaseId.set(String(expandedId), baseId);
      }
    });
    if (data.courseSlotDays) {
      const remappedCourseSlotDays = (data.courseSlotDays || []).map((csd) => {
        const baseId = expandedIdToBaseId.get(String(csd.course_slot_id));
        return baseId ? { ...csd, course_slot_id: baseId } : csd;
      });
      this.store.teachingDaysManager.loadCourseSlotDays(remappedCourseSlotDays);
    }
    this.store.slotsManager.ensureSlotDaysFromSlots();
    this.store.slotDays = this.store.slotsManager.slotDays;
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
      businessLogic: this.store.businessLogicManager.getBusinessLogic(),
    };
  }

  // Load seed data into database via backend
  async loadSeedDataToDatabase() {
    this.store._beginReconciling();
    try {
      await this.dataService.loadTestData();
      await this.loadData();
      return { success: true, message: "Seed data loaded successfully" };
    } catch (error) {
      console.error("Failed to load seed data:", error);
      throw error;
    } finally {
      this.store._endReconciling();
    }
  }

  // Reset database without loading seed data
  async resetDatabase() {
    this.store._beginReconciling();
    try {
      // Clear all tables via backend
      await this.dataService.api.resetAllData();

      // Reload canonical state from backend so the UI also reflects persisted
      // app_settings (e.g. business logic defaults after reset).
      await this.loadData();

      return { success: true, message: "Database reset" };
    } catch (error) {
      console.error("Failed to reset database:", error);
      throw error;
    } finally {
      this.store._endReconciling();
    }
  }

  // Public utility methods (delegate to services)
}

function buildCohortSlotCoursesAndDays(
  courseRuns = [],
  courseSlots = [],
  courseSlotDays = []
) {
  if (!Array.isArray(courseRuns))
    return { cohortSlotCourses: [], courseSlotDays: [] };

  const slotMap = new Map();
  (courseSlots || []).forEach((cs) => {
    const key = `${cs.course_id}-${cs.slot_id}`;
    const id = cs.course_slot_id ?? cs.cohort_slot_course_id;
    if (id != null) {
      slotMap.set(key, id);
    }
  });

  const cohortSlotCourses = [];
  const baseIdToUniqueIds = new Map();

  courseRuns.forEach((run) => {
    if (!run) return;

    const baseId = slotMap.get(`${run.course_id}-${run.slot_id}`);
    
    // Ensure unique cohorts to prevent duplicate synthetic IDs
    const uniqueCohorts = Array.isArray(run.cohorts) && run.cohorts.length > 0
      ? [...new Set(run.cohorts)]
      : [null];

    uniqueCohorts.forEach((cohortId, idx) => {
      const syntheticId =
        baseId != null
          ? baseId * 10000 + (cohortId != null ? Number(cohortId) + 1 : idx)
          : null;

      if (baseId != null && syntheticId != null) {
        const baseIdKey = String(baseId);
        if (!baseIdToUniqueIds.has(baseIdKey)) {
          baseIdToUniqueIds.set(baseIdKey, []);
        }
        baseIdToUniqueIds.get(baseIdKey).push(syntheticId);
      }

      cohortSlotCourses.push({
        cohort_slot_course_id: syntheticId,
        joint_run_id: run.run_id ?? null,
        course_id: run.course_id,
        slot_id: run.slot_id,
        cohort_id: cohortId,
        teachers: Array.isArray(run.teachers) ? [...new Set(run.teachers)] : [],
        slot_span: Number(run.slot_span) >= 1 ? Number(run.slot_span) : 1,
        kursansvarig_id: run.kursansvarig_id ?? null,
        created_at: run.created_at || new Date().toISOString(),
      });
    });
  });

  const expandedCourseSlotDays = [];
  (courseSlotDays || []).forEach((csd) => {
    const baseId = csd.course_slot_id;
    const uniqueIds = baseIdToUniqueIds.get(String(baseId));

    if (uniqueIds && uniqueIds.length > 0) {
      uniqueIds.forEach((uid) => {
        expandedCourseSlotDays.push({
          ...csd,
          cohort_slot_course_id: null, // Force use of new uid
          course_slot_id: uid,
          course_slot_day_id: null, // Let DB auto-increment
        });
      });
    }
  });

  return { cohortSlotCourses, courseSlotDays: expandedCourseSlotDays };
}
