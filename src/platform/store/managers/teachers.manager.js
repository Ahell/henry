// src/utils/store/teachers.js
export class TeachersManager {
  constructor(events, coursesManager) {
    this.events = events;
    this.coursesManager = coursesManager;
    this.teachers = [];
    this.teacherCourses = [];
  }

  load(teachers, teacherCourses) {
    this.teachers = teachers || [];
    this.teacherCourses = teacherCourses || [];
  }

  addTeacher(teacher) {
    const id = Math.max(...this.teachers.map((t) => t.teacher_id), 0) + 1;
    const newTeacher = {
      teacher_id: id,
      name: teacher.name || "",
      home_department: teacher.home_department || "",
      compatible_courses: teacher.compatible_courses || [],
    };
    this.teachers.push(newTeacher);
    this.events.notify();
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
      this.events.notify();
      return this.teachers[index];
    }
    return null;
  }

  deleteTeacher(teacherId) {
    const index = this.teachers.findIndex(
      (t) => String(t.teacher_id) === String(teacherId)
    );
    if (index !== -1) {
      this.teachers.splice(index, 1);
      this.teacherCourses = (this.teacherCourses || []).filter(
        (tc) => String(tc.teacher_id) !== String(teacherId)
      );
      this.events.notify("teacher-deleted", teacherId); // Notify about the specific deletion
      return true;
    }
    return false;
  }

  /**
   * Randomly assigns a set of compatible courses to each teacher.
   * Shuffles the course list once for efficiency.
   * @param {number} minCourses - Minimum number of courses to assign.
   * @param {number} maxCourses - Maximum number of courses to assign.
   */
  randomizeTeacherCourses(minCourses = 2, maxCourses = 5) {
    if (!this.teachers || this.teachers.length === 0) return;

    const allCourseIds = this.coursesManager
      .getCourses()
      .map((c) => c.course_id);
    // Fisher-Yates (aka Knuth) Shuffle for an unbiased shuffle
    for (let i = allCourseIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCourseIds[i], allCourseIds[j]] = [allCourseIds[j], allCourseIds[i]];
    }

    this.teachers.forEach((teacher) => {
      const numCourses =
        Math.floor(Math.random() * (maxCourses - minCourses + 1)) + minCourses;
      // To ensure each teacher gets a different random set, we could re-shuffle or slice from a random start.
      // For simplicity here, we'll just take a slice, but for true randomness per teacher, another shuffle inside the loop would be needed.
      // Or, more efficiently, shuffle once and give different slices.
      const start = Math.floor(
        Math.random() * (allCourseIds.length - numCourses + 1)
      );
      teacher.compatible_courses = allCourseIds.slice(
        start,
        start + numCourses
      );
    });

    this.syncTeacherCoursesFromTeachers();
    this.events.notify();
  }

  getCompatibleCourseIds(teacherId) {
    if (this.teacherCourses && this.teacherCourses.length > 0) {
      return this.teacherCourses
        .filter((tc) => String(tc.teacher_id) === String(teacherId))
        .map((tc) => tc.course_id);
    }
    const teacher = this.getTeacher(teacherId);
    return teacher?.compatible_courses || [];
  }

  ensureTeacherCoursesFromCompatible() {
    if (!Array.isArray(this.teacherCourses)) {
      this.teacherCourses = [];
    }
    const existingKeys = new Set(
      this.teacherCourses.map((tc) => `${tc.teacher_id}-${tc.course_id}`)
    );
    for (const t of this.teachers || []) {
      const compat = Array.isArray(t.compatible_courses)
        ? t.compatible_courses
        : [];
      compat.forEach((cid) => {
        const key = `${t.teacher_id}-${cid}`;
        if (!existingKeys.has(key)) {
          this.teacherCourses.push({
            teacher_id: t.teacher_id,
            course_id: cid,
          });
          existingKeys.add(key);
        }
      });
    }
  }

  ensureTeacherCompatibleFromCourses() {
    if (!Array.isArray(this.teachers)) return;
    const byTeacher = new Map();
    for (const tc of this.teacherCourses || []) {
      const list = byTeacher.get(tc.teacher_id) || [];
      list.push(tc.course_id);
      byTeacher.set(tc.teacher_id, list);
    }
    this.teachers.forEach((t) => {
      if (byTeacher.has(t.teacher_id)) {
        t.compatible_courses = byTeacher.get(t.teacher_id);
      }
    });
  }

  /**
   * Re-synchronizes the `teacherCourses` list based on the `compatible_courses`
   * array within each teacher object. This ensures the two are in sync.
   */
  syncTeacherCoursesFromTeachers() {
    if (!Array.isArray(this.teachers)) {
      this.teacherCourses = [];
      return;
    }
    this.teacherCourses = this.teachers.flatMap((teacher) =>
      (teacher.compatible_courses || []).map((courseId) => ({
        teacher_id: teacher.teacher_id,
        course_id: courseId,
      }))
    );
  }

  syncTeachersFromTeacherCourses() {
    if (!Array.isArray(this.teachers)) return;
    const byTeacher = new Map();
    for (const tc of this.teacherCourses || []) {
      const list = byTeacher.get(tc.teacher_id) || [];
      list.push(tc.course_id);
      byTeacher.set(tc.teacher_id, list);
    }
    this.teachers.forEach((t) => {
      if (byTeacher.has(t.teacher_id)) {
        t.compatible_courses = byTeacher.get(t.teacher_id);
      }
    });
  }

  handleCourseDeleted(courseId) {
    // Remove mappings from teacher.compatible_courses
    (this.teachers || []).forEach((t) => {
      if (Array.isArray(t.compatible_courses) && t.compatible_courses.length) {
        t.compatible_courses = t.compatible_courses.filter(
          (cid) => String(cid) !== String(courseId)
        );
      }
    });
    // Resync the teacherCourses array
    this.syncTeacherCoursesFromTeachers();
  }

  /**
   * Add a course to the compatible course list for the selected teachers.
   * Used when creating a course and selecting compatible teachers.
   */
  addCourseToTeachers(courseId, selectedTeacherIds = []) {
    const cid = Number(courseId);
    if (!Number.isFinite(cid)) return;

    const teacherIds = new Set(
      (selectedTeacherIds || [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
    );
    if (teacherIds.size === 0) return;

    let changed = false;
    for (const teacherId of teacherIds) {
      const teacher = this.getTeacher(teacherId);
      if (!teacher) continue;

      const current = Array.isArray(teacher.compatible_courses)
        ? teacher.compatible_courses
            .map((x) => Number(x))
            .filter((x) => Number.isFinite(x))
        : [];

      if (!current.includes(cid)) {
        teacher.compatible_courses = [...current, cid];
        changed = true;
      }
    }

    if (changed) {
      this.syncTeacherCoursesFromTeachers();
      this.events.notify();
    }
  }

  /**
   * Synchronize teacher-course relationships for a given course.
   * Adds/removes the course from teachers based on selection.
   */
  syncCourseToTeachers(courseId, selectedTeacherIds = []) {
    const cid = Number(courseId);
    if (!Number.isFinite(cid)) return;

    const teacherIds = new Set(
      (selectedTeacherIds || [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
    );

    let changed = false;
    for (const teacher of this.teachers || []) {
      const tid = Number(teacher.teacher_id);
      const shouldInclude = teacherIds.has(tid);

      const current = Array.isArray(teacher.compatible_courses)
        ? teacher.compatible_courses
            .map((x) => Number(x))
            .filter((x) => Number.isFinite(x))
        : [];

      const currentlyIncluded = current.includes(cid);

      if (shouldInclude && !currentlyIncluded) {
        teacher.compatible_courses = [...current, cid];
        changed = true;
      } else if (!shouldInclude && currentlyIncluded) {
        teacher.compatible_courses = current.filter((x) => x !== cid);
        changed = true;
      }
    }

    if (changed) {
      this.syncTeacherCoursesFromTeachers();
      this.events.notify();
    }
  }
}
