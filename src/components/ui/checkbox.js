import { LitElement, html, css } from "lit";

/**
 * Primary Checkbox Component
 * @property {String} label - Label text
 * @property {Boolean} checked - Checked state
 * @property {Boolean} disabled - Disabled state
 */
export class HenryCheckbox extends LitElement {
  static properties = {
    label: { type: String },
    checked: { type: Boolean },
    disabled: { type: Boolean },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
      margin-bottom: var(--space-3);
    }

    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
    }

    .checkbox-wrapper.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--color-primary-500);
    }

    input[type="checkbox"]:disabled {
      cursor: not-allowed;
    }

    label {
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      cursor: pointer;
      user-select: none;
    }

    label.disabled {
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.label = "";
    this.checked = false;
    this.disabled = false;
  }

  render() {
    return html`
      <div class="checkbox-wrapper ${this.disabled ? "disabled" : ""}">
        <input
          type="checkbox"
          .checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this._handleChange}
        />
        ${this.label
          ? html`
              <label
                class="${this.disabled ? "disabled" : ""}"
                @click=${this._handleLabelClick}
              >
                ${this.label}
              </label>
            `
          : ""}
      </div>
    `;
  }

  _handleChange(e) {
    if (!this.disabled) {
      this.checked = e.target.checked;
      this.dispatchEvent(
        new CustomEvent("checkbox-change", {
          bubbles: true,
          composed: true,
          detail: { checked: this.checked },
        })
      );
    }
  }

  _handleLabelClick(e) {
    if (!this.disabled) {
      e.preventDefault();
      this.checked = !this.checked;
      this.dispatchEvent(
        new CustomEvent("checkbox-change", {
          bubbles: true,
          composed: true,
          detail: { checked: this.checked },
        })
      );
    }
  }
}

customElements.define("henry-checkbox", HenryCheckbox);
