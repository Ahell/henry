// Event Manager Service - Handles subscription pattern for store updates
export class EventManager {
  constructor(store) {
    this.store = store;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  unsubscribe(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  notify() {
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

    // Auto-save after notifications
    this.store.api.saveData(this.store.getDataSnapshot());

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
