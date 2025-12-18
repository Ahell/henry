import { store } from "../store/DataStore.js";
import { resetForm } from "../../utils/form-helpers.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../utils/message-helpers.js";

/**
 * Form Service
 * Provides reusable form handling, clearing, and submission patterns
 */
export class FormService {
  /**
   * Submit a form with optimistic updates and error handling
   * @param {Object} options
   * @param {HTMLElement} options.component - The component instance
   * @param {Function} options.getData - Function to extract form data
   * @param {Function} options.mutation - Function that performs the mutation
   * @param {Function} options.onSuccess - Success callback (optional)
   * @param {Function} options.onError - Error callback (optional)
   * @param {string} options.successMessage - Success message to display
   * @param {string} options.errorMessage - Error message prefix
   * @param {string} options.label - Label for optimistic update
   */

  /**
   * Clear all form inputs including custom components
   * Handles henry-input, henry-select, henry-radio-group
   * @param {ShadowRoot} root - Component shadow root
   * @param {Array} customFields - Array of field IDs to clear (optional)
   */
  static clearCustomForm(root, customFields = null) {
    // Reset native form elements
    resetForm(root);

    // If no specific fields provided, try to find all custom elements
    if (!customFields) {
      customFields = [
        ...Array.from(root.querySelectorAll("henry-input")).map((el) => el.id),
        ...Array.from(root.querySelectorAll("henry-select")).map((el) => el.id),
        ...Array.from(root.querySelectorAll("henry-radio-group")).map(
          (el) => el.id
        ),
      ].filter(Boolean);
    }

    customFields.forEach((id) => {
      this.clearCustomInput(root, id);
    });
  }

  /**
   * Clear a single custom input element
   * @param {ShadowRoot} root - Component shadow root
   * @param {string} id - Element ID
   */
  static clearCustomInput(root, id) {
    const el = root.querySelector(`#${id}`);
    if (!el) return;

    // Handle henry-input
    if (typeof el.getInput === "function") {
      const input = el.getInput();
      if (input) input.value = "";
    }
    // Handle henry-select (single or multi)
    else if (typeof el.getSelect === "function") {
      const sel = el.getSelect();
      if (sel) {
        Array.from(sel.options).forEach((o) => (o.selected = false));
        sel.value = "";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    // Handle henry-radio-group
    else if (el.tagName === "HENRY-RADIO-GROUP") {
      if (typeof el.setValue === "function") {
        el.setValue(el.value || ""); // Reset to default
      } else if (typeof el.value !== "undefined") {
        // Reset to first option or empty
        const firstOption = el.querySelector('input[type="radio"]');
        if (firstOption) {
          el.value = firstOption.value;
        }
      }
    }
    // Handle generic elements
    else if (typeof el.value !== "undefined") {
      el.value = "";
    }
  }

  /**
   * Set a select element to a specific value
   * @param {ShadowRoot} root - Component shadow root
   * @param {string} id - Select element ID
   * @param {string} value - Value to set
   */
  static setSelectValue(root, id, value) {
    const el = root.querySelector(`#${id}`);
    if (!el) return;

    if (typeof el.getSelect === "function") {
      const sel = el.getSelect();
      if (sel) {
        sel.value = value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  /**
   * Extract form data using a field map
   * @param {ShadowRoot} root - Component shadow root
   * @param {Object} fieldMap - Map of field names to IDs
   * @returns {Object} Extracted form data
   * @example
   * FormService.extractFormData(root, {
   *   name: 'teacherName',
   *   department: { id: 'teacherDepartment', type: 'radio' },
   *   courses: { id: 'teacherCourses', type: 'select-multiple' }
   * })
   */
  static extractFormData(root, fieldMap) {
    const data = {};

    Object.entries(fieldMap).forEach(([key, config]) => {
      // Simple string ID
      if (typeof config === "string") {
        data[key] = this._getElementValue(root, config);
      }
      // Complex config object
      else if (typeof config === "object") {
        const { id, type, transform } = config;

        if (type === "select-multiple") {
          data[key] = this._getSelectValues(root, id);
        } else if (type === "radio") {
          data[key] = this._getRadioValue(root, id);
        } else {
          data[key] = this._getElementValue(root, id);
        }

        // Apply transform if provided
        if (transform && typeof transform === "function") {
          data[key] = transform(data[key]);
        }
      }
    });

    return data;
  }

  /**
   * Get value from a form element
   * @private
   */
  static _getElementValue(root, id) {
    const el = root.querySelector(`#${id}`);
    if (!el) return "";

    if (typeof el.getInput === "function") {
      const input = el.getInput();
      return input ? input.value : "";
    }

    if (typeof el.getSelect === "function") {
      const sel = el.getSelect();
      return sel ? sel.value : "";
    }

    return el.value || "";
  }

  /**
   * Get selected values from a multi-select
   * @private
   */
  static _getSelectValues(root, id) {
    const el = root.querySelector(`#${id}`);
    if (!el) return [];

    let select = null;
    if (typeof el.getSelect === "function") {
      select = el.getSelect();
    } else if (el.tagName === "SELECT") {
      select = el;
    }

    if (!select) return [];

    return Array.from(select.selectedOptions).map((opt) => {
      const value = opt.value;
      // Try to parse as number if it looks like one
      const num = Number(value);
      return isNaN(num) ? value : num;
    });
  }

  /**
   * Get selected radio button value
   * @private
   */
  static _getRadioValue(root, name) {
    const checked = root.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }

  /**
   * Dispatch a custom event from a component
   * @param {HTMLElement} component - Component instance
   * @param {string} eventName - Event name
   * @param {*} detail - Event detail payload
   */
  static dispatchEvent(component, eventName, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail,
          bubbles: true,
          composed: true,
        })
      );
    } catch (e) {
      console.warn(`Failed to dispatch event ${eventName}:`, e);
    }
  }
}
