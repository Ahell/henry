import { LitElement, html, css } from "lit";
import { store } from "../../core/store/DataStore.js";
import "../ui/index.js";
import "../../features/teacher-availability/index.js";

export class TeacherAvailabilityTab extends LitElement {
  static properties = {
    isPainting: { type: Boolean },
    paintMode: { type: String },
    teachers: { type: Array },
    slots: { type: Array },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      gap: var(--space-6);
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .header-text {
      flex: 1;
      min-width: 260px;
    }

    .description {
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
      margin: var(--space-2) 0 0;
      line-height: var(--line-height-normal);
    }

    .header-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      align-items: flex-end;
      min-width: 240px;
    }

    .paint-status {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      text-align: right;
      max-width: 320px;
    }

    .layout-stack {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .legend-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .legend-chip {
      display: inline-flex;
      gap: var(--space-2);
      align-items: center;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-full);
      background: var(--color-gray-50);
      border: 1px solid var(--color-border);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: var(--radius-full);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
    }

    .legend-left {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
      align-items: center;
    }

    .legend-right {
      display: inline-flex;
      gap: var(--space-2);
      flex-wrap: wrap;
      align-items: center;
    }
  `;

  constructor() {
    super();
    this.isPainting = false;
    this.paintMode = null;
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

    const slotCount = new Set(this.slots.map((s) => s.start_date)).size;
    const slotLabel =
      slotCount === 1 ? "1 period" : `${slotCount} perioder/tidsluckor`;
    const paintStatus = "";

    return html`
      <henry-panel>
        <div slot="header" class="panel-header">
          <div class="header-text">
            <henry-text variant="heading-3">Lärartillgänglighet</henry-text>
          </div>
          <div class="header-actions">
            <henry-button
              variant="${this.isPainting ? "success" : "primary"}"
              @click="${this._togglePaintMode}"
            >
              ${this.isPainting ? "Avsluta målningsläge" : "Starta målningsläge"}
            </henry-button>
            <div class="paint-status"></div>
          </div>
        </div>

        <div class="layout-stack">
          <div class="legend-row">
            <div class="legend-left">${this._renderLegend()}</div>
            <div class="legend-right">
              <span class="legend-chip">${this.teachers.length} lärare</span>
              <span class="legend-chip">${slotLabel}</span>
            </div>
          </div>

          <teacher-availability-table
            .teachers=${this.teachers}
            .slots=${this.slots}
            .isPainting=${this.isPainting}
            @availability-changed="${this._handleAvailabilityChanged}"
            @paint-session-ended="${this._handlePaintSessionEnded}"
            @paint-state-changed="${this._handlePaintStateChanged}"
          ></teacher-availability-table>
        </div>
      </henry-panel>
    `;
  }

  _renderLegend() {
    const items = [
      {
        label: "Tilldelad kurs",
        meta: "Läraren har redan ett uppdrag i perioden",
        color: "var(--color-success)",
      },
      {
        label: "Kompatibel kurs",
        meta: "Matchar lärarens kompetens men ej tilldelad",
        color: "var(--color-info)",
      },
      {
        label: "Upptagen/ej tillgänglig",
        meta: "Markerat i målningsläget",
        color: "var(--color-danger)",
      },
    ];

    return items.map(
      (item) => html`
        <span class="legend-chip">
          <span
            class="legend-dot"
            style="background:${item.color};"
            aria-hidden="true"
          ></span>
          ${item.label}
        </span>
      `
    );
  }

  _togglePaintMode() {
    const next = !this.isPainting;
    this.isPainting = next;
    if (!next) {
      this.paintMode = null;
    }
  }

  _handleAvailabilityChanged() {
    // Table component handles the store update, we just need to refresh
    this.requestUpdate();
  }

  _handlePaintSessionEnded() {
    // Optional: could add auto-save or notification here
    this.requestUpdate();
  }

  _handlePaintStateChanged(e) {
    const detail = e?.detail || {};
    this.isPainting = !!detail.isPainting;
    this.paintMode = detail.paintMode || null;
  }
}

customElements.define("teacher-availability-tab", TeacherAvailabilityTab);
