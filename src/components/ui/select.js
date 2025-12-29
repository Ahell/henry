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

    * {
      box-sizing: border-box;
    }

    :host {
      display: block;
    }

    .select-wrapper {
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

    select {
      display: block;
      width: 100%;
      min-height: var(--input-height-base);
      padding: 0 var(--space-3);
      font-family: var(--font-family-base);
      font-size: var(--henry-select-font-size, var(--font-size-base));
      color: var(--color-text-primary);
      background-color: var(--color-white);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-base);
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
    }

    select:hover:not(:disabled) {
      border-color: var(--color-gray);
    }

    select:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: var(--input-focus-ring);
    }

    select:disabled {
      background-color: var(--color-gray-lighter);
      color: var(--color-text-disabled);
      cursor: not-allowed;
      box-shadow: none;
    }

    select option {
      padding: var(--space-2);
    }

    select[multiple] {
      min-height: 100px;
      padding: var(--space-2);
    }

    /* Listbox mode (single select with size > 1) */
    select.listbox {
      height: calc(
        var(--henry-select-visible-options, 6) *
          var(--henry-select-row-height, 36px)
      );
      overflow-y: auto;
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

  updated(changedProperties) {
    if (changedProperties.has("value") && !this.multiple) {
      const selectElement = this.renderRoot.querySelector("select");
      if (selectElement && selectElement.value !== this.value) {
        selectElement.value = this.value;
      }
    }
  }

  render() {
    const listbox = !this.multiple && Number(this.size) > 1;
    const listboxStyle = listbox
      ? `--henry-select-visible-options: ${Number(this.size)};`
      : "";
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
            class=${listbox ? "listbox" : ""}
            style=${listboxStyle}
            ?disabled=${this.disabled}
            ?required=${this.required}
            ?multiple=${this.multiple}
            size=${this.size}
            id=${this.id}
            name=${this.name || this.id}
            @change=${this._handleChange}
          >
            ${this.hidePlaceholder
              ? html`<option value="" disabled hidden ?selected=${!this.value}
                  >${this.placeholder || ""}</option
                >`
              : this.placeholder
              ? html`<option value="">${this.placeholder}</option>`
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
