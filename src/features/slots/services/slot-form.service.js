import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";

/**
 * Slot Form Service
 * Handles form-specific operations for slot forms
 */
export class SlotFormService {
  /**
   * Resets the slot form
   * @param {HTMLElement} root - The root element of the form
   */
  static resetForm(root) {
    // Clear custom form fields
    // In add mode we might clear specific fields
  }

  /**
   * Gets the initial state for adding a new slot
   * @returns {Object} Initial form state
   */
  static getInitialStateForAdd() {
    return {
      selectedInsertAfter: null,
      startOptions: [],
      formValid: false,
    };
  }

  /**
   * Gets the initial state for editing an existing slot
   * @param {number} slotId - The ID of the slot to edit
   * @returns {Object} Initial form state for editing
   */
  static getInitialStateForEdit(slotId) {
    const slot = store.getSlot(slotId);
    if (!slot) return this.getInitialStateForAdd();

    return {
      selectedInsertAfter: null, // Edit mode might not use insertAfter logic same way
      startOptions: [], 
      formValid: true, // Assuming existing data is valid
    };
  }

  /**
   * Validates the form data
   * @param {HTMLElement} root - The root element of the form
   * @param {string} mode - 'add' or 'edit'
   * @param {number} slotId - Slot ID for edit mode
   * @returns {boolean} Whether the form is valid
   */
  static isFormValid(root, mode, slotId) {
    // Basic validation
    return FormService.isFormValid(root);
  }

  /**
   * Extracts form data from the form
   * @param {HTMLElement} root - The root element of the form
   * @param {string} mode - 'add' or 'edit'
   * @returns {Object} Extracted form data
   */
  static extractFormData(root, mode) {
    const startSelect = root.querySelector("#slotStart");
    const start_date = startSelect ? startSelect.getSelect().value : null;
    
    return {
      start_date
    };
  }

  /**
   * Populates the form with slot data
   * @param {HTMLElement} root - The root element
   * @param {Object} slot - The slot data
   * @param {string} mode - 'add' or 'edit'
   */
  static populateForm(root, slot, mode) {
    if (mode === 'add') {
      FormService.setCustomInput(root, 'slotStart', '');
      FormService.setCustomInput(root, 'insertAfter', '');
    } else if (slot) {
      // In edit mode we might just show the date, but for now we don't have edit fields defined in the modal
      // This is a placeholder for future edit capability
    }
  }
}
