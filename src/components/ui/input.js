import { LitElement, html, css } from 'lit';

/**
 * Primary Input Component
 * @property {String} label - Label text
 * @property {String} value - Input value
 * @property {String} type - Input type (text, number, date, etc.)
 * @property {Boolean} disabled - Disabled state
 * @property {Boolean} required - Required field
 * @property {String} placeholder - Placeholder text
 * @property {Number} min - Min value for number/date inputs
 * @property {Number} max - Max value for number/date inputs
 * @property {Number} step - Step value for number inputs
 */
export class HenryInput extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    type: { type: String },
    disabled: { type: Boolean },
    required: { type: Boolean },
    placeholder: { type: String },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number }
  };

  static styles = css`
    :host {
      display: block;
      margin-bottom: 16px;
    }

    .input-wrapper {
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

    input {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      transition: all 0.2s ease;
    }

    input:hover:not(:disabled) {
      border-color: #9ca3af;
    }

    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    input:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.6;
    }

    input::placeholder {
      color: #9ca3af;
    }
  `;

  constructor() {
    super();
    this.label = '';
    this.value = '';
    this.type = 'text';
    this.disabled = false;
    this.required = false;
    this.placeholder = '';
  }

  render() {
    return html`
      <div class="input-wrapper">
        ${this.label ? html`
          <label>
            ${this.label}
            ${this.required ? html`<span class="required">*</span>` : ''}
          </label>
        ` : ''}
        <input 
          type=${this.type}
          .value=${this.value}
          ?disabled=${this.disabled}
          ?required=${this.required}
          placeholder=${this.placeholder}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          @input=${this._handleInput}
        />
      </div>
    `;
  }

  _handleInput(e) {
    this.value = e.target.value;
    this.dispatchEvent(new CustomEvent('input-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value }
    }));
  }
}

customElements.define('henry-input', HenryInput);
