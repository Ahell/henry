import { LitElement, html, css } from "lit";

/**
 * Primary Select Component
 * @property {String} label - Label text
 * @property {String} value - Selected value
 * @property {Boolean} disabled - Disabled state
 * @property {Boolean} required - Required field
 * @property {String} placeholder - Placeholder text
 */
export class HenrySelect extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    disabled: { type: Boolean },
    required: { type: Boolean },
    placeholder: { type: String },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
      margin-bottom: var(--space-4);
    }

    .select-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    label {
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

    select {
      padding: var(--input-padding-y) var(--input-padding-x);
      border: var(--input-border-width) solid var(--color-border);
      border-radius: var(--radius-base);
      font-size: var(--font-size-sm);
      font-family: var(--font-family-base);
      background: var(--color-background);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: var(--transition-all);
    }

    select:hover:not(:disabled) {
      border-color: var(--color-border-hover);
    }

    select:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: var(--input-focus-ring);
    }

    select:disabled {
      background: var(--color-gray-100);
      cursor: not-allowed;
      opacity: 0.6;
    }

    select option {
      padding: var(--space-2);
    }
  `;

  constructor() {
    super();
    this.label = "";
    this.value = "";
    this.disabled = false;
    this.required = false;
    this.placeholder = "Välj...";
  }

  render() {
    return html`
      <div class="select-wrapper">
        ${this.label
          ? html`
              <label>
                ${this.label}
                ${this.required ? html`<span class="required">*</span>` : ""}
              </label>
            `
          : ""}
        <select
          .value=${this.value}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @change=${this._handleChange}
        >
          ${this.placeholder
            ? html`<option value="">${this.placeholder}</option>`
            : ""}
          <slot></slot>
        </select>
      </div>
    `;
  }

  _handleChange(e) {
    this.value = e.target.value;
    this.dispatchEvent(
      new CustomEvent("select-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }
}

customElements.define("henry-select", HenrySelect);
