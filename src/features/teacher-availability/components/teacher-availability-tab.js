import { LitElement, html } from "lit";
import {
  store,
  DEFAULT_SLOT_LENGTH_DAYS,
} from "../../../platform/store/DataStore.js";
import { getRunsCoveringSlotId } from "../services/run-coverage.js";
import "../../../components/ui/index.js";
import "./teacher-availability-table.js";
import { teacherAvailabilityTabStyles } from "../styles/teacher-availability-tab.styles.js";

export class TeacherAvailabilityTab extends LitElement {
  static properties = {
    isPainting: { type: Boolean },
    paintMode: { type: String },
    teachers: { type: Array },
    slots: { type: Array },
    _isDetailView: { type: Boolean },
    _detailSlotId: { type: Number },
    _detailSlotDate: { type: String },
    _detailCourseFilter: { type: Number },
    _applyToAllCourses: { type: Boolean },
  };

  static styles = teacherAvailabilityTabStyles;

  constructor() {
    super();
    this.isPainting = !!store.editMode;
    this.paintMode = null;
    this.teachers = [];
    this.slots = [];
    this._isDetailView = false;
    this._detailSlotId = null;
    this._detailSlotDate = null;
    this._detailCourseFilter = null;
    this._applyToAllCourses = true;
    this._updateData();
    store.subscribe(() => {
      const next = !!store.editMode;
      if (this.isPainting !== next) {
        this.isPainting = next;
        if (!next) this.paintMode = null;
      }
      this._updateData();
      this.requestUpdate();
    });
  }

  _scrollToToday() {
    const tableEl = this.shadowRoot?.querySelector("teacher-availability-table");
    const tableRoot = tableEl?.shadowRoot;
    const container = tableRoot?.querySelector(".table-container");
    if (!container) return;

    // Prefer measuring actual rendered column width (works for both overview + detail view).
    const columnWidthPx = (() => {
      const th = container.querySelector(
        ".teacher-timeline-table thead th.slot-header"
      );
      const w = th?.getBoundingClientRect?.().width;
      return Number.isFinite(w) && w > 0 ? w : 120;
    })();

    const today = (() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    })();

    const dates = (() => {
      if (this._isDetailView && this._detailSlotId != null) {
        const days = store.getSlotDays(this._detailSlotId) || [];
        return days.filter(Boolean).sort();
      }
      return [...new Set((store.getSlots() || []).map((s) => s.start_date))]
        .filter(Boolean)
        .sort();
    })();

    if (dates.length === 0) return;

    let targetIdx = 0;
    for (let i = 0; i < dates.length; i += 1) {
      const d = this._parseDateOnly(dates[i]);
      if (d && d <= today) targetIdx = i;
    }

    const beforeIdx = Math.max(0, targetIdx - 1);
    const left = Math.max(0, beforeIdx * columnWidthPx);

