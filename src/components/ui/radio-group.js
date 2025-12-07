import { LitElement, html, css } from "lit";

/**
 * Radio Group Component
 * @property {String} label - Label text for the group
 * @property {String} name - Name attribute for the radio group
 * @property {String} value - Selected value
 * @property {Boolean} required - Required field
 * @property {Array} options - Array of {value, label} objects
 */
export class HenryRadioGroup extends LitElement {
  static properties = {
    label: { type: String },
    name: { type: String },
    value: { type: String },
    required: { type: Boolean },
    options: { type: Array },
    disabled: { type: Boolean },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
      margin-bottom: var(--space-4);
    }

    .radio-group-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .group-label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .required {
      color: var(--color-danger);
    }

    .radio-options {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-base);
      transition: var(--transition-all);
    }

    .radio-option:hover:not(.disabled) {
      background: var(--color-gray-50);
    }

    .radio-option.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    input[type="radio"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      margin: 0;
      accent-color: var(--color-primary-500);
    }

    input[type="radio"]:disabled {
      cursor: not-allowed;
    }

    .radio-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      cursor: pointer;
      user-select: none;
    }

    .radio-option.disabled .radio-label {
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.label = "";
    this.name = "";
    this.value = "";
    this.required = false;
    this.options = [];
    this.disabled = false;
  }

  render() {
    return html`
      <div class="radio-group-wrapper">
        ${this.label
          ? html`
              <label class="group-label">
                ${this.label}
                ${this.required ? html`<span class="required">*</span>` : ""}
              </label>
            `
          : ""}
        <div class="radio-options">
          ${this.options.map(
            (option) => html`
              <label
                class="radio-option ${this.disabled || option.disabled
                  ? "disabled"
                  : ""}"
              >
                <input
                  type="radio"
                  name="${this.name}"
                  value="${option.value}"
                  ?checked="${this.value === option.value}"
                  ?disabled="${this.disabled || option.disabled}"
                  ?required="${this.required}"
                  @change="${this._handleChange}"
                />
                <span class="radio-label">${option.label}</span>
              </label>
            `
          )}
        </div>
      </div>
    `;
  }

  _handleChange(e) {
    this.value = e.target.value;
    this.dispatchEvent(
      new CustomEvent("radio-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  // Method to get the selected value
  getValue() {
    return this.value;
  }

  // Method to get the selected radio input
  getSelectedInput() {
    return this.shadowRoot.querySelector('input[type="radio"]:checked');
  }
}

customElements.define("henry-radio-group", HenryRadioGroup);
