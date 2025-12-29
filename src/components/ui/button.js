import { LitElement, html, css } from "lit";

/**
 * Primary Button Component
 * @property {String} variant - 'primary', 'secondary', 'danger', 'success'
 * @property {Boolean} disabled - Disabled state
 * @property {String} size - 'small', 'medium', 'large'
 * @property {Boolean} fullWidth - Full width button
 */
export class HenryButton extends LitElement {
  static properties = {
    variant: { type: String },
    disabled: { type: Boolean },
    size: { type: String },
    fullWidth: { type: Boolean },
    type: { type: String },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: inline-block;
    }

    :host([fullWidth]) {
      display: block;
    }

    button {
      font-family: var(--font-family-base);
      border: none;
      border-radius: var(--radius-base);
      cursor: pointer;
      transition: var(--transition-all);
      font-weight: var(--font-weight-medium);
      white-space: nowrap;
    }

    button:hover:not(:disabled) {
      box-shadow: var(--shadow-md);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Sizes */
    button.small {
      height: var(--button-height-sm);
      padding: 0 var(--space-3);
      font-size: var(--font-size-xs);
    }

    button.medium {
      height: var(--button-height-base);
      padding: 0 var(--space-5);
      font-size: var(--font-size-sm);
    }

    button.large {
      height: var(--button-height-lg);
      padding: 0 var(--space-8);
      font-size: var(--font-size-base);
    }

    /* Variants */
    button.primary {
      background: var(
        --henry-button-primary-bg,
        var(--color-primary-600)
      );
      color: var(
        --henry-button-primary-color,
        var(--color-white)
      );
      box-shadow: var(--shadow-sm);
    }

    button.primary:hover:not(:disabled) {
      background: var(
        --henry-button-primary-bg-hover,
        var(--color-primary-700)
      );
      box-shadow: var(--shadow-md);
    }

    button.secondary {
      background: var(--color-white);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      box-shadow: var(--shadow-sm);
    }

    button.secondary:hover:not(:disabled) {
      background: var(--color-gray-light);
      border-color: var(--color-text-primary);
    }

    button.danger {
      background: var(--color-danger);
      color: var(--color-white);
      box-shadow: var(--shadow-danger);
    }

    button.danger:hover:not(:disabled) {
      background: var(--color-danger-dark); /* fixed from danger-hover */
    }

    button.success {
      background: var(--color-success);
      color: var(--color-white);
      box-shadow: var(--shadow-success);
    }

    button.success:hover:not(:disabled) {
      background: var(--color-green-dark); /* fixed from success-hover */
    }

    :host([fullWidth]) button {
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.variant = "primary";
    this.disabled = false;
    this.size = "medium";
    this.fullWidth = false;
    this.type = "button";
  }

  render() {
    return html`
      <button
        class="${this.variant} ${this.size}"
        type="${this.type}"
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  _handleClick(e) {
    if (!this.disabled) {
      // For submit buttons, find the form and submit it
      if (this.type === "submit") {
        // Prevent default button click
        e.preventDefault();
        e.stopPropagation();

        // Find the closest form (traversing shadow DOM boundaries)
        let element = this;
        while (element) {
          // Check if parent has a form
          const parent = element.parentNode;
          if (parent instanceof ShadowRoot) {
            element = parent.host;
          } else if (parent) {
            const form = parent.closest ? parent.closest("form") : null;
            if (form) {
            console.log("Found form, requesting submit");
              form.requestSubmit();
              return;
            }
            element = parent;
          } else {
            break;
          }
        }
        console.error("🔴 Could not find form for submit button");
      } else {
        this.dispatchEvent(
          new CustomEvent("button-click", {
            bubbles: true,
            composed: true,
            detail: { originalEvent: e },
          })
        );
      }
    }
  }
}

customElements.define("henry-button", HenryButton);
