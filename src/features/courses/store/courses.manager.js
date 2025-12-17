// src/utils/store/courses.js
export class CoursesManager {
  constructor(events) {
    this.events = events;
    this.courses = [];
    this.coursePrerequisites = [];
  }

  load(courses, coursePrerequisites, normalizedCourses) {
    this.courses = normalizedCourses || courses || [];
    this.coursePrerequisites = coursePrerequisites || [];
  }

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
      this.events.notify();
      return this.courses[index];
    }
    return null;
  }

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
