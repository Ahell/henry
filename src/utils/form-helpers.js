/**
 * Generic form helpers for Lit components and custom inputs.
 */

/**
 * Get value from a henry-input or henry-select component.
 * @param {ShadowRoot} root - The shadow root to query in
 * @param {string} id - The element ID
 * @returns {string} The input value
 */
export function getInputValue(root, id) {
  const el = root.querySelector(`#${id}`);
  if (!el) return "";
  if (typeof el.getInput === "function") {
    const input = el.getInput();
    return input ? input.value : "";
  }
  if (typeof el.getSelect === "function") {
    const select = el.getSelect();
    return select ? select.value : "";
  }
  return el.value ?? "";
}

/**
 * Get selected values from a henry-select component.
 * @param {ShadowRoot} root - The shadow root to query in
 * @param {string} id - The element ID
 * @returns {number[]} Array of selected values as integers
 */
export function getSelectValues(root, id) {
  const select = root.querySelector(`#${id}`).getSelect();
  return Array.from(select.selectedOptions).map((opt) => parseInt(opt.value));
}

/**
 * Get value from a henry-radio-group component.
 * @param {ShadowRoot} root - The shadow root to query in
 * @param {string} id - The element ID
 * @returns {string} The selected value
 */
export function getRadioValue(root, id) {
  return root.querySelector(`#${id}`).getValue();
}

/**
 * Reset a form in the shadow DOM.
 * @param {ShadowRoot} root - The shadow root to query in
 * @param {string} selector - Form selector (default: "form")
 */
export function resetForm(root, selector = "form") {
  const form = root.querySelector(selector);
  if (form) {
    form.reset();
  }
}

/**
 * Normalize a date input to YYYY-MM-DD or return null on invalid input.
 * Intended to be used in forms to validate before sending to the store/API.
 */
export function normalizeDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}
