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
            <henry-switch
              label="Redigera tillgänglighet"
              label-position="left"
              .checked=${this.isPainting}
              @switch-change=${this._handleEditAvailabilityToggle}
            ></henry-switch>
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
        meta: "Läraren är tilldelad kursen i perioden",
        swatchClass: "legend-swatch--assigned",
      },
      {
        label: "Kompatibel kurs",
        meta: "Matchar lärarens kompetens men ej tilldelad",
        swatchClass: "legend-swatch--compatible",
      },
      {
        label: "Otillgänglig (hela kursen)",
        meta: "Alla aktiva kursdagar i perioden är otillgängliga",
        swatchClass: "legend-swatch--unavailable",
      },
      {
        label: "Krock (delvis)",
        meta: "Otillgänglighet överlappar vissa aktiva kursdagar",
        swatchClass: "legend-swatch--partial-conflict",
      },
      {
        label: "Info (utanför kursdagar)",
        meta:
          "Otillgänglighet finns i perioden men inte på kursens aktiva kursdagar",
        swatchClass: "legend-swatch--partial-availability",
      },
    ];

    return items.map(
      (item) => html`
        <span class="legend-chip" title=${item.meta || ""}>
          <span class="legend-swatch ${item.swatchClass}" aria-hidden="true"></span>
          ${item.label}
        </span>
      `
    );
  }

  _handleEditAvailabilityToggle(e) {
    const next = !!e?.detail?.checked;
    this.isPainting = next;
    if (!next) this.paintMode = null;
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
