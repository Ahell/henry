import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";

/**
 * Teacher Info Modal Component
 * Read-only teacher details
 */
export class TeacherInfoModal extends LitElement {
  static properties = {
    teacherId: { type: Number },
    open: { type: Boolean },
  };

  constructor() {
    super();
    this.teacherId = null;
    this.open = false;
  }

  render() {
    if (!this.open || !this.teacherId) return html``;

    const teacher = store.getTeacher(this.teacherId);
    if (!teacher) return html``;

    const title = teacher.name || "Larare";

    const compatibleCourses = (store.getCourses() || [])
      .filter((c) => teacher.compatible_courses?.includes(c.course_id))
      .map((c) => c.code)
      .filter(Boolean);
    const compatibleText = compatibleCourses.length
      ? compatibleCourses.join(", ")
      : "Inga";

    const examinatorCourses = (store.getExaminatorCoursesForTeacher(teacher.teacher_id) || [])
      .map((c) => c.code)
      .filter(Boolean);
    const examinatorText = examinatorCourses.length
      ? examinatorCourses.join(", ")
      : "Inga";

    const homeDepartment = teacher.home_department || "-";

    const slotsById = new Map(
      (store.getSlots() || []).map((s) => [String(s.slot_id), s])
    );
    const formatSlotLabel = (slotId) => {
      if (slotId == null) return null;
      const slot = slotsById.get(String(slotId));
      return slot?.start_date || `Slot ${slotId}`;
    };
    const buildListText = (values, emptyText = "Inga") =>
      values.length ? values.join(", ") : emptyText;

    const assignedRuns = (store.getCourseRuns() || []).filter((run) => {
      if (!run) return false;
      const teacherKey = String(teacher.teacher_id);
      const isAssigned =
        Array.isArray(run.teachers) &&
        run.teachers.some((tid) => String(tid) === teacherKey);
      const isResponsible = String(run.kursansvarig_id) === teacherKey;
      return isAssigned || isResponsible;
    });

    const sortedRuns = assignedRuns.slice().sort((a, b) => {
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

      const isResponsible =
        String(run.kursansvarig_id) === String(teacher.teacher_id);
      const responsibleText = isResponsible ? "Ja" : "-";

      const examDates = slotIds
        .map((slotId) =>
          store.getExamDayForCourseInSlot(slotId, run.course_id)
        )
        .filter(Boolean);
      const examDateText = buildListText(
        Array.from(new Set(examDates)),
        "-"
      );

      return html`
        <div class="teacher-info-block">
          <div class="teacher-info-block-title">Tillfalle ${idx + 1}</div>
          <div class="teacher-info-row">
            <div class="teacher-info-label">Kurs</div>
            <div class="teacher-info-value">
              ${course.code || `Kurs ${run.course_id}`}
            </div>
          </div>
          <div class="teacher-info-row">
            <div class="teacher-info-label">Slotter</div>
            <div class="teacher-info-value">
              ${buildListText(slotLabels, "-")}
            </div>
          </div>
          <div class="teacher-info-row">
            <div class="teacher-info-label">Kullar</div>
            <div class="teacher-info-value">
              ${buildListText(cohortNames, "Inga")}
            </div>
          </div>
          <div class="teacher-info-row">
            <div class="teacher-info-label">Deltagare</div>
            <div class="teacher-info-value">${participantsText}</div>
          </div>
          <div class="teacher-info-row">
            <div class="teacher-info-label">Tentamensdatum</div>
            <div class="teacher-info-value">${examDateText}</div>
          </div>
          <div class="teacher-info-row">
            <div class="teacher-info-label">Kursansvarig</div>
            <div class="teacher-info-value">${responsibleText}</div>
          </div>
        </div>
      `;
    });

    return html`
      <henry-modal open title="${title}" @close="${this._handleClose}">
        <div class="teacher-info-grid">
          <div class="teacher-info-row">
            <div class="teacher-info-label">Namn</div>
            <div class="teacher-info-value">${teacher.name || "-"}</div>
          </div>
          <div class="teacher-info-row">
            <div class="teacher-info-label">Avdelning</div>
            <div class="teacher-info-value">${homeDepartment}</div>
          </div>
          <div class="teacher-info-row">
            <div class="teacher-info-label">Kompatibla kurser</div>
            <div class="teacher-info-value">${compatibleText}</div>
          </div>
          <div class="teacher-info-row">
            <div class="teacher-info-label">Examinator for</div>
            <div class="teacher-info-value">${examinatorText}</div>
          </div>
        </div>
        <div class="teacher-info-section">
          <div class="teacher-info-section-title">Schemalaggning</div>
          ${scheduleBlocks.length
            ? scheduleBlocks
            : html`<div class="teacher-info-empty">Inte schemalagd.</div>`}
        </div>
        <div slot="footer">
          <henry-button variant="secondary" @click="${this._handleClose}">
            Stang
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

customElements.define("teacher-info-modal", TeacherInfoModal);
