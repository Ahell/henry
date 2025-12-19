import { store } from "../../../platform/store/DataStore.js";
import { BaseFormService } from "../../../platform/services/base-form.service.js";

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
    const result = BaseFormService.create("add-teacher", teacherData, {
      add: (data) => store.addTeacher(data),
      delete: (id) => store.deleteTeacher(id),
      getIdField: "teacher_id",
    });

    return { teacher: result.entity, mutationId: result.mutationId };
  }

  /**
   * Update an existing teacher
   * @param {number} teacherId - Teacher ID
   * @param {Object} teacherData - Updated teacher data
   * @returns {Object} Updated teacher and mutation ID
   */
  static updateTeacher(teacherId, teacherData) {
    const result = BaseFormService.update("update-teacher", teacherId, teacherData, {
      get: (id) => store.getTeacher(id),
      update: (id, data) => store.updateTeacher(id, data),
    });

    return { teacher: result.entity, mutationId: result.mutationId };
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
}
