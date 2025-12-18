import { store } from "../../../platform/store/DataStore.js";

/**
 * Teacher Form Service
 * Handles teacher creation and update logic
 */
export class TeacherFormService {
  /**
   * Create a new teacher with optimistic updates
   * @param {Object} teacherData - Teacher data
   * @returns {Object} Created teacher and mutation ID
   */
  static createTeacher(teacherData) {
    let newTeacher = null;

    const mutationId = store.applyOptimistic({
      label: "add-teacher",
      rollback: () => {
        if (newTeacher && newTeacher.teacher_id) {
          store.deleteTeacher(newTeacher.teacher_id);
        }
      },
    });

    newTeacher = store.addTeacher(teacherData);

    return { teacher: newTeacher, mutationId };
  }

  /**
   * Update an existing teacher
   * @param {number} teacherId - Teacher ID
   * @param {Object} teacherData - Updated teacher data
   * @returns {Object} Updated teacher and mutation ID
   */
  static updateTeacher(teacherId, teacherData) {
    const existing = store.getTeacher(teacherId);
    if (!existing) {
      throw new Error(`Teacher ${teacherId} not found`);
    }

    const previous = {
      ...existing,
      compatible_courses: Array.isArray(existing.compatible_courses)
        ? [...existing.compatible_courses]
        : [],
    };

    const mutationId = store.applyOptimistic({
      label: "update-teacher",
      rollback: () => {
        store.updateTeacher(teacherId, previous);
      },
    });

    const updated = store.updateTeacher(teacherId, teacherData);
    return { teacher: updated, mutationId };
  }

  /**
   * Delete a teacher
   * @param {number} teacherId - Teacher ID
   * @returns {Object} Mutation info
   */
  static deleteTeacher(teacherId) {
    const mutationId = store.applyOptimistic({
      label: "delete-teacher",
    });

    const removed = store.deleteTeacher(teacherId);

    return { removed, mutationId };
  }
}
