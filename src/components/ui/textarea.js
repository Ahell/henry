import { LitElement, html, css } from 'lit';

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
    rows: { type: Number }
  };

  static styles = css`
    :host {
      display: block;
      margin-bottom: 16px;
    }

    .textarea-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .required {
      color: #ef4444;
    }

    textarea {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      transition: all 0.2s ease;
      resize: vertical;
    }

    textarea:hover:not(:disabled) {
      border-color: #9ca3af;
    }

    textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    textarea:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.6;
    }

    textarea::placeholder {
      color: #9ca3af;
    }
  `;

  constructor() {
    super();
    this.label = '';
    this.value = '';
    this.disabled = false;
    this.required = false;
    this.placeholder = '';
    this.rows = 4;
  }

  render() {
    return html`
      <div class="textarea-wrapper">
        ${this.label ? html`
          <label>
            ${this.label}
            ${this.required ? html`<span class="required">*</span>` : ''}
          </label>
        ` : ''}
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
    this.dispatchEvent(new CustomEvent('textarea-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value }
    }));
  }
}

customElements.define('henry-textarea', HenryTextarea);
