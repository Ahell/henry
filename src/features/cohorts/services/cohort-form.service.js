import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { CohortService } from "./cohort.service.js";

const DEFAULT_SIZE = 30;

/**
 * Cohort Form Service
 * Handles form-specific operations for cohort forms
 */
export class CohortFormService {
  /**
   * Resets the cohort form
   * @param {HTMLElement} root - The root element of the form
   */
  static resetForm(root) {
    // Clear custom form fields using the IDs we expect
    // Note: The actual IDs depend on the mode (add/edit), but we can try to clear both or handle it generically
    // Here we assume the caller might want to reset generic fields if they exist
    // However, in our component implementation, we'll likely use specific IDs based on mode
    
    // For now, let's look at how CourseService does it - it clears specific named fields
    // We will adapt this to our needs in the component
  }

  /**
   * Gets the initial state for adding a new cohort
   * @returns {Object} Initial form state
   */
  static getInitialStateForAdd() {
    return {
      formValid: false,
    };
  }

  /**
   * Gets the initial state for editing an existing cohort
   * @param {number} cohortId - The ID of the cohort to edit
   * @returns {Object} Initial form state for editing
   */
  static getInitialStateForEdit(cohortId) {
    const cohort = store.getCohort(cohortId);
    if (!cohort) return this.getInitialStateForAdd();

    return {
      formValid: false, // Will be re-evaluated when form is populated
    };
  }

  /**
   * Validates the form data
   * @param {HTMLElement} root - The root element of the form
   * @param {string} mode - 'add' or 'edit'
   * @param {number} cohortId - Cohort ID for edit mode
   * @returns {boolean} Whether the form is valid
   */
  static isFormValid(root, mode, cohortId) {
    const baseValid = FormService.isFormValid(root);
    if (!baseValid) return false;

    const { start_date } = this.extractFormData(root, mode);
    const excludeId = mode === "edit" ? cohortId : null;

    // Check business logic validation (unique start date)
    return CohortService.isCohortStartDateUnique(start_date, excludeId);
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
      start_date: `${prefix}StartDate`,
      planned_size: {
        id: `${prefix}Size`,
        transform: (value) => Number(value),
      },
    };
    return FormService.extractFormData(root, fieldIds);
  }

  /**
   * Populates the form with cohort data
   * @param {HTMLElement} root - The root element
   * @param {Object} cohort - The cohort data
   * @param {string} mode - 'add' or 'edit'
   */
  static populateForm(root, cohort, mode) {
    const prefix = this._getFieldPrefix(mode);
    
    if (mode === 'add') {
      FormService.setCustomInput(root, `${prefix}Size`, DEFAULT_SIZE);
      FormService.setCustomInput(root, `${prefix}StartDate`, '');
    } else if (cohort) {
      FormService.setCustomInput(root, `${prefix}StartDate`, cohort.start_date);
      FormService.setCustomInput(root, `${prefix}Size`, cohort.planned_size);
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
    return mode === "edit" ? "editCohort" : "cohort";
  }
}