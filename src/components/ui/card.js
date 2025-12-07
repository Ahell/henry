import { LitElement, html, css } from "lit";

/**
 * Primary Card Component
 * @property {String} variant - 'default', 'elevated', 'bordered'
 * @property {Boolean} padding - Add padding (default: true)
 */
export class HenryCard extends LitElement {
  static properties = {
    variant: { type: String },
    padding: { type: Boolean },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    .card {
      background: var(--color-background);
      border-radius: var(--radius-lg);
      transition: var(--transition-all);
    }

    .card.padding {
      padding: var(--space-6);
    }

    .card.default {
      border: 1px solid var(--color-border);
    }

    .card.elevated {
      box-shadow: var(--shadow-base);
    }

    .card.elevated:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .card.bordered {
      border: 2px solid var(--color-primary-500);
    }
  `;

  constructor() {
    super();
    this.variant = "default";
    this.padding = true;
  }

  render() {
    return html`
      <div class="card ${this.variant} ${this.padding ? "padding" : ""}">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("henry-card", HenryCard);
