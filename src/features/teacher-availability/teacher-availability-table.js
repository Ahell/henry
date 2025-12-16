import { LitElement, html } from "lit";
import { store } from "../../utils/store.js";
import "./detail-view-header.js";
import "./teacher-cell.js";
import {
  renderDetailView,
  renderOverviewView,
} from "./teacher-availability-renderers.js";
import {
  handleCellMouseDown,
  handleCellMouseEnter,
  handlePaintEnd,
  handlePaintChangeRequest,
} from "./teacher-availability-paint-handlers.js";
import { teacherAvailabilityTableStyles } from "./teacher-availability-table.styles.js";
import "./overview-table.js";
import "./detail-table.js";
import "./availability-empty-state.js";

/**
 * TeacherAvailabilityTable - A specialized table component for displaying and managing teacher availability.
 * Features:
 * - Paint mode for marking unavailable time slots
 * - Visual indication of assigned courses, compatible courses, and unavailability
 * - Mouse drag support for efficient bulk marking
 * - Automatic conflict handling (removes teacher from runs when marked unavailable)
 */
export class TeacherAvailabilityTable extends LitElement {
  /**
   * TeacherAvailabilityTable acts as the owner of painting state for the table.
   * It listens for `paint-change-request` events and updates local state (and/or
   * the store) accordingly.
   */
  static properties = {
    teachers: { type: Array },
    slots: { type: Array },
    isPainting: { type: Boolean },
    _isMouseDown: { type: Boolean },
    _paintMode: { type: String }, // 'add' or 'remove'
    _detailSlotDate: { type: String }, // Set when in detail view for a specific slot
    _detailSlotId: { type: Number }, // The specific slot_id being viewed in detail
    _isEditingExamDate: { type: Boolean }, // Whether exam date editing is enabled
    _detailCourseFilter: { type: Number }, // Selected course_id filter for detail view (null = all)
  };

  constructor() {
    super();
    this.teachers = [];
    this.slots = [];
    this.isPainting = false;
    this._isMouseDown = false;
    this._paintMode = null;
    this._detailSlotDate = null;
    this._detailSlotId = null;
    this._isEditingExamDate = false;
    this._detailCourseFilter = null;
  }

  static styles = teacherAvailabilityTableStyles;

  connectedCallback() {
    super.connectedCallback();

    // Keep a bound listener so we can unsubscribe later
    this._onStoreChange = () => {
      this.teachers = store.getTeachers();
      this.slots = store.getSlots();
      this.requestUpdate();
    };

    // Subscribe to store changes and initialize values
    store.subscribe(this._onStoreChange);
    this._onStoreChange();

    // Listen for availability changes dispatched by paint handlers
    this._onAvailabilityChanged = this._onAvailabilityChanged.bind(this);
    this.addEventListener("availability-changed", this._onAvailabilityChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Unsubscribe our listener from the store (store exposes listeners array)
    if (this._onStoreChange) {
      const idx = store.listeners.indexOf(this._onStoreChange);
      if (idx !== -1) store.listeners.splice(idx, 1);
      this._onStoreChange = null;
    }
    // Remove availability listener
    this.removeEventListener(
      "availability-changed",
      this._onAvailabilityChanged
    );
  }

  async _onAvailabilityChanged(e) {
    try {
      const detail = e?.detail || {};
      const teacherId = detail.teacherId;
      const slotDate = detail.slotDate || detail.date;
      const unavailable = Boolean(detail.unavailable);

      if (!teacherId || !slotDate) return; // nothing we can persist

      // Map slotDate (start_date) to slot_id
      const slot = this.slots.find(
        (s) =>
          String(s.start_date) === String(slotDate) ||
          String(s.slot_id) === String(slotDate)
      );
      if (!slot) return;

      const slotId = slot.slot_id;
      const available = unavailable ? false : true;

      const payload = {};
      payload[`${teacherId}-${slotId}`] = available;

      await fetch("/api/teacher-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to persist teacher availability:", err);
    }
  }

  render() {
    const renderEmpty = (message) => html`
      <availability-empty-state message="${message}"></availability-empty-state>
    `;

    if (this.slots.length === 0) {
      return renderEmpty("Inga tidsluckor tillgängliga.");
    }

    if (this.teachers.length === 0) {
      return renderEmpty("Inga lärare tillgängliga.");
    }

    // If in detail view, render day-by-day view
    if (this._detailSlotDate) {
      return renderDetailView(this);
    }

    // Get unique slot start dates, sorted chronologically
    const slotDates = [...new Set(this.slots.map((s) => s.start_date))].sort();

    return renderOverviewView(this, slotDates);
  }

  updated(changedProps) {
    if (changedProps.has("isPainting") && !this.isPainting) {
      this._paintMode = null;
      this._isMouseDown = false;
    }
  }

  _handleCellMouseDown(e) {
    handleCellMouseDown(this, e);
  }

  _handleCellMouseEnter(e) {
    handleCellMouseEnter(this, e);
  }

  _handlePaintEnd() {
    handlePaintEnd(this);
  }

  // Handler for the `paint-change-request` event emitted by `paint-controls`.
  // The payload can contain { isPainting, paintMode } and may include only one
  // key — we update accordingly without overwriting unspecified values.
  _handlePaintChangeRequest(e) {
    handlePaintChangeRequest(this, e);
  }

  _handleCourseFilterChange(e) {
    const nextFilter =
      e?.detail?.courseId === "all" ? null : Number(e?.detail?.courseId);
    this._detailCourseFilter = Number.isNaN(nextFilter) ? null : nextFilter;
    // Ladda om data från backend så aktuell vy reflekterar sparade ändringar
    store
      .refreshFromBackend()
      .catch((err) => console.error("Failed to refresh store:", err))
      .finally(() => this.requestUpdate());
  }
}

customElements.define("teacher-availability-table", TeacherAvailabilityTable);
