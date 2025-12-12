import { LitElement, html, css } from "lit";
import "./button.js";

const getPaintStatusText = (isPainting, paintMode) => {
  if (!isPainting) return "";
  if (paintMode === "add") return "Mode: lägg till";
  if (paintMode === "remove") return "Mode: ta bort";
  return "Mode: auto";
};

/**
 * PaintControls is a controlled component: it accepts `isPainting` and `paintMode`
 * as properties and emits a `paint-change-request` event (detail { isPainting, paintMode })
 * when the user intents to change painting state. It does not mutate its own props.
 *
 * Events:
 * - paint-change-request: { isPainting: boolean, paintMode: string|null }
 */
export class PaintControls extends LitElement {
  static properties = {
    isPainting: { type: Boolean },
    paintMode: { type: String },
  };

  constructor() {
    super();
    this.isPainting = false;
    this.paintMode = null;
  }

  static styles = css`
    :host {
      display: block;
      margin-bottom: var(--space-4);
    }
    .controls {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }
    .status {
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs);
    }
  `;

  render() {
    const statusText = getPaintStatusText(this.isPainting, this.paintMode);
    const buttons = [
      {
        key: "paint-toggle",
        variant: this.isPainting ? "primary" : "outline",
        label: this.isPainting ? "Sluta måla" : "Måla",
        onClick: this.requestPaintToggle,
      },
      {
        key: "add",
        variant: this.paintMode === "add" ? "primary" : "outline",
        label: "Lägg till",
        onClick: this._onAddClick,
      },
      {
        key: "remove",
        variant: this.paintMode === "remove" ? "primary" : "outline",
        label: "Ta bort",
        onClick: this._onRemoveClick,
      },
    ];

    return html`
      <div class="controls">
        ${buttons.map(
          (button) => html`
            <henry-button
              variant=${button.variant}
              size="small"
              @click=${button.onClick}
            >
              ${button.label}
            </henry-button>
          `
        )}

        <div class="status">${statusText}</div>
      </div>
    `;
  }

  requestPaintToggle() {
    // Controlled component: compute the next state and emit a single change event
    const nextIsPainting = !this.isPainting;
    const nextMode = nextIsPainting ? this.paintMode : null;
    this.dispatchPaintChange(nextIsPainting, nextMode);
  }

  requestModeChange(mode) {
    // Controlled component: compute requested state and emit a single change event
    const nextMode = this.paintMode === mode ? null : mode;
    // If there's no mode (null) we should not be painting — painting is enabled
    // only when a mode (add/remove) is selected.
    const nextIsPainting = !!nextMode;
    this.dispatchPaintChange(nextIsPainting, nextMode);
  }

  dispatchPaintChange(isPainting, paintMode) {
    this.dispatchEvent(
      new CustomEvent("paint-change-request", {
        detail: { isPainting, paintMode },
        bubbles: true,
        composed: true,
      })
    );
  }

  _onAddClick() {
    this.requestModeChange("add");
  }

  _onRemoveClick() {
    this.requestModeChange("remove");
  }
}

customElements.define("paint-controls", PaintControls);
