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
    hidePlaceholder: { type: Boolean },
    id: { type: String },
    name: { type: String },
    multiple: { type: Boolean },
    size: { type: Number },
    options: { type: Array },
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

    select[multiple] {
      min-height: 100px;
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
    this.hidePlaceholder = false;
    this.id = "";
    this.name = "";
    this.multiple = false;
    this.size = 1;
    this.options = [];
  }

	  render() {
	    const selectEl = this.multiple
	      ? html`
          <select
            ?disabled=${this.disabled}
            ?required=${this.required}
            ?multiple=${this.multiple}
            size=${this.size}
            id=${this.id}
            name=${this.name || this.id}
            @change=${this._handleChange}
          >
            ${this.options && this.options.length > 0
              ? this.options.map(
                  (opt) => html`
                    <option value="${opt.value}" ?selected="${opt.selected}">
                      ${opt.label}
                    </option>
                  `
                )
              : html`<slot></slot>`}
          </select>
        `
	      : html`
	          <select
	            .value=${this.value}
	            ?disabled=${this.disabled}
	            ?required=${this.required}
	            ?multiple=${this.multiple}
	            size=${this.size}
	            id=${this.id}
	            name=${this.name || this.id}
	            @change=${this._handleChange}
	          >
	            ${this.placeholder
	              ? this.hidePlaceholder
	                ? html`<option value="" disabled hidden ?selected=${!this.value}
	                    >${this.placeholder}</option
	                  >`
	                : html`<option value="">${this.placeholder}</option>`
	              : ""}
	            ${this.options && this.options.length > 0
	              ? this.options.map(
	                  (opt) => html`
	                    <option value="${opt.value}" ?selected="${opt.selected}">
                      ${opt.label}
                    </option>
                  `
                )
              : html`<slot></slot>`}
          </select>
        `;

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
        ${selectEl}
      </div>
    `;
  }

  _handleChange(e) {
    if (this.multiple) {
      const select = e.target;
      const values = Array.from(select.selectedOptions).map((opt) => opt.value);
      this.dispatchEvent(
        new CustomEvent("select-change", {
          bubbles: true,
          composed: true,
          detail: { values },
        })
      );
      return;
    }

    this.value = e.target.value;
    this.dispatchEvent(
      new CustomEvent("select-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  }

  // Method to get the native select element
  getSelect() {
    return this.shadowRoot.querySelector("select");
  }
}

customElements.define("henry-select", HenrySelect);
