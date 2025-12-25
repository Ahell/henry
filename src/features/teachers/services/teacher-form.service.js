import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { TeacherService } from "./teacher.service.js";

/**
 * Teacher Form Service
 * Handles form-specific operations for teacher forms
 */
export class TeacherFormService {
  /**
   * Resets the teacher form
   * @param {HTMLElement} root - The root element of the form
   */
  static resetForm(root) {
    // Note: Actual reset is handled by clearing custom inputs, but we might want
    // to add a dedicated reset helper here if needed later.
  }

  /**
   * Gets the initial state for adding a new teacher
   * @returns {Object} Initial form state
   */
  static getInitialStateForAdd() {
    return {
      selectedCompatibleCourseIds: [],
      selectedExaminatorCourseIds: [],
      formValid: false,
    };
  }

  /**
   * Gets the initial state for editing an existing teacher
   * @param {number} teacherId - The ID of the teacher to edit
   * @returns {Object} Initial form state for editing
   */
  static getInitialStateForEdit(teacherId) {
    const teacher = store.getTeacher(teacherId);
    if (!teacher) return this.getInitialStateForAdd();

    const selectedCompatibleCourseIds = Array.isArray(teacher.compatible_courses)
      ? teacher.compatible_courses.map(String)
      : [];

    const selectedExaminatorCourseIds = (
      store.getExaminatorCoursesForTeacher(teacherId) || []
    ).map((c) => String(c.course_id));

    return {
      selectedCompatibleCourseIds,
      selectedExaminatorCourseIds,
      formValid: false, // Will be re-evaluated
    };
  }

  /**
   * Validates the form data
   * @param {HTMLElement} root - The root element of the form
   * @param {string} mode - 'add' or 'edit'
   * @param {number} teacherId - Teacher ID for edit mode
   * @returns {boolean} Whether the form is valid
   */
  static isFormValid(root, mode, teacherId) {
    const baseValid = FormService.isFormValid(root);
    if (!baseValid) return false;

    const { name } = this._extractBasicFormData(root, mode);
    const excludeId = mode === "edit" ? teacherId : null;

    return TeacherService.isTeacherNameUnique(name, excludeId);
  }

  /**
   * Extracts form data from the form
   * @param {HTMLElement} root - The root element of the form
   * @param {string} mode - 'add' or 'edit'
   * @returns {Object} Extracted form data
   */
  static extractFormData(root, mode) {
    const prefix = this._getFieldPrefix(mode);
    const fieldIds = {
      name: `${prefix}Name`,
      home_department: { id: `${prefix}Department`, type: "radio" },
      compatible_courses: { id: `${prefix}Courses`, type: "select-multiple" },
      examinator_courses: {
        id: `${prefix}ExaminatorCourses`,
        type: "select-multiple",
      },
    };
    return FormService.extractFormData(root, fieldIds);
  }

  /**
   * Populates the form with teacher data
   * @param {HTMLElement} root - The root element
   * @param {Object} teacher - The teacher data
   * @param {string} mode - 'add' or 'edit'
   */
  static populateForm(root, teacher, mode) {
    const prefix = this._getFieldPrefix(mode);
    
    if (mode === 'add') {
      FormService.setCustomInput(root, `${prefix}Name`, '');
      // Clear radio/selects manually or rely on component state reset
    } else if (teacher) {
      FormService.setCustomInput(root, `${prefix}Name`, teacher.name);
      
      const radioGroup = root.querySelector(`#${prefix}Department`);
      if (radioGroup) {
        radioGroup.value = teacher.home_department;
      }

      const coursesSelect = root.querySelector(`#${prefix}Courses`);
      if (coursesSelect) {
        coursesSelect.value = (teacher.compatible_courses || []).map(String);
      }
      
      const examinatorSelect = root.querySelector(`#${prefix}ExaminatorCourses`);
      if (examinatorSelect) {
        const examinatorCourses = store.getExaminatorCoursesForTeacher(teacher.teacher_id) || [];
        examinatorSelect.value = examinatorCourses.map(c => String(c.course_id));
      }
    }
  }

  // Private helper methods

  /**
   * Gets the field prefix based on mode
   * @param {string} mode - 'add' or 'edit'
   * @returns {string} Field prefix
   * @private
   */
  static _getFieldPrefix(mode) {
    return mode === "edit" ? "editTeacher" : "teacher";
  }

  /**
   * Extracts basic form data (name)
   * @param {HTMLElement} root - The root element of the form
   * @param {string} mode - 'add' or 'edit'
   * @returns {Object} Basic form data
   * @private
   */
  static _extractBasicFormData(root, mode) {
    const prefix = this._getFieldPrefix(mode);
    return FormService.extractFormData(root, {
      name: `${prefix}Name`,
    });
  }
}