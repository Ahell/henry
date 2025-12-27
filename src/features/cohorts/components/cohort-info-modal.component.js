import { LitElement, html } from "lit";
import { store, DEFAULT_SLOT_LENGTH_DAYS } from "../../../platform/store/DataStore.js";

/**
 * Cohort Info Modal Component
 * Read-only cohort details
 */
export class CohortInfoModal extends LitElement {
  static properties = {
    cohortId: { type: Number },
    open: { type: Boolean },
  };

  constructor() {
    super();
    this.cohortId = null;
    this.open = false;
  }

  render() {
    if (!this.open || !this.cohortId) return html``;

    const cohort = store.getCohort(this.cohortId);
    if (!cohort) return html``;

    const title = cohort.name || `Kull ${cohort.cohort_id}`;

    const participants = Number(cohort.planned_size) || 0;
    const participantsText = `${participants} st`;

    const slotsById = new Map(
      (store.getSlots() || []).map((s) => [String(s.slot_id), s])
    );
    const slotOrderById = new Map(
      (store.getSlots() || [])
        .slice()
        .sort((a, b) =>
          String(a?.start_date || "").localeCompare(String(b?.start_date || ""))
        )
        .map((slot, idx) => [String(slot.slot_id), idx + 1])
    );
    const formatCompactDate = (value) => {
      if (!value) return "";
      const [datePart] = String(value).split("T");
      const parts = datePart.split("-");
      if (parts.length !== 3) return datePart;
      const [year, month, day] = parts;
      if (!year || !month || !day) return datePart;
      return `${year.slice(-2)}${month}${day}`;
    };
    const formatExamDate = (value) => formatCompactDate(value) || "-";
    const formatSlotRange = (slot) => {
      const startDate = slot?.start_date;
      if (!startDate) return null;
      const start = new Date(startDate);
      if (Number.isNaN(start.getTime())) return startDate;
      if (slot?.end_date) {
        return `${formatCompactDate(startDate)}-${formatCompactDate(
          slot.end_date
        )}`;
      }
      const end = new Date(start);
      end.setDate(end.getDate() + DEFAULT_SLOT_LENGTH_DAYS);
      return `${formatCompactDate(startDate)}-${formatCompactDate(
        end.toISOString().split("T")[0]
      )}`;
    };
    const formatSlotLabel = (slotId) => {
      if (slotId == null) return null;
      const slot = slotsById.get(String(slotId));
      const order = slotOrderById.get(String(slotId));
      const prefix = order ? `#${order} ` : "";
      return `${prefix}${formatSlotRange(slot) || `Slot ${slotId}`}`;
    };
    const buildListText = (values, emptyText = "Inga") =>
      values.length ? values.join(", ") : emptyText;

    const runsForCohort = (store.getCourseRuns() || []).filter((run) => {
      if (!run) return false;
      const ids = Array.isArray(run.cohorts) ? run.cohorts : [];
      return ids.some((id) => String(id) === String(cohort.cohort_id));
    });

    const sortedRuns = runsForCohort.slice().sort((a, b) => {
      const aSlotId =
        Array.isArray(a?.slot_ids) && a.slot_ids.length > 0
          ? a.slot_ids[0]
          : a?.slot_id;
      const bSlotId =
        Array.isArray(b?.slot_ids) && b.slot_ids.length > 0
          ? b.slot_ids[0]
          : b?.slot_id;
      const aDate = slotsById.get(String(aSlotId))?.start_date || "";
      const bDate = slotsById.get(String(bSlotId))?.start_date || "";
      if (aDate !== bDate) return String(aDate).localeCompare(String(bDate));
      return Number(a?.run_id || 0) - Number(b?.run_id || 0);
    });

    const scheduleBlocks = sortedRuns.map((run, idx) => {
      const course = store.getCourse(run.course_id) || {};
      const slotIds =
        Array.isArray(run?.slot_ids) && run.slot_ids.length > 0
          ? run.slot_ids
          : [run?.slot_id];
      const slotLabels = slotIds
        .map((id) => formatSlotLabel(id))
        .filter(Boolean);

      const teacherNames = (Array.isArray(run?.teachers) ? run.teachers : [])
        .filter((id) => id != null)
        .map((id) => store.getTeacher(id)?.name)
        .filter(Boolean);

      const kursansvarigName =
        run?.kursansvarig_id != null
          ? store.getTeacher(run.kursansvarig_id)?.name
          : null;

      const examDates = slotIds
        .map((slotId) => store.getExamDayForCourseInSlot(slotId, run.course_id))
        .filter(Boolean);
      const examDateText = buildListText(
        Array.from(new Set(examDates)).map(formatExamDate),
        "-"
      );

      return html`
        <div class="cohort-info-block">
          <div class="cohort-info-block-title">Tillfälle ${idx + 1}</div>
          <div class="cohort-info-row">
            <div class="cohort-info-label">Kurskod</div>
            <div class="cohort-info-value">
              ${course.code || `Kurs ${run.course_id}`}
            </div>
          </div>
          <div class="cohort-info-row">
            <div class="cohort-info-label">Kursnamn</div>
            <div class="cohort-info-value">${course.name || "-"}</div>
          </div>
          <div class="cohort-info-row">
            <div class="cohort-info-label">Kursperioder</div>
            <div class="cohort-info-value">
              ${buildListText(slotLabels, "-")}
            </div>
          </div>
          <div class="cohort-info-row">
            <div class="cohort-info-label">Deltagare</div>
            <div class="cohort-info-value">${participantsText}</div>
          </div>
          <div class="cohort-info-row">
            <div class="cohort-info-label">Lärare</div>
            <div class="cohort-info-value">
              ${buildListText(teacherNames, "Inga")}
            </div>
          </div>
          <div class="cohort-info-row">
            <div class="cohort-info-label">Tentamensdatum</div>
            <div class="cohort-info-value">${examDateText}</div>
          </div>
          <div class="cohort-info-row">
            <div class="cohort-info-label">Kursansvarig</div>
            <div class="cohort-info-value">${kursansvarigName || "-"}</div>
          </div>
        </div>
      `;
    });

    return html`
      <henry-modal open title="${title}" @close="${this._handleClose}">
        <div class="cohort-info-grid">
          <div class="cohort-info-row">
            <div class="cohort-info-label">Kull</div>
            <div class="cohort-info-value">${cohort.name || "-"}</div>
          </div>
          <div class="cohort-info-row">
            <div class="cohort-info-label">Startdatum</div>
            <div class="cohort-info-value">
              ${formatCompactDate(cohort.start_date) || "-"}
            </div>
          </div>
          <div class="cohort-info-row">
            <div class="cohort-info-label">Deltagare</div>
            <div class="cohort-info-value">${participantsText}</div>
          </div>
        </div>
        <div class="cohort-info-section">
          <div class="cohort-info-section-title">Schemaläggning</div>
          ${scheduleBlocks.length
            ? scheduleBlocks
            : html`<div class="cohort-info-empty">Inte schemalagd.</div>`}
        </div>
        <div slot="footer">
          <henry-button variant="secondary" @click="${this._handleClose}">
            Stäng
          </henry-button>
        </div>
      </henry-modal>
    `;
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

customElements.define("cohort-info-modal", CohortInfoModal);
