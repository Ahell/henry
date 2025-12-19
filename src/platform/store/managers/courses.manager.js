/**
 * Courses Manager
 * Manages course entities and their prerequisites
 */
export class CoursesManager {
  constructor(events) {
    this.events = events;
    this.courses = [];
    this.coursePrerequisites = [];
  }

  /**
   * Load courses and prerequisites from backend data
   * @param {Array} courses - Course entities
   * @param {Array} coursePrerequisites - Course prerequisite junction table
   * @param {Array} normalizedCourses - Pre-normalized courses with prerequisites embedded
   */
  load(courses, coursePrerequisites, normalizedCourses) {
    this.courses = normalizedCourses || courses || [];
    this.coursePrerequisites = coursePrerequisites || [];
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
