import { LitElement, html, css } from "lit";

/**
 * Primary Input Component
 * @property {String} label - Label text
 * @property {String} value - Input value
 * @property {String} type - Input type (text, number, date, etc.)
 * @property {Boolean} disabled - Disabled state
 * @property {Boolean} required - Required field
 * @property {String} placeholder - Placeholder text
 * @property {Number} min - Min value for number/date inputs
 * @property {Number} max - Max value for number/date inputs
 * @property {Number} step - Step value for number inputs
 */
export class HenryInput extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    type: { type: String },
    disabled: { type: Boolean },
    required: { type: Boolean },
    placeholder: { type: String },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    id: { type: String },
    name: { type: String },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    * {
      box-sizing: border-box;
    }

    :host {
      display: block;
    }

    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .required {
      color: var(--color-danger);
    }

    input {
      display: block;
      width: 100%;
      height: var(--input-height-base);
      padding: 0 var(--space-3);
      font-family: var(--font-family-base);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      background-color: var(--color-white);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-base);
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }

    input:hover:not(:disabled) {
      border-color: var(--color-gray);
    }

    input:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px rgba(0, 71, 145, 0.15);
    }

    input:disabled {
      background-color: var(--color-gray-lighter);
      color: var(--color-text-disabled);
      cursor: not-allowed;
      box-shadow: none;
    }

    input::placeholder {
      color: var(--color-text-disabled);
    }
  `;

  constructor() {
    super();
    this.label = "";
    this.value = "";
    this.type = "text";
    this.disabled = false;
    this.required = false;
    this.placeholder = "";
    this.id = "";
    this.name = "";
  }

  render() {
    return html`
      <div class="input-wrapper">
        ${this.label
          ? html`
              <label>
                ${this.label}
                ${this.required ? html`<span class="required">*</span>` : ""}
              </label>
            `
          : ""}
        <input
          type=${this.type}
          .value=${this.value}
          ?disabled=${this.disabled}
          ?required=${this.required}
          placeholder=${this.placeholder}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          id=${this.id}
          name=${this.name || this.id}
          @input=${this._handleInput}
        />
      </div>
    `;
  }

  _handleInput(e) {
    this.value = e.target.value;
    this.dispatchEvent(
      new CustomEvent("input-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  // Method to get the native input element
  getInput() {
    return this.shadowRoot.querySelector("input");
  }
}

customElements.define("henry-input", HenryInput);
