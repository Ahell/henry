import { LitElement, html, css } from "lit";

/**
 * Primary Textarea Component
 * @property {String} label - Label text
 * @property {String} value - Textarea value
 * @property {Boolean} disabled - Disabled state
 * @property {Boolean} required - Required field
 * @property {String} placeholder - Placeholder text
 * @property {Number} rows - Number of visible rows
 */
export class HenryTextarea extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    disabled: { type: Boolean },
    required: { type: Boolean },
    placeholder: { type: String },
    rows: { type: Number },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
      margin-bottom: var(--space-4);
    }

    .textarea-wrapper {
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

    textarea {
      padding: var(--input-padding-y) var(--input-padding-x);
      border: var(--input-border-width) solid var(--color-border);
      border-radius: var(--radius-base);
      font-size: var(--font-size-sm);
      font-family: var(--font-family-base);
      background: var(--color-background);
      color: var(--color-text-primary);
      transition: var(--transition-all);
      resize: vertical;
    }

    textarea:hover:not(:disabled) {
      border-color: var(--color-border-hover);
    }

    textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: var(--input-focus-ring);
    }

    textarea:disabled {
      background: var(--color-gray-100);
      cursor: not-allowed;
      opacity: 0.6;
    }

    textarea::placeholder {
      color: var(--color-text-disabled);
    }
  `;

  constructor() {
    super();
    this.label = "";
    this.value = "";
    this.disabled = false;
    this.required = false;
    this.placeholder = "";
    this.rows = 4;
  }

  render() {
    return html`
      <div class="textarea-wrapper">
        ${this.label
          ? html`
              <label>
                ${this.label}
                ${this.required ? html`<span class="required">*</span>` : ""}
              </label>
            `
          : ""}
        <textarea
          .value=${this.value}
          ?disabled=${this.disabled}
          ?required=${this.required}
          placeholder=${this.placeholder}
          rows=${this.rows}
          @input=${this._handleInput}
        ></textarea>
      </div>
    `;
  }

  _handleInput(e) {
    this.value = e.target.value;
    this.dispatchEvent(
      new CustomEvent("textarea-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }
}

customElements.define("henry-textarea", HenryTextarea);
