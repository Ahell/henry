/**
 * Generic form helpers for Lit components and custom inputs.
 */

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
