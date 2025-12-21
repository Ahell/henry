import { store } from "../../../platform/store/DataStore.js";
import { BaseFormService } from "../../../platform/services/base-form.service.js";

/**
 * Course Form Service
 * Handles course creation and update logic
 */
export class CourseFormService {
  static normalizeCourseCode(code) {
    return String(code ?? "").trim().toUpperCase();
  }

  static normalizeCourseName(name) {
    return String(name ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  }

  static isCourseCodeUnique(code, excludeCourseId = null) {
    const normalized = this.normalizeCourseCode(code);
    if (!normalized) return true;

    return !(store.getCourses() || []).some((c) => {
      if (excludeCourseId != null && String(c.course_id) === String(excludeCourseId)) {
        return false;
      }
      return this.normalizeCourseCode(c.code) === normalized;
    });
  }

  static isCourseNameUnique(name, excludeCourseId = null) {
    const normalized = this.normalizeCourseName(name);
    if (!normalized) return true;

    return !(store.getCourses() || []).some((c) => {
      if (excludeCourseId != null && String(c.course_id) === String(excludeCourseId)) {
        return false;
      }
      return this.normalizeCourseName(c.name) === normalized;
    });
  }

  static assertCourseUnique({ code, name }, excludeCourseId = null) {
    if (!this.isCourseCodeUnique(code, excludeCourseId)) {
      throw new Error("En kurs med samma kurskod finns redan.");
    }
    if (!this.isCourseNameUnique(name, excludeCourseId)) {
      throw new Error("En kurs med samma kursnamn finns redan.");
    }
  }

  static assertExaminatorIsCompatible(examinatorTeacherId, selectedTeacherIds) {
    if (examinatorTeacherId == null || examinatorTeacherId === "") return;
    const selected = new Set(
      (Array.isArray(selectedTeacherIds) ? selectedTeacherIds : []).map(String)
    );
    if (!selected.has(String(examinatorTeacherId))) {
      throw new Error("Examinator måste vara en av de kompatibla lärarna.");
    }
  }

  /**
   * Create a new course with optimistic updates
   * @param {Object} courseData - Course data
   * @param {number|null} examinatorTeacherId - Teacher ID for examinator
   * @param {Array} selectedTeacherIds - Teacher IDs
   * @returns {Object} Created course
   */
  static createCourse(courseData, examinatorTeacherId, selectedTeacherIds) {
    const nextCode = String(courseData?.code ?? "").trim();
    const nextName = String(courseData?.name ?? "").trim();
    if (!nextCode) throw new Error("Kurskod måste anges.");
    if (!nextName) throw new Error("Kursnamn måste anges.");
    this.assertCourseUnique({ code: nextCode, name: nextName });
    this.assertExaminatorIsCompatible(examinatorTeacherId, selectedTeacherIds);

    const result = BaseFormService.create("add-course", courseData, {
      add: (data) => store.addCourse(data),
      delete: (id) => store.deleteCourse(id),
      getIdField: "course_id",
    });

    if (examinatorTeacherId != null && examinatorTeacherId !== "") {
      store.setCourseExaminator(result.entity.course_id, examinatorTeacherId);
    } else {
      store.clearCourseExaminator(result.entity.course_id);
    }
    store.addCourseToTeachers(result.entity.course_id, selectedTeacherIds);

    return { course: result.entity, mutationId: result.mutationId };
  }

  /**
   * Update an existing course
   * @param {number} courseId - Course ID
   * @param {Object} courseData - Updated course data
   * @param {number|null} examinatorTeacherId - Teacher ID for examinator
   * @param {Array} selectedTeacherIds - Teacher IDs
   * @returns {Object} Updated course and mutation ID
   */
  static updateCourse(courseId, courseData, examinatorTeacherId, selectedTeacherIds) {
    const existing = store.getCourse(courseId);
    if (!existing) {
      throw new Error(`Course ${courseId} not found`);
    }

    const nextCode = String(courseData?.code ?? existing?.code ?? "").trim();
    const nextName = String(courseData?.name ?? existing?.name ?? "").trim();
    if (!nextCode) throw new Error("Kurskod måste anges.");
    if (!nextName) throw new Error("Kursnamn måste anges.");
    this.assertCourseUnique({ code: nextCode, name: nextName }, courseId);
    this.assertExaminatorIsCompatible(examinatorTeacherId, selectedTeacherIds);

    const previousCourse = {
      ...existing,
      prerequisites: Array.isArray(existing.prerequisites)
        ? [...existing.prerequisites]
        : [],
    };
    const previousTeacherCompat = (store.getTeachers() || []).map((t) => ({
      teacher_id: t.teacher_id,
      compatible_courses: Array.isArray(t.compatible_courses)
        ? [...t.compatible_courses]
        : [],
    }));
    const previousCourseExaminators = Array.isArray(
      store.coursesManager.courseExaminators
    )
      ? store.coursesManager.courseExaminators.map((x) => ({ ...x }))
      : [];

    const mutationId = store.applyOptimistic({
      label: "update-course",
      rollback: () => {
        store.updateCourse(courseId, previousCourse);
        previousTeacherCompat.forEach((prev) => {
          store.updateTeacher(prev.teacher_id, {
            compatible_courses: [...prev.compatible_courses],
          });
        });
        store.teachersManager.syncTeacherCoursesFromTeachers();
        store.coursesManager.courseExaminators = previousCourseExaminators;
        store.coursesManager.ensureExaminatorsFromNormalized();
      },
    });

    store.updateCourse(courseId, courseData);
    if (examinatorTeacherId != null && examinatorTeacherId !== "") {
      store.setCourseExaminator(courseId, examinatorTeacherId);
    } else {
      store.clearCourseExaminator(courseId);
    }
    store.syncCourseToTeachers(courseId, selectedTeacherIds);

    return { course: store.getCourse(courseId), mutationId };
  }

  /**
   * Delete a course
   * @param {number} courseId - Course ID
   * @returns {Object} Mutation info
   */
  static deleteCourse(courseId) {
    return BaseFormService.delete("delete-course", courseId, {
      delete: (id) => store.deleteCourse(id),
    });
  }
}
