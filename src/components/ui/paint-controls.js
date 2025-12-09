import { LitElement, html, css } from 'lit';
import './button.js';

export class PaintControls extends LitElement {
  static properties = {
    isPainting: { type: Boolean },
    paintMode: { type: String }
  };

  static styles = css`
    :host { display:block; margin-bottom: var(--space-4); }
    .controls { display:flex; gap:var(--space-2); align-items:center; }
  `;

  constructor() {
    super();
    this.isPainting = false;
    this.paintMode = null;
  }

  render() {
    return html`
      <div class="controls">
        <henry-button
          variant="${this.isPainting ? 'primary' : 'outline'}"
          size="small"
          @click=${this._togglePaint}
        >
          ${this.isPainting ? '🎨 Sluta måla' : '🎨 Måla'}
        </henry-button>

        <henry-button
          variant="${this.paintMode === 'add' ? 'primary' : 'outline'}"
          size="small"
          @click=${() => this._setMode('add')}
        >
          ➕ Lägg till
        </henry-button>

        <henry-button
          variant="${this.paintMode === 'remove' ? 'primary' : 'outline'}"
          size="small"
          @click=${() => this._setMode('remove')}
        >
          ✖ Ta bort
        </henry-button>

        <div style="color:var(--color-text-secondary);font-size:var(--font-size-xs)">
          ${this.isPainting ? (this.paintMode ? `Mode: ${this.paintMode}` : 'Mode: auto') : ''}
        </div>
      </div>
    `;
  }

  _togglePaint() {
    this.isPainting = !this.isPainting;
    // If turning off, clear mode
    if (!this.isPainting) this.paintMode = null;
    this.dispatchEvent(new CustomEvent('paint-toggle', { detail: { isPainting: this.isPainting }, bubbles: true, composed: true }));
  }

  _setMode(mode) {
    if (this.paintMode === mode) {
      this.paintMode = null; // toggle off
    } else {
      this.paintMode = mode;
      this.isPainting = true; // ensure painting is enabled
    }
    this.dispatchEvent(new CustomEvent('paint-set-mode', { detail: { paintMode: this.paintMode }, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('paint-toggle', { detail: { isPainting: this.isPainting }, bubbles: true, composed: true }));
  }
}

customElements.define('paint-controls', PaintControls);
