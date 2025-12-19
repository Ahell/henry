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
  static isFormValid(containerOrForm) {
    const form = this._resolveForm(containerOrForm);
    if (!form) return false;

    const requiredControls = this._getRequiredControls(form);
    for (const control of requiredControls) {
      if (!this._isControlValid(control)) return false;
    }
    return true;
  }

  static reportFormValidity(containerOrForm) {
    const form = this._resolveForm(containerOrForm);
    if (!form) return false;

    const requiredControls = this._getRequiredControls(form);
    for (const control of requiredControls) {
      if (this._isControlValid(control)) continue;

      const native = this._getNativeControl(control);
      if (native && typeof native.reportValidity === "function") {
        native.reportValidity();
      }
      if (native && typeof native.focus === "function") {
        try {
          native.focus();
        } catch (err) {
          /* ignore */
        }
      }
      return false;
    }

    return true;
  }

  static _resolveForm(containerOrForm) {
    if (!containerOrForm) return null;
    if (
      typeof containerOrForm.checkValidity === "function" &&
      containerOrForm.tagName === "FORM"
    ) {
      return containerOrForm;
    }
    if (typeof containerOrForm.querySelector === "function") {
      return containerOrForm.querySelector("form");
    }
    return null;
  }

  static _getRequiredControls(form) {
    const controls = [];

    controls.push(
      ...Array.from(form.querySelectorAll("henry-input[required]")),
      ...Array.from(form.querySelectorAll("henry-select[required]")),
      ...Array.from(form.querySelectorAll("henry-radio-group[required]")),
      ...Array.from(form.querySelectorAll("henry-textarea[required]")),
      ...Array.from(form.querySelectorAll("input[required]")),
      ...Array.from(form.querySelectorAll("select[required]")),
      ...Array.from(form.querySelectorAll("textarea[required]"))
    );

    return controls;
  }

  static _isControlValid(control) {
    const native = this._getNativeControl(control);
    if (!native) return true;
    if (typeof native.checkValidity === "function") return native.checkValidity();
    return String(native?.value ?? "").trim().length > 0;
  }

  static _getNativeControl(control) {
    if (!control) return null;

    // Native inputs
    if (typeof control.checkValidity === "function" && control.tagName !== "HENRY-RADIO-GROUP") {
      return control;
    }

    // henry-input
    if (typeof control.getInput === "function") {
      return control.getInput();
    }

    // henry-select
    if (typeof control.getSelect === "function") {
      return control.getSelect();
    }

    // henry-radio-group
    if (control.tagName === "HENRY-RADIO-GROUP") {
      // Prefer native radio input so browser can render validation UI.
      const firstRadio = control.shadowRoot?.querySelector('input[type="radio"]');
      if (firstRadio) return firstRadio;
      return { value: control.value ?? "" };
    }

    return null;
  }

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
      this._clearInputValue(el);
    }
    // Handle henry-select (single or multi)
    else if (typeof el.getSelect === "function") {
      this._clearSelectValue(el);
    }
    // Handle henry-radio-group
    else if (el.tagName === "HENRY-RADIO-GROUP") {
      this._clearRadioValue(el);
    }
    // Handle generic elements
    else if (typeof el.value !== "undefined") {
      this._clearNativeValue(el);
    }
  }

  /**
   * Set a single custom input element to a value.
   * Handles henry-input, henry-select (single/multi), henry-radio-group, and native inputs.
   * @param {ShadowRoot} root
   * @param {string} id
   * @param {string|Array} value
   */
  static setCustomInput(root, id, value) {
    const el = root.querySelector(`#${id}`);
    if (!el) return;

    // henry-input
    if (typeof el.getInput === "function") {
      this._setInputValue(el, value);
      return;
    }

    // henry-select (single or multi)
    if (typeof el.getSelect === "function") {
      this._setSelectValue(el, value);
      return;
    }

    // henry-radio-group
    if (el.tagName === "HENRY-RADIO-GROUP") {
      this._setRadioValue(el, value);
      return;
    }

    // Fallback native
    if (typeof el.value !== "undefined") {
      this._setNativeValue(el, value);
    }
  }

  /**
   * Set many custom fields using an object map of id -> value.
   * @param {ShadowRoot} root
   * @param {Object} values - { fieldId: value }
   */
  static setCustomForm(root, values = {}) {
    if (!values || typeof values !== "object") return;
    Object.entries(values).forEach(([id, val]) =>
      this.setCustomInput(root, id, val)
    );
  }

  // Private setters
  static _setInputValue(el, value) {
    const input = el.getInput();
    if (input) {
      input.value = value ?? "";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  static _setSelectValue(el, value) {
    const sel = el.getSelect();
    if (!sel) return;
    const values = Array.isArray(value)
      ? value.map(String)
      : [value?.toString() ?? ""];
    Array.from(sel.options).forEach((o) => {
      o.selected = values.includes(o.value);
    });
    sel.value = values[0] ?? "";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }

  static _setRadioValue(el, value) {
    const next = value ?? "";
    if (typeof el.setValue === "function") {
      el.setValue(next);
    } else if (typeof el.value !== "undefined") {
      el.value = next;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  static _setNativeValue(el, value) {
    el.value = value ?? "";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Private clear helpers
  static _clearInputValue(el) {
    const input = el.getInput();
    if (!input) return;
    input.value = "";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  static _clearSelectValue(el) {
    const sel = el.getSelect();
    if (!sel) return;
    Array.from(sel.options).forEach((o) => (o.selected = false));
    sel.value = "";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }

  static _clearRadioValue(el) {
    if (typeof el.setValue === "function") {
      el.setValue("");
    } else if (typeof el.value !== "undefined") {
      const firstOption = el.querySelector('input[type="radio"]');
      el.value = firstOption ? firstOption.value : "";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  static _clearNativeValue(el) {
    el.value = "";
    el.dispatchEvent(new Event("change", { bubbles: true }));
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
    // Prefer henry-radio-group by id (our forms typically pass the element id)
    const maybeGroup = root.querySelector(`#${name}`);
    if (maybeGroup && maybeGroup.tagName === "HENRY-RADIO-GROUP") {
      return maybeGroup.value || "";
    }

    // Fallback: native radios in light DOM
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
