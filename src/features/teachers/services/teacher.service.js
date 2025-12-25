import { store } from "../../../platform/store/DataStore.js";
import { BaseFormService } from "../../../platform/services/base-form.service.js";

/**
 * Teacher Service
 * Complete teacher business logic and form processing
 */
export class TeacherService {
  static normalizeTeacherName(name) {
    return String(name ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  static isTeacherNameUnique(name, excludeTeacherId = null) {
    const normalized = this.normalizeTeacherName(name);
    if (!normalized) return true;

    return !(store.getTeachers() || []).some((t) => {
      if (
        excludeTeacherId != null &&
        String(t.teacher_id) === String(excludeTeacherId)
      ) {
        return false;
      }
      return this.normalizeTeacherName(t.name) === normalized;
    });
  }

  static assertTeacherNameUnique(name, excludeTeacherId = null) {
    if (!this.isTeacherNameUnique(name, excludeTeacherId)) {
      throw new Error("En lärare med samma namn finns redan.");
    }
  }

  /**
   * Create a new teacher with optimistic updates
   * @param {Object} teacherData - Teacher data
   * @param {Array|null} examinatorCourseIds - Course IDs the teacher should be examinator for
   * @returns {Object} Created teacher and mutation ID
   */
  static createTeacher(teacherData, examinatorCourseIds = null) {
    const nextName = String(teacherData?.name ?? "").trim();
    if (!nextName) throw new Error("Lärarens namn måste anges.");
    
    // Validate department
    const validDepartments = ["AIJ", "AIE", "AF"];
    if (
      !teacherData.home_department ||
      !validDepartments.includes(teacherData.home_department)
    ) {
      throw new Error("Avdelning måste väljas.");
    }

    this.assertTeacherNameUnique(nextName);

    const previousCourseExaminators = Array.isArray(
      store.coursesManager.courseExaminators
    )
      ? store.coursesManager.courseExaminators.map((x) => ({ ...x }))
      : [];

    let newTeacher = null;
    const mutationId = store.applyOptimistic({
      label: "add-teacher",
      rollback: () => {
        if (newTeacher?.teacher_id != null) {
          store.deleteTeacher(newTeacher.teacher_id);
        }
        store.coursesManager.courseExaminators = previousCourseExaminators;
        store.coursesManager.ensureExaminatorsFromNormalized();
      },
    });

    newTeacher = store.addTeacher(teacherData);

    if (Array.isArray(examinatorCourseIds)) {
      const nextIds = Array.from(new Set(examinatorCourseIds.map(String))).filter(
        Boolean
      );
      nextIds.forEach((courseId) => {
        const numericCourseId = Number(courseId);
        if (!Number.isFinite(numericCourseId)) return;
        store.setCourseExaminator(numericCourseId, newTeacher.teacher_id);
      });
    }

    return { teacher: newTeacher, mutationId };
  }

  /**
   * Update an existing teacher
   * @param {number} teacherId - Teacher ID
   * @param {Object} teacherData - Updated teacher data
   * @param {Array|null} examinatorCourseIds - Course IDs the teacher should be examinator for
   * @returns {Object} Updated teacher and mutation ID
   */
  static updateTeacher(teacherId, teacherData, examinatorCourseIds = null) {
    const existing = store.getTeacher(teacherId);
    if (!existing) {
      throw new Error(`Teacher ${teacherId} not found`);
    }

    const nextName = String(teacherData?.name ?? existing?.name ?? "").trim();
    if (!nextName) throw new Error("Lärarens namn måste anges.");
    this.assertTeacherNameUnique(nextName, teacherId);

    const previousTeacher = {
      ...existing,
      ...(existing.compatible_courses && {
        compatible_courses: [...existing.compatible_courses],
      }),
    };
    const previousCourseExaminators = Array.isArray(
      store.coursesManager.courseExaminators
    )
      ? store.coursesManager.courseExaminators.map((x) => ({ ...x }))
      : [];

    const mutationId = store.applyOptimistic({
      label: "update-teacher",
      rollback: () => {
        store.updateTeacher(teacherId, previousTeacher);
        store.coursesManager.courseExaminators = previousCourseExaminators;
        store.coursesManager.ensureExaminatorsFromNormalized();
      },
    });

    store.updateTeacher(teacherId, teacherData);

    if (Array.isArray(examinatorCourseIds)) {
      const nextIds = new Set(examinatorCourseIds.map(String));
      const current = new Set(
        (store.getExaminatorCoursesForTeacher(teacherId) || []).map((c) =>
          String(c.course_id)
        )
      );

      // Assign selected courses to this teacher
      nextIds.forEach((courseId) => {
        if (!courseId) return;
        const numericCourseId = Number(courseId);
        if (!Number.isFinite(numericCourseId)) return;
        store.setCourseExaminator(numericCourseId, teacherId);
      });

      // Unassign courses that were previously assigned to this teacher
      current.forEach((courseId) => {
        if (!nextIds.has(courseId)) {
          const numericCourseId = Number(courseId);
          if (!Number.isFinite(numericCourseId)) return;
          store.clearCourseExaminator(numericCourseId);
        }
      });
    }

    return { teacher: store.getTeacher(teacherId), mutationId };
  }

  /**
   * Delete a teacher
   * @param {number} teacherId - Teacher ID
   * @returns {Object} Mutation info
   */
  static deleteTeacher(teacherId) {
    return BaseFormService.delete("delete-teacher", teacherId, {
      delete: (id) => store.deleteTeacher(id),
    });
  }

  /**
   * Save a new teacher
   * @param {Object} formData - Form data
   * @returns {Object} Created teacher
   */
  static async saveNewTeacher(formData) {
    const { examinator_courses, ...teacherData } = formData || {};
    const { teacher, mutationId } = this.createTeacher(
      teacherData,
      examinator_courses
    );

    await store.saveData({ mutationId });
    return teacher;
  }

  /**
   * Save an updated teacher
   * @param {number} teacherId - Teacher ID
   * @param {Object} formData - Updated form data
   * @returns {Object} Updated teacher
   */
  static async saveUpdatedTeacher(teacherId, formData) {
    const { examinator_courses, ...teacherData } = formData || {};
    const { teacher, mutationId } = this.updateTeacher(
      teacherId,
      teacherData,
      examinator_courses
    );

    await store.saveData({ mutationId });
    return teacher;
  }

  /**
   * Delete teacher by ID
   * @param {number} teacherId - Teacher ID
   * @returns {boolean} Success status
   */
  static async deleteTeacherById(teacherId) {
    const { removed, mutationId } = this.deleteTeacher(teacherId);
    if (!removed) return false;
    await store.saveData({ mutationId });
    return true;
  }

  /**
   * Get all teachers
   * @returns {Array} Array of teacher objects
   */
  static getTeachers() {
    return store.getTeachers();
  }
}
