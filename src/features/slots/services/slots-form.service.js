import { FormService } from "../../../platform/services/form.service.js";
import { SlotService } from "./slot.service.js";

/**
 * Slots Form Service
 * Handles form-specific operations for slot forms
 */
export class SlotsFormService {
  /**
   * Resets the slot form
   * @param {HTMLElement} root - The root element of the form
   */
  static resetForm(root) {
    FormService.clearCustomForm(root, ["insertAfter", "slotStart"]);
  }

  /**
   * Validates the form data
   * @param {HTMLElement} root - The root element of the form
   * @returns {boolean} Whether the form is valid
   */
  static isFormValid(root) {
    return FormService.isFormValid(root);
  }

  /**
   * Extracts form data from the form
   * @param {HTMLElement} root - The root element of the form
   * @returns {Object} Extracted form data
   */
  static extractFormData(root) {
    const startSelect = root.querySelector("#slotStart");
    const start_date = startSelect ? startSelect.getSelect().value : null;
    
    return {
      start_date
    };
  }

  /**
   * Get initial state for Add modal
   */
  static getInitialStateForAdd() {
    return {
      selectedInsertAfter: null,
      startOptions: [],
      formValid: false,
    };
  }
}