import { LitElement, html, css } from "lit";

/**
 * Switch Component
 * @property {String} label - Label text
 * @property {String} labelPosition - Label position: "left" or "right" (default: "right")
 * @property {Boolean} checked - On/off state
 * @property {Boolean} disabled - Disabled state
 */
export class HenrySwitch extends LitElement {
  static properties = {
    label: { type: String },
    labelPosition: { type: String },
    checked: { type: Boolean },
    disabled: { type: Boolean, reflect: true },
  };

  static get observedAttributes() {
    // Support both `labelPosition` (HTML lowercases to `labelposition`) and
    // kebab-case `label-position` (preferred).
    return [...super.observedAttributes, "label-position"];
  }

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      user-select: none;
    }

    :host([disabled]) {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .label {
      font-size: var(--henry-switch-label-size, var(--font-size-sm));
      font-weight: var(--henry-switch-label-weight, var(--font-weight-medium));
      letter-spacing: var(--henry-switch-label-letter-spacing, 0);
      color: var(--color-text-primary);
      cursor: pointer;
    }

    .switch {
      position: relative;
      width: var(--henry-switch-width, 44px);
      height: var(--henry-switch-height, 24px);
      flex: 0 0 auto;
      cursor: pointer;
    }

    input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .track {
      position: absolute;
      inset: 0;
      border-radius: var(--radius-full);
      background: var(--color-gray-light);
      border: 1px solid var(--color-border);
      transition: var(--transition-all);
    }

    .thumb {
      position: absolute;
      top: 50%;
      left: var(--henry-switch-thumb-offset, 3px);
      width: var(--henry-switch-thumb-size, 18px);
      height: var(--henry-switch-thumb-size, 18px);
      border-radius: var(--radius-full);
      transform: translateY(-50%);
      background: var(--color-white);
      box-shadow: var(--shadow-sm);
      transition: var(--transition-all);
    }

    input:focus-visible + .track {
      box-shadow: var(--input-focus-ring);
      border-color: var(--color-primary-500);
    }

    input:checked + .track {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
    }

    input:checked + .track .thumb {
      left: calc(
        100% - var(--henry-switch-thumb-size, 18px) -
          var(--henry-switch-thumb-offset, 3px)
      );
    }

    .disabled {
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.label = "";
    this.labelPosition = "right";
    this.checked = false;
    this.disabled = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === "label-position") {
      this.labelPosition = newValue;
    }
  }

  render() {
    const ariaChecked = this.checked ? "true" : "false";
    const labelElement = this.label
      ? html`
          <span
            class="label ${this.disabled ? "disabled" : ""}"
            @click=${this._handleToggleClick}
          >
            ${this.label}
          </span>
        `
      : "";

    const switchElement = html`
      <span
        class="switch ${this.disabled ? "disabled" : ""}"
        @click=${this._handleToggleClick}
      >
        <input
          type="checkbox"
          role="switch"
          aria-checked=${ariaChecked}
          .checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this._handleChange}
        />
        <span class="track">
          <span class="thumb" aria-hidden="true"></span>
        </span>
      </span>
    `;

    // Render label on left or right based on labelPosition
    const pos = String(this.labelPosition || "right").toLowerCase();
    const isLeft = pos === "left" || pos === "start";
    return isLeft
      ? html`${labelElement}${switchElement}`
      : html`${switchElement}${labelElement}`;
  }

  _handleToggleClick(e) {
    if (this.disabled) return;
    e.preventDefault();
    this.checked = !this.checked;
    this._emitChange();
  }

  _handleChange(e) {
    if (this.disabled) return;
    this.checked = !!e.target.checked;
    this._emitChange();
  }

  _emitChange() {
    this.dispatchEvent(
      new CustomEvent("switch-change", {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      })
    );
  }
}

customElements.define("henry-switch", HenrySwitch);