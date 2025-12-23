import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { CourseService } from "./course.service.js";

/**
 * Course Form Service
 * Handles form-specific operations for course forms
 */
export class CourseFormService {
  /**
   * Resets the course form
   * @param {HTMLElement} root - The root element of the form
   */
  static resetForm(root) {
    CourseService.resetCourseForm(root);
  }

  /**
   * Gets the initial state for adding a new course
   * @returns {Object} Initial form state
   */
  static getInitialStateForAdd() {
    return {
      selectedPrerequisiteIds: [],
      selectedCompatibleTeacherIds: [],
      selectedExaminatorTeacherId: "",
      formValid: false,
    };
  }

  /**
   * Gets the initial state for editing an existing course
   * @param {string|number} courseId - The ID of the course to edit
   * @returns {Object} Initial form state for editing
   */
  static getInitialStateForEdit(courseId) {
    const course = store.getCourse(courseId);
    if (!course) return this.getInitialStateForAdd();

    const selectedPrerequisiteIds = this._getSelectedPrerequisiteIds(course);
    const selectedCompatibleTeacherIds = this._getSelectedCompatibleTeacherIds(course);
    const selectedExaminatorTeacherId = this._getSelectedExaminatorTeacherId(course);

    // Ensure examinator is included in compatible teachers if not already present
    const compatibleTeacherIds = this._ensureExaminatorInCompatibleTeachers(
      selectedCompatibleTeacherIds,
      selectedExaminatorTeacherId
    );

    return {
      selectedPrerequisiteIds,
      selectedCompatibleTeacherIds: compatibleTeacherIds,
      selectedExaminatorTeacherId,
      formValid: false,
    };
  }

  /**
   * Handles changes to prerequisite selections
   * @param {Array} values - Selected prerequisite IDs
   * @returns {Object} Updated state
   */
  static handlePrerequisiteChange(values) {
    return {
      selectedPrerequisiteIds: values.map(String),
    };
  }

  /**
   * Handles changes to compatible teachers selections
   * @param {Array} values - Selected teacher IDs
   * @param {string} currentExaminatorId - Current examinator teacher ID
   * @returns {Object} Updated state
   */
  static handleCompatibleTeachersChange(values, currentExaminatorId) {
    const selectedCompatibleTeacherIds = values.map(String);
    const selectedExaminatorTeacherId = selectedCompatibleTeacherIds.includes(currentExaminatorId)
      ? currentExaminatorId
      : "";

    return {
      selectedCompatibleTeacherIds,
      selectedExaminatorTeacherId,
    };
  }

  /**
   * Handles changes to examinator selection
   * @param {string|number} value - Selected examinator teacher ID
   * @returns {Object} Updated state
   */
  static handleExaminatorChange(value) {
    return {
      selectedExaminatorTeacherId: String(value ?? ""),
    };
  }

  /**
   * Validates the form data
   * @param {HTMLElement} root - The root element of the form
   * @param {string} mode - 'add' or 'edit'
   * @param {string|number} courseId - Course ID for edit mode
   * @returns {boolean} Whether the form is valid
   */
  static isFormValid(root, mode, courseId) {
    const baseValid = FormService.isFormValid(root);
    if (!baseValid) return false;

    const { code, name } = this._extractBasicFormData(root, mode);
    const excludeId = mode === "edit" ? courseId : null;

    return (
      CourseService.isCourseCodeUnique(code, excludeId) &&
      CourseService.isCourseNameUnique(name, excludeId)
    );
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
      code: `${prefix}code`,
      name: `${prefix}name`,
      credits: { id: `${prefix}credits`, transform: (value) => Number(value) },
      prerequisites: { id: `${prefix}prerequisites`, type: "select-multiple" },
      selectedTeacherIds: { id: `${prefix}Teachers`, type: "select-multiple" },
    };
    return FormService.extractFormData(root, fieldIds);
  }

  // Private helper methods

  /**
   * Gets the field prefix based on mode
   * @param {string} mode - 'add' or 'edit'
   * @returns {string} Field prefix
   * @private
   */
  static _getFieldPrefix(mode) {
    return mode === "edit" ? "edit-" : "course";
  }

  /**
   * Extracts basic form data (code and name)
   * @param {HTMLElement} root - The root element of the form
   * @param {string} mode - 'add' or 'edit'
   * @returns {Object} Basic form data
   * @private
   */
  static _extractBasicFormData(root, mode) {
    const prefix = this._getFieldPrefix(mode);
    return FormService.extractFormData(root, {
      code: `${prefix}code`,
      name: `${prefix}name`,
    });
  }

  /**
   * Gets selected prerequisite IDs from course data
   * @param {Object} course - Course object
   * @returns {Array<string>} Selected prerequisite IDs
   * @private
   */
  static _getSelectedPrerequisiteIds(course) {
    return Array.isArray(course.prerequisites)
      ? course.prerequisites.map(String)
      : [];
  }

  /**
   * Gets selected compatible teacher IDs for a course
   * @param {Object} course - Course object
   * @returns {Array<string>} Selected compatible teacher IDs
   * @private
   */
  static _getSelectedCompatibleTeacherIds(course) {
    return (store.getTeachers() || [])
      .filter((teacher) => teacher.compatible_courses?.includes(course.course_id))
      .map((teacher) => String(teacher.teacher_id));
  }

  /**
   * Gets the selected examinator teacher ID for a course
   * @param {Object} course - Course object
   * @returns {string} Selected examinator teacher ID
   * @private
   */
  static _getSelectedExaminatorTeacherId(course) {
    return String(
      store.getCourseExaminatorTeacherId(course.course_id) ??
        course.examinator_teacher_id ??
        ""
    );
  }

  /**
   * Ensures the examinator is included in the compatible teachers list
   * @param {Array<string>} compatibleTeacherIds - Current compatible teacher IDs
   * @param {string} examinatorId - Examinator teacher ID
   * @returns {Array<string>} Updated compatible teacher IDs
   * @private
   */
  static _ensureExaminatorInCompatibleTeachers(compatibleTeacherIds, examinatorId) {
    if (examinatorId && !compatibleTeacherIds.includes(examinatorId)) {
      return [...compatibleTeacherIds, examinatorId];
    }
    return compatibleTeacherIds;
  }
}
