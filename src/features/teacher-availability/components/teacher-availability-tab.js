import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import "../../../components/ui/index.js";
import "./teacher-availability-table.js";
import { teacherAvailabilityTabStyles } from "../styles/teacher-availability-tab.styles.js";

export class TeacherAvailabilityTab extends LitElement {
  static properties = {
    isPainting: { type: Boolean },
    paintMode: { type: String },
    teachers: { type: Array },
    slots: { type: Array },
  };

  static styles = teacherAvailabilityTabStyles;

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
              ${this.isPainting
                ? "Avsluta målningsläge"
                : "Starta målningsläge"}
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
