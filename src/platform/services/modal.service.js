import { html } from "lit";

/**
 * Modal Service
 * Provides reusable modal rendering patterns and state management
 */
export class ModalService {
  /**
   * Create a standard edit modal template
   * @param {Object} options
   * @param {string} options.title - Modal title
   * @param {Function} options.renderFields - Function that returns field HTML
   * @param {Function} options.onSave - Save handler
   * @param {Function} options.onCancel - Cancel handler
   * @param {Function} options.onSubmit - Form submit handler (optional)
   * @param {string} options.saveLabel - Save button label (default: "Spara")
   * @param {string} options.cancelLabel - Cancel button label (default: "Avbryt")
   * @returns {TemplateResult} Modal HTML template
   */
  static createEditModal({
    title,
    renderFields,
    onSave,
    onCancel,
    onSubmit,
    saveLabel = "Spara",
    cancelLabel = "Avbryt",
  }) {
    return html`
      <henry-modal open title="${title}" @close="${onCancel}">
        <form @submit="${onSubmit || ((e) => e.preventDefault())}">
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            ${renderFields()}
          </div>
        </form>

        <div slot="footer">
          <henry-button variant="secondary" @click="${onCancel}">
            ${cancelLabel}
          </henry-button>
          <henry-button variant="success" @click="${onSave}">
            ${saveLabel}
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  /**
   * Create a confirmation modal
   * @param {Object} options
   * @param {string} options.title - Modal title
   * @param {string} options.message - Confirmation message
   * @param {Function} options.onConfirm - Confirm handler
   * @param {Function} options.onCancel - Cancel handler
   * @param {string} options.confirmLabel - Confirm button label (default: "Bekräfta")
   * @param {string} options.cancelLabel - Cancel button label (default: "Avbryt")
   * @param {string} options.variant - Button variant (default: "primary")
   * @returns {TemplateResult} Modal HTML template
   */
  static createConfirmModal({
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Bekräfta",
    cancelLabel = "Avbryt",
    variant = "primary",
  }) {
    return html`
      <henry-modal open title="${title}" @close="${onCancel}">
        <p>${message}</p>

        <div slot="footer">
          <henry-button variant="secondary" @click="${onCancel}">
            ${cancelLabel}
          </henry-button>
          <henry-button variant="${variant}" @click="${onConfirm}">
            ${confirmLabel}
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  /**
   * Render an input field for edit modals
   * @param {Object} options
   * @param {string} options.id - Input ID
   * @param {string} options.label - Input label
   * @param {string} options.value - Input value
   * @param {boolean} options.required - Required flag
   * @param {string} options.placeholder - Placeholder text
   * @returns {TemplateResult} Input HTML
   */
  static renderInput({
    id,
    label,
    value = "",
    required = false,
    placeholder = "",
  }) {
    return html`
      <henry-input
        id="${id}"
        label="${label}"
        .value="${value}"
        ?required="${required}"
        placeholder="${placeholder}"
      ></henry-input>
    `;
  }

  /**
   * Render a select field for edit modals
   * @param {Object} options
   * @param {string} options.id - Select ID
   * @param {string} options.label - Select label
   * @param {Array} options.options - Select options
   * @param {boolean} options.multiple - Multiple selection
   * @param {number} options.size - Select size
   * @param {boolean} options.required - Required flag
   * @returns {TemplateResult} Select HTML
   */
  static renderSelect({
    id,
    label,
    options,
    multiple = false,
    size = 5,
    required = false,
  }) {
    return html`
      <henry-select
        id="${id}"
        label="${label}"
        ?multiple="${multiple}"
        size="${size}"
        ?required="${required}"
        .options="${options}"
      ></henry-select>
    `;
  }

  /**
   * Render a radio group for edit modals
   * @param {Object} options
   * @param {string} options.id - Radio group ID
   * @param {string} options.name - Radio group name
   * @param {string} options.label - Radio group label
   * @param {string} options.value - Selected value
   * @param {Array} options.options - Radio options
   * @returns {TemplateResult} Radio group HTML
   */
  static renderRadioGroup({ id, name, label, value, options }) {
    return html`
      <henry-radio-group
        id="${id}"
        name="${name}"
        label="${label}"
        value="${value}"
        .options="${options}"
      ></henry-radio-group>
    `;
  }
}

/**
 * Modal State Manager
 * Manages modal visibility state for components
 */
export class ModalStateManager {
  constructor(component, stateProperty = "editingId") {
    this.component = component;
    this.stateProperty = stateProperty;
  }

  /**
   * Open modal with an entity ID
   */
  open(id) {
    this.component[this.stateProperty] = id;
    this.component.requestUpdate();
  }

  /**
   * Close modal
   */
  close() {
    this.component[this.stateProperty] = null;
    this.component.requestUpdate();
  }

  /**
   * Check if modal is open
   */
  isOpen() {
    return this.component[this.stateProperty] !== null;
  }

  /**
   * Get current editing ID
   */
  getEditingId() {
    return this.component[this.stateProperty];
  }
}
