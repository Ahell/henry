/**
 * Courses Manager
 * Manages course entities and their prerequisites
 */
export class CoursesManager {
  constructor(events) {
    this.events = events;
    this.courses = [];
    this.coursePrerequisites = [];
    this.courseExaminators = [];
    this.courseKursansvarig = [];
  }

  /**
   * Load courses and prerequisites from backend data
   * @param {Array} courses - Course entities
   * @param {Array} coursePrerequisites - Course prerequisite junction table
   * @param {Array} normalizedCourses - Pre-normalized courses with prerequisites embedded
   * @param {Array} courseExaminators - Course examinators junction table
   * @param {Array} courseKursansvarig - Course kursansvarig junction table
   */
  load(courses, coursePrerequisites, normalizedCourses, courseExaminators, courseKursansvarig) {
    this.courses = normalizedCourses || courses || [];
    this.coursePrerequisites = coursePrerequisites || [];
    this.courseExaminators = Array.isArray(courseExaminators)
      ? courseExaminators
      : [];
    this.courseKursansvarig = Array.isArray(courseKursansvarig)
      ? courseKursansvarig
      : [];
  }

  /**
   * Add a new course to the system
   * @param {Object} course - Course data
   * @param {string} course.code - Course code (e.g., "FE23", "JS1")
   * @param {string} course.name - Course name
   * @param {number} [course.credits=7.5] - Credit points (7.5 or 15)
   * @param {number[]} [course.prerequisites=[]] - Array of prerequisite course IDs
   * @returns {Object} The created course with generated course_id
   */
  addCourse(course) {
    const id = Math.max(...this.courses.map((c) => c.course_id), 0) + 1;
    const newCourse = {
      course_id: id,
      code: course.code || "",
      name: course.name || "",
      credits:
        Number.isFinite(Number(course.credits)) && Number(course.credits) === 15
          ? 15
          : 7.5,
      prerequisites: course.prerequisites || [], // Array of course_ids that must be completed before this course
    };
    this.courses.push(newCourse);
    this.events.notify();
    return newCourse;
  }

  /**
   * Get all courses
   * @returns {Array} Array of course objects
   */
  getCourses() {
    return this.courses;
  }

  /**
   * Get a specific course by ID
   * @param {number} courseId - Course ID
   * @returns {Object|undefined} Course object or undefined if not found
   */
  getCourse(courseId) {
    return this.courses.find((c) => c.course_id === courseId);
  }

  /**
   * Get all prerequisites for a course, including transitive dependencies
   * Recursively follows prerequisite chains (prerequisites of prerequisites)
   * @param {number} courseId - Course ID
   * @param {Set} [visited=new Set()] - Internal set to prevent circular dependencies
   * @returns {number[]} Array of all prerequisite course IDs (direct and transitive)
   */
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

  /**
   * Update an existing course
   * @param {number} courseId - Course ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated course object or null if not found
   */
  updateCourse(courseId, updates) {
    const index = this.courses.findIndex((c) => c.course_id === courseId);
    if (index !== -1) {
      this.courses[index] = { ...this.courses[index], ...updates };
      this.events.notify();
      return this.courses[index];
    }
    return null;
  }

  /**
   * Delete a course from the system
   * Also removes all prerequisite relationships involving this course
   * Triggers "course-deleted" event for cleanup in other managers
   * @param {number} courseId - Course ID to delete
   * @returns {boolean} True if deleted, false if not found
   */
  deleteCourse(courseId) {
    const index = this.courses.findIndex((c) => c.course_id === courseId);
    if (index !== -1) {
      this.courses.splice(index, 1);
      // Also remove any prerequisites where this course is involved
      this.coursePrerequisites = (this.coursePrerequisites || []).filter(
        (pr) =>
          String(pr.course_id) !== String(courseId) &&
          String(pr.prerequisite_course_id) !== String(courseId)
      );
      // Also remove examinator mapping for this course
      this.courseExaminators = (this.courseExaminators || []).filter(
        (ce) => String(ce.course_id) !== String(courseId)
      );
      // Also remove kursansvarig mapping for this course
      this.courseKursansvarig = (this.courseKursansvarig || []).filter(
        (ck) => String(ck.course_id) !== String(courseId)
      );
      this.events.notify("course-deleted", courseId);
      this.events.notify();
      return true;
    }
    return false;
  }

