import { LitElement, html, css } from 'lit';

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
    placeholder: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      margin-bottom: 16px;
    }

    .select-wrapper {
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

    select {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    select:hover:not(:disabled) {
      border-color: #9ca3af;
    }

    select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    select:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.6;
    }

    select option {
      padding: 8px;
    }
  `;

  constructor() {
    super();
    this.label = '';
    this.value = '';
    this.disabled = false;
    this.required = false;
    this.placeholder = 'Välj...';
  }

  render() {
    return html`
      <div class="select-wrapper">
        ${this.label ? html`
          <label>
            ${this.label}
            ${this.required ? html`<span class="required">*</span>` : ''}
          </label>
        ` : ''}
        <select 
          .value=${this.value}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @change=${this._handleChange}
        >
          ${this.placeholder ? html`<option value="">${this.placeholder}</option>` : ''}
          <slot></slot>
        </select>
      </div>
    `;
  }

  _handleChange(e) {
    this.value = e.target.value;
    this.dispatchEvent(new CustomEvent('select-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value }
    }));
  }
}

customElements.define('henry-select', HenrySelect);
