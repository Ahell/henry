import { LitElement, html, css } from 'lit';

/**
 * Primary Card Component
 * @property {String} variant - 'default', 'elevated', 'bordered'
 * @property {Boolean} padding - Add padding (default: true)
 */
export class HenryCard extends LitElement {
  static properties = {
    variant: { type: String },
    padding: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: white;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .card.padding {
      padding: 24px;
    }

    .card.default {
      border: 1px solid #e5e7eb;
    }

    .card.elevated {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }

    .card.elevated:hover {
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card.bordered {
      border: 2px solid #667eea;
    }
  `;

  constructor() {
    super();
    this.variant = 'default';
    this.padding = true;
  }

  render() {
    return html`
      <div class="card ${this.variant} ${this.padding ? 'padding' : ''}">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('henry-card', HenryCard);
