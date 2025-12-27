import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import {
  DEFAULT_SLOT_LENGTH_DAYS,
  getSlotRange,
  normalizeDateOnly,
} from "../../../utils/date-utils.js";

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
      formValid: false,
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
    const baseValid = FormService.isFormValid(root);
    if (!baseValid) return false;

    if (mode === "edit") {
      if (!slotId) return false;
      const { start_date } = this.extractFormData(root, mode);
      const normalizedStart = normalizeDateOnly(start_date);
      if (!normalizedStart) return false;

      const slot = store.getSlot(slotId);
      if (!slot) return false;

      const currentRange = getSlotRange(slot);
      const lengthDays = currentRange
        ? Math.max(
            1,
            Math.round(
              (currentRange.end.getTime() - currentRange.start.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1
          )
        : DEFAULT_SLOT_LENGTH_DAYS;
      const endDate = new Date(normalizedStart);
      endDate.setDate(endDate.getDate() + lengthDays - 1);
      const normalizedEnd = normalizeDateOnly(endDate);
      if (!normalizedEnd) return false;
      if (new Date(normalizedEnd) <= new Date(normalizedStart)) return false;

      const overlapping = store.slotsManager.findOverlappingSlot(
        normalizedStart,
        normalizedEnd,
        slotId
      );
      if (overlapping) return false;
    }

    return true;
  }

  /**
   * Extracts form data from the form
   * @param {HTMLElement} root - The root element of the form
   * @param {string} mode - 'add' or 'edit'
   * @returns {Object} Extracted form data
   */
  static extractFormData(root, mode) {
    return FormService.extractFormData(root, {
      start_date: "slotStart",
    });
  }

  /**
   * Populates the form with slot data
   * @param {HTMLElement} root - The root element
   * @param {Object} slot - The slot data
   * @param {string} mode - 'add' or 'edit'
   */
  static populateForm(root, slot, mode) {
    if (mode === "add") {
      FormService.setCustomInput(root, "slotStart", "");
      FormService.setCustomInput(root, "insertAfter", "");
    } else if (slot) {
      FormService.setCustomInput(root, "slotStart", slot.start_date || "");
    }
  }
}
