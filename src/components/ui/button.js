import { LitElement, html, css } from 'lit';

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
    fullWidth: { type: Boolean }
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    :host([fullWidth]) {
      display: block;
    }

    button {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
      white-space: nowrap;
    }

    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Sizes */
    button.small {
      padding: 6px 12px;
      font-size: 13px;
    }

    button.medium {
      padding: 10px 20px;
      font-size: 14px;
    }

    button.large {
      padding: 14px 28px;
      font-size: 16px;
    }

    /* Variants */
    button.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(102, 126, 234, 0.4);
    }

    button.secondary {
      background: #f3f4f6;
      color: #374151;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    button.secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    button.danger {
      background: #ef4444;
      color: white;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.4);
    }

    button.danger:hover:not(:disabled) {
      background: #dc2626;
    }

    button.success {
      background: #10b981;
      color: white;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.4);
    }

    button.success:hover:not(:disabled) {
      background: #059669;
    }

    :host([fullWidth]) button {
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.variant = 'primary';
    this.disabled = false;
    this.size = 'medium';
    this.fullWidth = false;
  }

  render() {
    return html`
      <button 
        class="${this.variant} ${this.size}"
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  _handleClick(e) {
    if (!this.disabled) {
      this.dispatchEvent(new CustomEvent('button-click', { 
        bubbles: true, 
        composed: true,
        detail: { originalEvent: e }
      }));
    }
  }
}

customElements.define('henry-button', HenryButton);
