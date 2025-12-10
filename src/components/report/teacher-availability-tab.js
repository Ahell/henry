import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";
import "../../features/teacher-availability/teacher-availability-table.js";

export class TeacherAvailabilityTab extends LitElement {
  static properties = {
    isPainting: { type: Boolean },
    teachers: { type: Array },
    slots: { type: Array },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    .description {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-4);
    }

    .paint-controls {
      display: flex;
      gap: var(--space-4);
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .paint-hint {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }

    .legend {
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
    }

    .legend-box {
      width: 20px;
      height: 20px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }
  `;

  constructor() {
    super();
    this.isPainting = false;
    this.teachers = [];
    this.slots = [];
    this._updateData();
    store.subscribe(() => {
      this._updateData();
      this.requestUpdate();
    });
  }

  _updateData() {
    this.teachers = store.getTeachers();
    this.slots = store.getSlots();
  }

  render() {
    if (this.slots.length === 0) {
      return html`<henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Lärartillgänglighet</henry-text>
        </div>
        <p>Inga tidsluckor tillgängliga.</p>
      </henry-panel>`;
    }

    return html`
      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Lärartillgänglighet</henry-text>
        </div>

        <p class="description">
          Klicka på "Markera upptagen" och måla sedan i cellerna för att markera
          när en lärare är upptagen. Blå celler visar schemalagda kurser.
        </p>

        <div class="paint-controls">
          <henry-button
            variant="${this.isPainting ? "success" : "secondary"}"
            @click="${this._togglePaintMode}"
          >
            ${this.isPainting ? "✓ Målningsläge aktivt" : "🖌️ Markera upptagen"}
          </henry-button>
          ${this.isPainting
            ? html`
                <span class="paint-hint">
                  Klicka eller dra över celler för att markera/avmarkera. Klicka
                  på knappen igen för att avsluta.
                </span>
              `
            : ""}
        </div>

        <div class="legend">
          <div class="legend-item">
            <div
              class="legend-box"
              style="background: var(--color-success);"
            ></div>
            <span>Tilldelad kurs</span>
          </div>
          <div class="legend-item">
            <div
              class="legend-box"
              style="background: var(--color-info);"
            ></div>
            <span>Kompatibel kurs (ej tilldelad)</span>
          </div>
          <div class="legend-item">
            <div
              class="legend-box"
              style="background: var(--color-danger);"
            ></div>
            <span>Upptagen/ej tillgänglig</span>
          </div>
        </div>

        <teacher-availability-table
          .teachers="${this.teachers}"
          .slots="${this.slots}"
          .isPainting="${this.isPainting}"
          @availability-changed="${this._handleAvailabilityChanged}"
          @paint-session-ended="${this._handlePaintSessionEnded}"
        ></teacher-availability-table>
      </henry-panel>
    `;
  }

  _togglePaintMode() {
    this.isPainting = !this.isPainting;
  }

  _handleAvailabilityChanged(e) {
    // Table component handles the store update, we just need to refresh
    this.requestUpdate();
  }

  _handlePaintSessionEnded() {
    // Optional: could add auto-save or notification here
    this.requestUpdate();
  }
}

customElements.define("teacher-availability-tab", TeacherAvailabilityTab);
