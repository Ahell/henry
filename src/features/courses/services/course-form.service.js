import { store } from "../../../platform/store/DataStore.js";
import {
  addCourseToTeachers,
  syncCourseToTeachers,
} from "../../admin/utils/admin-helpers.js";

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
    let newCourse = null;

    const mutationId = store.applyOptimistic({
      label: "add-course",
      rollback: () => {
        if (newCourse && newCourse.course_id) {
          store.deleteCourse(newCourse.course_id);
        }
      },
    });

    newCourse = store.addCourse(courseData);
    addCourseToTeachers(newCourse.course_id, selectedTeacherIds);

    return { course: newCourse, mutationId };
  }

  /**
   * Update an existing course
   * @param {number} courseId - Course ID
   * @param {Object} courseData - Updated course data
   * @param {Array} selectedTeacherIds - Teacher IDs
   */
  static updateCourse(courseId, courseData, selectedTeacherIds) {
    store.updateCourse(courseId, courseData);
    syncCourseToTeachers(courseId, selectedTeacherIds);
  }

  /**
   * Delete a course
   * @param {number} courseId - Course ID
   * @returns {Object} Mutation info
   */
  static deleteCourse(courseId) {
    const mutationId = store.applyOptimistic({
      label: "delete-course",
    });

    const removed = store.deleteCourse(courseId);

    return { removed, mutationId };
  }
}
