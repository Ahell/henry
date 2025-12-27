import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";

/**
 * Slot Info Modal Component
 * Read-only slot details
 */
export class SlotInfoModal extends LitElement {
  static properties = {
    slotId: { type: Number },
    open: { type: Boolean },
  };

  constructor() {
    super();
    this.slotId = null;
    this.open = false;
  }

  render() {
    if (!this.open || !this.slotId) return html``;

    const slot = store.getSlot(this.slotId);
    if (!slot) return html``;

    const slotOrder = (store.getSlots() || [])
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .findIndex((s) => s.slot_id === slot.slot_id);
    const title = slotOrder >= 0 ? `#${slotOrder + 1}` : `Slot ${slot.slot_id}`;
    const formatCompactDate = (value) => {
      if (!value) return "";
      const [datePart] = String(value).split("T");
      const parts = datePart.split("-");
      if (parts.length !== 3) return datePart;
      const [year, month, day] = parts;
      if (!year || !month || !day) return datePart;
      return `${year.slice(-2)}${month}${day}`;
    };

    const startDate = formatCompactDate(slot.start_date) || "-";
    const endDate = formatCompactDate(slot.end_date) || "-";
    const duration = this._getDurationDays(slot.start_date, slot.end_date);

    const runCoversSlotId = (run, slotId) => {
      if (!run || slotId == null) return false;
      if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
        return run.slot_ids.some((id) => String(id) === String(slotId));
      }
      return String(run.slot_id) === String(slotId);
    };

    const buildListText = (values, emptyText = "Inga") =>
      values.length ? values.join(", ") : emptyText;

    const runsInSlot = (store.getCourseRuns() || [])
      .filter((run) => runCoversSlotId(run, slot.slot_id))
      .filter(
        (run) =>
          Array.isArray(run?.cohorts) && run.cohorts.some((id) => id != null)
      );

    const sortedRuns = runsInSlot.slice().sort((a, b) => {
      const aCourse = store.getCourse(a.course_id);
      const bCourse = store.getCourse(b.course_id);
      const aCode = aCourse?.code || "";
      const bCode = bCourse?.code || "";
      if (aCode !== bCode) return String(aCode).localeCompare(String(bCode));
      return Number(a?.run_id || 0) - Number(b?.run_id || 0);
    });

    const scheduleBlocks = sortedRuns.map((run, idx) => {
      const course = store.getCourse(run.course_id) || {};
      const cohortIds = (Array.isArray(run?.cohorts) ? run.cohorts : [])
        .filter((id) => id != null)
        .map((id) => String(id));
      const uniqueCohortIds = Array.from(new Set(cohortIds));
      const cohortNames = uniqueCohortIds.map((id) => {
        const cohort = store.getCohort(Number(id));
        return cohort?.name || `Kull ${id}`;
      });
      const participants = uniqueCohortIds.reduce((sum, id) => {
        const cohort = store.getCohort(Number(id));
        return sum + (Number(cohort?.planned_size) || 0);
      }, 0);
      const participantsText = `${participants} st`;

      const teacherNames = (Array.isArray(run?.teachers) ? run.teachers : [])
        .filter((id) => id != null)
        .map((id) => store.getTeacher(id)?.name)
        .filter(Boolean);

      const kursansvarigName =
        run?.kursansvarig_id != null
          ? store.getTeacher(run.kursansvarig_id)?.name
          : null;

      const examDate = store.getExamDayForCourseInSlot(
        slot.slot_id,
        run.course_id
      );
      const examDateText = formatCompactDate(examDate) || "-";

      return html`
        <div class="slot-info-block">
          <div class="slot-info-block-title">Tillfälle ${idx + 1}</div>
          <div class="slot-info-row">
            <div class="slot-info-label">Kurs</div>
            <div class="slot-info-value">
              ${course.code || `Kurs ${run.course_id}`}
            </div>
          </div>
          <div class="slot-info-row">
            <div class="slot-info-label">Kullar</div>
            <div class="slot-info-value">
              ${buildListText(cohortNames, "Inga")}
            </div>
          </div>
          <div class="slot-info-row">
            <div class="slot-info-label">Deltagare</div>
            <div class="slot-info-value">${participantsText}</div>
          </div>
          <div class="slot-info-row">
            <div class="slot-info-label">Lärare</div>
            <div class="slot-info-value">
              ${buildListText(teacherNames, "Inga")}
            </div>
          </div>
          <div class="slot-info-row">
            <div class="slot-info-label">Tentamensdatum</div>
            <div class="slot-info-value">${examDateText}</div>
          </div>
          <div class="slot-info-row">
            <div class="slot-info-label">Kursansvarig</div>
            <div class="slot-info-value">${kursansvarigName || "-"}</div>
          </div>
        </div>
      `;
    });

    return html`
      <henry-modal open title="${title}" @close="${this._handleClose}">
        <div class="slot-info-grid">
          <div class="slot-info-row">
            <div class="slot-info-label">Startdatum</div>
            <div class="slot-info-value">${startDate}</div>
          </div>
          <div class="slot-info-row">
            <div class="slot-info-label">Slutdatum</div>
            <div class="slot-info-value">${endDate}</div>
          </div>
          <div class="slot-info-row">
            <div class="slot-info-label">Längd</div>
            <div class="slot-info-value">${duration}</div>
          </div>
        </div>
        <div class="slot-info-section">
          <div class="slot-info-section-title">Schemaläggning</div>
          ${scheduleBlocks.length
            ? scheduleBlocks
            : html`<div class="slot-info-empty">Inte schemalagd.</div>`}
        </div>
        <div slot="footer">
          <henry-button variant="secondary" @click="${this._handleClose}">
            Stäng
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  _getDurationDays(start, end) {
    if (!start || !end) return "-";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} dagar`;
  }

  _handleClose() {
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("slot-info-modal", SlotInfoModal);
