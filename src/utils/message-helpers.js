/**
 * Lightweight message helpers for admin-style components.
 */

/**
 * Show a temporary success message in a component.
 * @param {LitElement} component - The component to show message in
 * @param {string} message - The success message text
 * @param {number} duration - How long to show message (ms)
 */
export function showSuccessMessage(component, message, duration = 3000) {
  component.message = message;
  component.messageType = "success";
  setTimeout(() => {
    component.message = "";
  }, duration);
}

/**
 * Show a temporary error message in a component.
 * @param {LitElement} component - The component to show message in
 * @param {string} message - The error message text
 * @param {number} duration - How long to show message (ms)
 */
export function showErrorMessage(component, message, duration = 5000) {
  component.message = message;
  component.messageType = "error";
  setTimeout(() => {
    component.message = "";
  }, duration);
}
