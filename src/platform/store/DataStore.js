import {
  DataValidator,
  DataNormalizer,
  EventManager,
  PrerequisiteManager,
  DataServiceManager,
} from "./services/index.js";
import {
  CoursesManager,
  CourseRunsManager,
} from "../../features/courses/index.js";
import { TeachersManager } from "../../features/teachers/index.js";
import { CohortsManager } from "../../features/cohorts/index.js";
import { SlotsManager } from "../../features/slots/index.js";
import { AvailabilityManager } from "./availability.js";
import { ExamDatesManager } from "./examDates.js";
import { TeachingDaysManager } from "./teachingDays.js";

import { showAlert } from "../../utils/ui.js";

export const DEFAULT_SLOT_LENGTH_DAYS = 28;

// Dev-safe alert wrapper: logs as warning in dev, shows native alert in prod

  export class DataStore {
  constructor() {
    this.cohorts = [];
    this.slots = [];
    this.teacherAvailability = [];
    this.slotDays = [];
    this.courseSlotDays = [];
    this.teachingDays = []; // Array of {slot_id, date} objects marking teaching days
    this.prerequisiteProblems = [];

    // Initialize services
    this.validator = new DataValidator(this);
    this.normalizer = new DataNormalizer();
    this.events = new EventManager(this);
    this.prerequisites = new PrerequisiteManager(this);
    this.dataServiceManager = new DataServiceManager(this);

    // Initialize managers
    this.coursesManager = new CoursesManager(this.events);
    this.teachersManager = new TeachersManager(
      this.events,
      this.coursesManager
    );
    this.courseRunsManager = new CourseRunsManager(this.events);
    this.slotsManager = new SlotsManager(
      this.events,
      this.normalizer,
      this.courseRunsManager
    );
    this.cohortsManager = new CohortsManager(
      this.events,
      this.courseRunsManager
    );
    this.availabilityManager = new AvailabilityManager(this);
    this.examDatesManager = new ExamDatesManager(this.events);
    this.teachingDaysManager = new TeachingDaysManager(this);

    // Load data from backend asynchronously
    this.dataServiceManager.loadFromBackend().catch((error) => {
      console.error("Data load failed:", error);
      showAlert(
        `Kunde inte läsa data från backend: ${error.message}. Kontrollera att backend-servern körs.`
      );
    });

    this.events.subscribe("course-deleted", (courseId) => {
      // Delegate course run cleanup to CourseRunsManager
      this.courseRunsManager.handleCourseDeleted(courseId);

      // Get list of removed course slot IDs for cleanup
      const removedCourseSlotIds = new Set(
        (this.courseRunsManager.courseSlots || [])
          .filter((cs) => String(cs.course_id) === String(courseId))
          .map((cs) => cs.course_slot_id)
      );

      // Remove any course slot day rows that referenced the removed course slots
      this.courseSlotDays = (this.courseSlotDays || []).filter(
        (csd) => !removedCourseSlotIds.has(csd.course_slot_id)
      );

      // Delegate teacher-related cleanup to the TeachersManager
      this.teachersManager.handleCourseDeleted(courseId);
    });

    this.events.subscribe("teacher-deleted", (teacherId) => {
      // Delegate course run cleanup to CourseRunsManager
      this.courseRunsManager.handleTeacherDeleted(teacherId);

      // Remove any teacher availability rows for this teacher
      this.teacherAvailability = (this.teacherAvailability || []).filter(
        (a) => String(a.teacher_id) !== String(teacherId)
      );
    });
  }

  hydrate(data) {
    this.dataServiceManager.hydrate(data);
  }

  async loadFromBackend() {
    return this.dataServiceManager.loadFromBackend();
  }

  _handleLoadAlerts(removedCourses) {
    this.dataServiceManager._handleLoadAlerts(removedCourses);
  }
  // Subscribe to changes
  subscribe(listener) {
    this.events.subscribe(listener);
  }

  notify() {
    this.events.notify();
  }

  async saveData() {
    return this.dataServiceManager.saveData();
  }

  getDataSnapshot() {
    return this.dataServiceManager.getDataSnapshot();
  }

  renumberCohorts() {
    return this.cohortsManager.renumberCohorts();
  }

  // Cohorts
  async addCohort(cohort) {
    return this.cohortsManager.addCohort(cohort);
  }
  getCohorts() {
    return this.cohortsManager.getCohorts();
  }

  getCohort(cohortId) {
    return this.cohortsManager.getCohort(cohortId);
  }

  async updateCohort(cohortId, updates) {
    return this.cohortsManager.updateCohort(cohortId, updates);
  }

  async deleteCohort(cohortId) {
    return this.cohortsManager.deleteCohort(cohortId);
  }

  // Teachers
  addTeacher(teacher) {
    return this.teachersManager.addTeacher(teacher);
  }

  getTeachers() {
    return this.teachersManager.getTeachers();
  }

  getTeacher(teacherId) {
    return this.teachersManager.getTeacher(teacherId);
  }

  updateTeacher(teacherId, updates) {
    return this.teachersManager.updateTeacher(teacherId, updates);
  }

  deleteTeacher(teacherId) {
    return this.teachersManager.deleteTeacher(teacherId);
  }

  // Randomly assign compatible courses to each teacher
  randomizeTeacherCourses(minCourses = 2, maxCourses = 5) {
    this.teachersManager.randomizeTeacherCourses(minCourses, maxCourses);
    this.notify();
  }

  // Courses - delegate to CoursesManager
  getCourses() {
    return this.coursesManager.getCourses();
  }

  getCourse(courseId) {
    return this.coursesManager.getCourse(courseId);
  }

  addCourse(course) {
    return this.coursesManager.addCourse(course);
  }

  updateCourse(courseId, updates) {
    return this.coursesManager.updateCourse(courseId, updates);
  }

  deleteCourse(courseId) {
    return this.coursesManager.deleteCourse(courseId);
  }

  getAllPrerequisites(courseId, visited) {
    return this.coursesManager.getAllPrerequisites(courseId, visited);
  }

  _syncCoursePrerequisitesFromCourses() {
    this.coursesManager.syncCoursePrerequisitesFromCourses();
  }

  _syncTeacherCoursesFromTeachers() {
    this.teachersManager.syncTeacherCoursesFromTeachers();
  }

  // Exam Dates - delegate to ExamDatesManager
  setExamDate(slotId, date) {
    return this.examDatesManager.setExamDate(slotId, date);
  }

  clearExamDate(slotId) {
    return this.examDatesManager.clearExamDate(slotId);
  }

  getExamDate(slotId) {
    return this.examDatesManager.getExamDate(slotId);
  }

  isExamDate(slotId, date) {
    return this.examDatesManager.isExamDate(slotId, date);
  }

  isExamDateLocked(slotId) {
    return this.examDatesManager.isExamDateLocked(slotId);
  }

  unlockExamDate(slotId) {
    return this.examDatesManager.unlockExamDate(slotId);
  }

  lockExamDate(slotId) {
    return this.examDatesManager.lockExamDate(slotId);
  }

  // Slots
  addSlot(slot) {
    return this.slotsManager.addSlot(slot);
  }

  getSlots() {
    return this.slotsManager.getSlots();
  }

  getSlot(slotId) {
    return this.slotsManager.getSlot(slotId);
  }

  deleteSlot(slotId) {
    return this.slotsManager.deleteSlot(slotId);
  }

  getSlotDays(slotDateOrId) {
    return this.slotsManager.getSlotDays(slotDateOrId);
  }

  getDefaultTeachingDaysPattern(slotId) {
    return this.slotsManager.getDefaultTeachingDaysPattern(slotId);
  }

  _ensureSlotDaysFromSlots() {
    this.slotsManager.ensureSlotDaysFromSlots();
  }

  findOverlappingSlot(startDateStr, endDateStr, ignoreSlotId = null) {
    return this.slotsManager.findOverlappingSlot(
      startDateStr,
      endDateStr,
      ignoreSlotId
    );
  }

  // Course Runs - Delegate to CourseRunsManager
  addCourseRun(run) {
    return this.courseRunsManager.addCourseRun(run);
  }

  getCourseRuns() {
    return this.courseRunsManager.getCourseRuns();
  }

  getCourseRun(runId) {
    return this.courseRunsManager.getCourseRun(runId);
  }

  getCourseRunsBySlot(slotId) {
    return this.courseRunsManager.getCourseRunsBySlot(slotId);
  }

  updateCourseRun(runId, updates) {
    return this.courseRunsManager.updateCourseRun(runId, updates);
  }

  deleteCourseRun(runId) {
    return this.courseRunsManager.deleteCourseRun(runId);
  }

  _ensureCourseSlotsFromRuns() {
    return this.courseRunsManager.ensureCourseSlotsFromRuns();
  }

  deleteSlot(slotId) {
    return this.slotsManager.deleteSlot(slotId);
  }

  // Teacher Availability
  addTeacherAvailability(availability) {
    return this.availabilityManager.addTeacherAvailability(availability);
  }

  getTeacherAvailability(teacherId) {
    return this.availabilityManager.getTeacherAvailability(teacherId);
  }

  getAllTeacherAvailability() {
    return this.availabilityManager.getAllTeacherAvailability();
  }

  removeTeacherAvailability(id) {
    return this.availabilityManager.removeTeacherAvailability(id);
  }

  toggleTeacherAvailabilityForSlot(teacherId, slotDate, slotId) {
    return this.availabilityManager.toggleTeacherAvailabilityForSlot(
      teacherId,
      slotDate,
      slotId
    );
  }

  toggleTeacherAvailabilityForDay(teacherId, dateStr) {
    return this.availabilityManager.toggleTeacherAvailabilityForDay(
      teacherId,
      dateStr
    );
  }

  isTeacherUnavailable(teacherId, slotDate, slotId = null) {
    return this.availabilityManager.isTeacherUnavailable(
      teacherId,
      slotDate,
      slotId
    );
  }

  isTeacherUnavailableOnDay(teacherId, dateStr) {
    return this.availabilityManager.isTeacherUnavailableOnDay(
      teacherId,
      dateStr
    );
  }

  getTeacherUnavailablePercentageForSlot(teacherId, slotDate, slotId = null) {
    return this.availabilityManager.getTeacherUnavailablePercentageForSlot(
      teacherId,
      slotDate,
      slotId
    );
  }

  // Get all individual days within a slot (for detail view)
  getSlotDays(slotDateOrId) {
    return this.slotsManager.getSlotDays(slotDateOrId);
  }

  _ensureSlotDaysFromSlots() {
    this.slotsManager.ensureSlotDaysFromSlots();
  }

  // Teaching days methods (default pattern only; actual aktiva dagar finns i courseSlotDays)
  getDefaultTeachingDaysPattern(slotId) {
    return this.slotsManager.getDefaultTeachingDaysPattern(slotId);
  }

  // No-op legacy hooks (defaults hanteras nu per kursSlot via courseSlotDays)
  generateDefaultTeachingDays() {
    return this.teachingDaysManager.generateDefaultTeachingDays();
  }
  initializeAllTeachingDays() {
    return this.teachingDaysManager.initializeAllTeachingDays();
  }

  toggleTeachingDay(slotId, date, courseId = null) {
    return this.teachingDaysManager.toggleTeachingDay(slotId, date, courseId);
  }

  getTeachingDayState(slotId, date, courseId = null) {
    return this.teachingDaysManager.getTeachingDayState(slotId, date, courseId);
  }

  getTeachingDaysForSlot(slotId) {
    return this.teachingDaysManager.getTeachingDaysForSlot(slotId);
  }

  isTeachingDay(slotId, date) {
    return this.teachingDaysManager.isTeachingDay(slotId, date);
  }

  importData(data) {
    this.dataServiceManager.importData(data);
  }

  exportData() {
    return this.dataServiceManager.exportData();
  }

  async resetToSeedData() {
    return this.dataServiceManager.resetToSeedData();
  }

  async loadSeedDataToDatabase() {
    return this.dataServiceManager.loadSeedDataToDatabase();
  }

  getCourseSlots() {
    return this.teachingDaysManager.getCourseSlots();
  }

  getCourseSlot(courseId, slotId) {
    return this.teachingDaysManager.getCourseSlot(courseId, slotId);
  }

  getCourseSlotDays(courseSlotId) {
    return this.teachingDaysManager.getCourseSlotDays(courseSlotId);
  }

  getCourseSlotDaysForCourse(slotId, courseId) {
    return this.teachingDaysManager.getCourseSlotDaysForCourse(
      slotId,
      courseId
    );
  }

  toggleCourseSlotDay(
    slotId,
    courseId,
    dateStr,
    { skipSave = false, skipNotify = false } = {}
  ) {
    return this.teachingDaysManager.toggleCourseSlotDay(
      slotId,
      courseId,
      dateStr,
      { skipSave, skipNotify }
    );
  }

  // Public utility methods (delegate to services)
  normalizeDateOnly(value) {
    return this.dataServiceManager.normalizeDateOnly(value);
  }

  defaultSlotEndDate(startDate) {
    return this.dataServiceManager.defaultSlotEndDate(startDate);
  }
}

export const store = new DataStore();
