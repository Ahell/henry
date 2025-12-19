import { store } from "../../../platform/store/DataStore.js";
import { BaseFormService } from "../../../platform/services/base-form.service.js";

/**
 * Course Form Service
 * Handles course creation and update logic
 */
export class CourseFormService {
  /**
   * Create a new course with optimistic updates
   * @param {Object} courseData - Course data
   * @param {Array} selectedTeacherIds - Teacher IDs
   * @returns {Object} Created course
   */
  static createCourse(courseData, selectedTeacherIds) {
    const result = BaseFormService.create("add-course", courseData, {
      add: (data) => store.addCourse(data),
      delete: (id) => store.deleteCourse(id),
      getIdField: "course_id",
    });

    store.addCourseToTeachers(result.entity.course_id, selectedTeacherIds);

    return { course: result.entity, mutationId: result.mutationId };
  }

  /**
   * Update an existing course
   * @param {number} courseId - Course ID
   * @param {Object} courseData - Updated course data
   * @param {Array} selectedTeacherIds - Teacher IDs
   * @returns {Object} Updated course and mutation ID
   */
  static updateCourse(courseId, courseData, selectedTeacherIds) {
    const existing = store.getCourse(courseId);
    if (!existing) {
      throw new Error(`Course ${courseId} not found`);
    }

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
      },
    });

    store.updateCourse(courseId, courseData);
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