    requestAnimationFrame(() => {
      container.scrollLeft = left;
    });
  }

  _parseDateOnly(dateStr) {
    if (typeof dateStr !== "string") return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    ) {
      return null;
    }
    return new Date(year, month - 1, day);
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

    const daysLabel = this._getDaysLabel();
    const paintStatus = "";

    return html`
      <henry-panel>
        <div slot="header" class="panel-header">
          <div class="header-text">
            <henry-text variant="heading-3"
              >${this._isDetailView
                ? "Lärartillgänglighet inom kursperiod"
                : "Lärartillgänglighet"}</henry-text
            >
          </div>
          <div class="header-actions">
            <div class="paint-status"></div>
            <div class="header-buttons">
              <henry-button
                variant="primary"
                @click=${this._isDetailView
                  ? () => this._exitDetailView()
                  : () => this._scrollToToday()}
              >
                ${this._isDetailView ? "Avsluta detaljläge" : "Idag"}
              </henry-button>
            </div>
          </div>
        </div>

        <div class="layout-stack">
          <div class="legend-row">
            <div class="legend-left">
              ${this._isDetailView ? this._renderDetailControls() : null}
              ${this._renderLegend(this._isDetailView)}
            </div>
            <div class="legend-right">
              <span class="legend-chip">${this.teachers.length} lärare</span>
              <span class="legend-chip">${daysLabel}</span>
            </div>
          </div>

          <teacher-availability-table
            .teachers=${this.teachers}
            .slots=${this.slots}
            .isPainting=${this.isPainting}
            @availability-changed="${this._handleAvailabilityChanged}"
            @paint-session-ended="${this._handlePaintSessionEnded}"
            @paint-state-changed="${this._handlePaintStateChanged}"
            @detail-view-changed="${this._handleDetailViewChanged}"
          ></teacher-availability-table>
        </div>
      </henry-panel>
    `;
  }

  _getDetailCourses() {
    if (!this._isDetailView || this._detailSlotId == null) return [];

    const runs = getRunsCoveringSlotId(store.getCourseRuns(), this._detailSlotId);
    const byCourseId = new Map();
    runs.forEach((run) => {
      const courseId = run?.course_id;
      if (courseId == null) return;
      const course = store.getCourse(courseId);
      if (!course?.code) return;
      byCourseId.set(Number(courseId), {
        course_id: Number(courseId),
        code: course.code,
        name: course.name || "",
      });
    });

    return Array.from(byCourseId.values()).sort((a, b) =>
      String(a.code || "").localeCompare(String(b.code || ""), "sv-SE")
    );
  }

  _renderDetailControls() {
    const courses = this._getDetailCourses();
    const showCourseSelect = courses.length > 1;
    const showApplyToAll =
      courses.length > 1 && (this._detailCourseFilter == null);

    if (!showCourseSelect && !showApplyToAll) return null;

    return html`
      ${showCourseSelect
        ? html`
            <label class="legend-chip select-chip" title="Filtrera kurs i detaljvy">
              <span class="select-label">Kurser</span>
              <select
                @change=${this._handleDetailCourseFilterChange}
                .value=${this._detailCourseFilter ?? "all"}
              >
                <option value="all">Alla kurser</option>
                ${courses.map(
                  (c) =>
                    html`<option value=${c.course_id}>
                      ${c.code || c.name || c.course_id}
                    </option>`
                )}
              </select>
            </label>
          `
        : null}

      ${showApplyToAll
        ? html`
            <henry-switch
              label="Applicera på alla kurser"
              label-position="right"
              .checked=${this._applyToAllCourses}
              @switch-change=${this._handleApplyToAllCoursesChange}
            ></henry-switch>
          `
        : null}
    `;
  }

  _syncDetailControlsToTable() {
    const table = this.renderRoot?.querySelector?.("teacher-availability-table");
    if (!table) return;
    if (table.setDetailCourseFilter) {
      table.setDetailCourseFilter(this._detailCourseFilter ?? "all");
    }
    if (table.setApplyToAllCourses) {
      table.setApplyToAllCourses(this._applyToAllCourses);
    }
  }

  _handleDetailCourseFilterChange(e) {
    const raw = e?.target?.value ?? "all";
    const next = raw === "all" ? null : Number(raw);
    this._detailCourseFilter = Number.isNaN(next) ? null : next;
    this._syncDetailControlsToTable();
  }

  _handleApplyToAllCoursesChange(e) {
    this._applyToAllCourses = !!e?.detail?.checked;
    this._syncDetailControlsToTable();
  }

  _exitDetailView() {
    const table = this.renderRoot?.querySelector?.("teacher-availability-table");
    if (table?.exitDetailView) {
      table.exitDetailView();
      return;
    }

    // Fallback: just update local state if the table isn't available yet.
    this._isDetailView = false;
    this._detailSlotId = null;
    this._detailSlotDate = null;
    this._detailCourseFilter = null;
    this._applyToAllCourses = true;
    this.requestUpdate();
  }

  _getDaysLabel() {
    const slotId =
      this._isDetailView && this._detailSlotId != null
        ? this._detailSlotId
        : this.slots?.[0]?.slot_id;
    const days = slotId != null ? store.getSlotDays(slotId) : [];
    const count =
      Array.isArray(days) && days.length
        ? days.length
        : DEFAULT_SLOT_LENGTH_DAYS;
    return `${count} dagar`;
  }

  _renderLegend(isDetailView) {
    if (isDetailView) {
      const items = [
        {
          label: "Tilldelad",
          meta: "Läraren är tilldelad kursen",
          swatchClass: "legend-swatch--assigned",
        },
        {
          label: "Kompatibel",
          meta: "Läraren är kompatibel med kursen",
          swatchClass: "legend-swatch--compatible",
        },
        {
          label: "Otillgänglig",
          meta: "Läraren är markerad som upptagen",
          swatchClass: "legend-swatch--unavailable",
        },
      ];

      return items.map(
        (item) => html`
          <span class="legend-chip" title=${item.meta || ""}>
            <span
              class="legend-swatch ${item.swatchClass}"
              aria-hidden="true"
            ></span>
            ${item.label}
          </span>
        `
      );
    }

    const items = [
      {
        label: "Tilldelad",
        meta: "Tilldelad till kursen",
        swatchClass: "legend-swatch--assigned",
      },
      {
        label: "Kompatibel (ledig)",
        meta: "Kompatibel och inte upptagen av annan kurs i slotten",
        swatchClass: "legend-swatch--compatible",
      },
      {
        label: "Kompatibel (upptagen)",
        meta: "Kompatibel men upptagen av annan kurs i slotten",
        swatchClass: "legend-swatch--compatible-occupied",
      },
      {
        label: "Krock (delvis)",
        meta: "Otillgänglig på vissa aktiva kursdagar (röda ränder)",
        swatchClass: "legend-swatch--partial-conflict",
      },
      {
        label: "Otillgänglig (kurs)",
        meta: "Otillgänglig på alla aktiva kursdagar (starka röda ränder)",
        swatchClass: "legend-swatch--course-unavailable",
      },
      {
        label: "Info (utanför)",
        meta: "Otillgänglighet finns i perioden men inte på kursens aktiva dagar (blå ränder)",
        swatchClass: "legend-swatch--partial-availability",
      },
      {
        label: "Delvis otillg.",
        meta: "Ingen kurs i slotten: läraren är upptagen vissa dagar (röda ränder utan fyllning)",
        swatchClass: "legend-swatch--no-course-partial",
      },
      {
        label: "Otillg. (slot)",
        meta: "Ingen kurs i slotten: läraren är upptagen alla dagar",
        swatchClass: "legend-swatch--unavailable",
      },
    ];

    return items.map(
      (item) => html`
        <span class="legend-chip" title=${item.meta || ""}>
          <span
            class="legend-swatch ${item.swatchClass}"
            aria-hidden="true"
          ></span>
          ${item.label}
        </span>
      `
    );
  }

  _handleEditAvailabilityToggle(e) {
    const next =
      typeof e?.detail?.checked === "boolean"
        ? !!e.detail.checked
        : !this.isPainting;
    this.setEditMode(next);
  }

  setEditMode(enabled) {
    this.isPainting = !!enabled;
    if (!enabled) this.paintMode = null;
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
    // Keep isPainting controlled by global edit mode (store.editMode).
    this.isPainting = !!store.editMode;
    this.paintMode = detail.paintMode || null;
  }

  _handleDetailViewChanged(e) {
    const detail = e?.detail || {};
    this._isDetailView = !!detail.active;
    this._detailSlotId = detail.slotId != null ? Number(detail.slotId) : null;
    this._detailSlotDate = detail.slotDate || null;
    if (this._isDetailView) {
      this._detailCourseFilter = null;
      this._applyToAllCourses = true;
      this.updateComplete.then(() => this._syncDetailControlsToTable());
    } else {
      this._detailCourseFilter = null;
      this._applyToAllCourses = true;
    }
    this.requestUpdate();
  }
}

customElements.define("teacher-availability-tab", TeacherAvailabilityTab);