  /**
   * Hydrate course.prerequisites arrays from coursePrerequisites junction table
   * Used during data loading to populate embedded prerequisite arrays
   */
  ensurePrerequisitesFromNormalized() {
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

  /**
   * Hydrate course.examinator_teacher_id from courseExaminators junction table
   */
  ensureExaminatorsFromNormalized() {
    if (!Array.isArray(this.courses)) return;
    const byCourse = new Map();
    (this.courseExaminators || []).forEach((row) => {
      if (row?.course_id == null) return;
      byCourse.set(String(row.course_id), row.teacher_id);
    });
    this.courses.forEach((c) => {
      const tid = byCourse.get(String(c.course_id));
      c.examinator_teacher_id = tid != null ? tid : null;
    });
  }

  /**
   * Synchronize courseExaminators junction table from course.examinator_teacher_id
   */
  syncCourseExaminatorsFromCourses() {
    if (!Array.isArray(this.courses)) return;
    const next = [];
    const seen = new Set();
    this.courses.forEach((c) => {
      const tid = c?.examinator_teacher_id;
      if (tid == null || tid === "") return;
      const key = String(c.course_id);
      if (seen.has(key)) return;
      next.push({ course_id: c.course_id, teacher_id: tid });
      seen.add(key);
    });
    this.courseExaminators = next;
  }

  getCourseExaminatorTeacherId(courseId) {
    const course = this.getCourse(courseId);
    if (course && course.examinator_teacher_id != null) {
      return course.examinator_teacher_id;
    }
    const row = (this.courseExaminators || []).find(
      (ce) => String(ce.course_id) === String(courseId)
    );
    return row?.teacher_id ?? null;
  }

  setCourseExaminator(courseId, teacherId) {
    const course = this.getCourse(courseId);
    if (!course) return null;

    const normalizedTeacherId =
      teacherId == null || teacherId === "" ? null : Number(teacherId);
    course.examinator_teacher_id = normalizedTeacherId;

    this.courseExaminators = (this.courseExaminators || []).filter(
      (ce) => String(ce.course_id) !== String(courseId)
    );
    if (normalizedTeacherId != null && Number.isFinite(normalizedTeacherId)) {
      this.courseExaminators.push({
        course_id: course.course_id,
        teacher_id: normalizedTeacherId,
      });
    }

    this.events.notify();
    return normalizedTeacherId;
  }

  clearCourseExaminator(courseId) {
    return this.setCourseExaminator(courseId, null);
  }

  /**
   * Hydrate course.kursansvarig_teacher_id from courseKursansvarig junction table
   */
  ensureKursansvarigFromNormalized() {
    if (!Array.isArray(this.courses)) return;
    const byCourse = new Map();
    (this.courseKursansvarig || []).forEach((row) => {
      if (row?.course_id == null) return;
      byCourse.set(String(row.course_id), row.teacher_id);
    });
    this.courses.forEach((c) => {
      const tid = byCourse.get(String(c.course_id));
      c.kursansvarig_teacher_id = tid != null ? tid : null;
    });
  }

  /**
   * Synchronize courseKursansvarig junction table from course.kursansvarig_teacher_id
   */
  syncCourseKursansvarigFromCourses() {
    if (!Array.isArray(this.courses)) return;
    const next = [];
    const seen = new Set();
    this.courses.forEach((c) => {
      const tid = c?.kursansvarig_teacher_id;
      if (tid == null || tid === "") return;
      const key = String(c.course_id);
      if (seen.has(key)) return;
      next.push({ course_id: c.course_id, teacher_id: tid });
      seen.add(key);
    });
    this.courseKursansvarig = next;
  }

  getKursansvarigForCourse(courseId) {
    const course = this.getCourse(courseId);
    if (course && course.kursansvarig_teacher_id != null) {
      return course.kursansvarig_teacher_id;
    }
    const row = (this.courseKursansvarig || []).find(
      (ck) => String(ck.course_id) === String(courseId)
    );
    return row?.teacher_id ?? null;
  }

  setKursansvarig(courseId, teacherId) {
    const course = this.getCourse(courseId);
    if (!course) return null;

    const normalizedTeacherId =
      teacherId == null || teacherId === "" ? null : Number(teacherId);

    // Validation: teacher must be assigned to at least one run (if not null)
    if (normalizedTeacherId != null) {
      const runs = this.events.store?.courseRunsManager?.getCourseRuns?.() || [];
      const hasAssignment = runs.some(
        (r) => r.course_id === courseId && r.teachers?.includes(normalizedTeacherId)
      );
      if (!hasAssignment) {
        console.warn('Teacher must be assigned to course before becoming kursansvarig');
        return null;
      }
    }

    course.kursansvarig_teacher_id = normalizedTeacherId;

    // Update courseKursansvarig array
    this.courseKursansvarig = (this.courseKursansvarig || []).filter(
      (ck) => String(ck.course_id) !== String(courseId)
    );
    if (normalizedTeacherId != null && Number.isFinite(normalizedTeacherId)) {
      this.courseKursansvarig.push({
        course_id: course.course_id,
        teacher_id: normalizedTeacherId,
      });
    }

    this.events.notify();
    return normalizedTeacherId;
  }

  clearKursansvarig(courseId) {
    return this.setKursansvarig(courseId, null);
  }

  handleTeacherDeleted(teacherId) {
    // Clear examinator assignments for deleted teacher
    const tid = String(teacherId);
    let changed = false;
    (this.courses || []).forEach((c) => {
      if (String(c?.examinator_teacher_id) === tid) {
        c.examinator_teacher_id = null;
        changed = true;
      }
      // Clear kursansvarig assignments for deleted teacher
      if (String(c?.kursansvarig_teacher_id) === tid) {
        c.kursansvarig_teacher_id = null;
        changed = true;
      }
    });
    const next = (this.courseExaminators || []).filter(
      (ce) => String(ce.teacher_id) !== tid
    );
    if (next.length !== (this.courseExaminators || []).length) {
      this.courseExaminators = next;
      changed = true;
    }
    const nextKursansvarig = (this.courseKursansvarig || []).filter(
      (ck) => String(ck.teacher_id) !== tid
    );
    if (nextKursansvarig.length !== (this.courseKursansvarig || []).length) {
      this.courseKursansvarig = nextKursansvarig;
      changed = true;
    }
    if (changed) this.events.notify();
  }

  /**
   * Synchronize coursePrerequisites junction table from course.prerequisites arrays
   * Maintains consistency between embedded and normalized representations
   * Called automatically after each data change
   */
  syncCoursePrerequisitesFromCourses() {
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
}
