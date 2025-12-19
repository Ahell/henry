/**
 * Event Manager Service
 * Handles subscription pattern for store updates
 *
 * Note: This manager requires full store reference due to its coordinating role.
 * It needs to access prerequisiteProblems, getCohort(), getCourseRun(), and getCourse()
 * methods for validation alerts. This is an intentional architectural decision.
 */
export class EventManager {
  constructor(store) {
    this.store = store;
    this.listeners = [];
    this.eventListeners = {}; // For named events like "course-deleted"
  }

  subscribe(eventNameOrListener, callback) {
    // Support two patterns:
    // 1. subscribe(callback) - general subscription
    // 2. subscribe("event-name", callback) - named event subscription
    if (typeof eventNameOrListener === "function") {
      // Pattern 1: General subscription
      this.listeners.push(eventNameOrListener);
    } else if (typeof eventNameOrListener === "string" && typeof callback === "function") {
      // Pattern 2: Named event subscription
      const eventName = eventNameOrListener;
      if (!this.eventListeners[eventName]) {
        this.eventListeners[eventName] = [];
      }
      this.eventListeners[eventName].push(callback);
    }
  }

  unsubscribe(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all subscribers of a data change
   *
   * Reactive Validation Flow (runs on every mutation):
   * 1. Teacher assignments - ensures one course per teacher per slot
   * 2. Course availability - removes courses with no available teachers
   * 3. Prerequisites - checks for missing/misordered prerequisites
   *
   * Note: Slot overlap validation happens proactively in slots.manager.js
   * before slots are added (not reactively here). Slots are validated and
   * rejected at creation time if they would overlap.
   *
   * After validation, triggers auto-save unless reconciling with backend.
   *
   * IMPORTANT: This is different from DataServiceManager.hydrate() validation,
   * which runs once during data load. This reactive validation runs on every
   * user mutation to maintain data consistency.
   *
   * @param {string} eventName - Optional named event for targeted subscriptions
   * @param {...any} args - Event arguments passed to named event listeners
   */
  notify(eventName, ...args) {
    // If this is a named event notification, call those listeners
    if (eventName && this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach((callback) => callback(...args));
      return; // Don't run the validation/notification logic for named events
    }

    // Otherwise, this is a general notification
    // Run validations before notifying listeners
    this.store.validator.validateTeacherAssignments();
    const removedCourses = this.store.validator.validateCoursesHaveTeachers();

    // Get previous prerequisite problems to detect new ones
    const previousProblems = new Set(
      (this.store.prerequisiteProblems || []).map(
        (p) => `${p.cohortId}-${p.runId}-${p.missingPrereqId}`
      )
    );

    // Check for prerequisite problems after removing courses
    this.store.prerequisiteProblems =
      this.store.prerequisites.findCoursesWithMissingPrerequisites();

    // Find NEW prerequisite problems (ones that weren't there before)
    const newProblems = this.store.prerequisiteProblems.filter(
      (p) =>
        !previousProblems.has(`${p.cohortId}-${p.runId}-${p.missingPrereqId}`)
    );

    // Notify all listeners
    this.listeners.forEach((l) => l());

    // Auto-save after notifications unless we are reconciling with backend
    if (!this.store.isReconciling) {
      this.store.saveData().catch((err) => console.error("Auto-save failed:", err));
    }

    // Show alert if courses were removed
    if (removedCourses.length > 0) {
      let message = `Följande kurser flyttades till depån (ingen lärare tillgänglig):\n\n`;
      message += removedCourses
        .map(
          (rc) => `${rc.courseCode} ${rc.courseName} (${rc.cohorts.join(", ")})`
        )
        .join("\n");
      this.showAlert(message);
    }

    // Show alert for new prerequisite problems
    if (newProblems.length > 0) {
      let message = `Nya förkunskapskränkningar upptäcktes:\n\n`;
      message += newProblems
        .map((p) => {
          const cohort = this.store.getCohort(p.cohortId);
          const run = this.store.getCourseRun(p.runId);
          const course = run ? this.store.getCourse(run.course_id) : null;
          const missing = this.store.getCourse(p.missingPrereqId);
          return `${cohort?.name || "Okänd kohort"}: ${
            course?.code || "?"
          } kräver ${missing?.code || "?"}`;
        })
        .join("\n");
      this.showAlert(message);
    }
  }

  showAlert(msg) {
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
}
