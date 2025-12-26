import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";

/**
 * Course Info Modal Component
 * Read-only course details
 */
export class CourseInfoModal extends LitElement {
  static properties = {
    courseId: { type: Number },
    open: { type: Boolean },
  };

  constructor() {
    super();
    this.courseId = null;
    this.open = false;
  }

  render() {
    if (!this.open || !this.courseId) return html``;

    const course = store.getCourse(this.courseId);
    if (!course) return html``;

    const titleParts = [course.code, course.name].filter(Boolean);
    const title = titleParts.length ? titleParts.join(" - ") : "Kursinfo";

    const prerequisites = (course.prerequisites || [])
      .map((id) => store.getCourse(id))
      .filter(Boolean);
    const prereqText = prerequisites.length
      ? prerequisites.map((c) => c.code).join(", ")
      : "Inga";

    const compatibleTeachers = (store.getTeachers() || [])
      .filter((t) => t.compatible_courses?.includes(course.course_id))
      .map((t) => t.name)
      .filter(Boolean);
    const compatibleText = compatibleTeachers.length
      ? compatibleTeachers.join(", ")
      : "Inga";

    const examinatorId = store.getCourseExaminatorTeacherId(course.course_id);
    const examinatorName = examinatorId != null
      ? store.getTeacher(examinatorId)?.name
      : null;


    const credits =
      course.credits != null ? `${course.credits} hp` : "-";

    const slotsById = new Map(
      (store.getSlots() || []).map((s) => [String(s.slot_id), s])
    );
    const courseRuns = (store.getCourseRuns() || []).filter(
      (r) => String(r?.course_id) === String(course.course_id)
    );
    const sortedRuns = courseRuns.slice().sort((a, b) => {
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
    const formatSlotLabel = (slotId) => {
      if (slotId == null) return null;
      const slot = slotsById.get(String(slotId));
      return slot?.start_date || `Slot ${slotId}`;
    };
    const buildListText = (values, emptyText = "Inga") =>
      values.length ? values.join(", ") : emptyText;

    const scheduleBlocks = sortedRuns.map((run, idx) => {
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

      const teacherNames = (Array.isArray(run?.teachers) ? run.teachers : [])
        .filter((id) => id != null)
        .map((id) => store.getTeacher(id)?.name)
        .filter(Boolean);

      const runKursansvarigName =
        run?.kursansvarig_id != null
          ? store.getTeacher(run.kursansvarig_id)?.name
          : null;
      const examDates = slotIds
        .map((slotId) =>
          store.getExamDayForCourseInSlot(slotId, course.course_id)
        )
        .filter(Boolean);
      const examDateText = buildListText(
        Array.from(new Set(examDates)),
        "-"
      );

      return html`
        <div class="course-info-block">
          <div class="course-info-block-title">Tillfalle ${idx + 1}</div>
          <div class="course-info-row">
            <div class="course-info-label">Slotter</div>
            <div class="course-info-value">
              ${buildListText(slotLabels, "-")}
            </div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Kullar</div>
            <div class="course-info-value">
              ${buildListText(cohortNames, "Inga")}
            </div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Deltagare</div>
            <div class="course-info-value">${participantsText}</div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Larare</div>
            <div class="course-info-value">
              ${buildListText(teacherNames, "Inga")}
            </div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Tentamensdatum</div>
            <div class="course-info-value">${examDateText}</div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Kursansvarig</div>
            <div class="course-info-value">${runKursansvarigName || "-"}</div>
          </div>
        </div>
      `;
    });

    return html`
      <henry-modal open title="${title}" @close="${this._handleClose}">
        <div class="course-info-grid">
          <div class="course-info-row">
            <div class="course-info-label">Kurskod</div>
            <div class="course-info-value">${course.code || "-"}</div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Kursnamn</div>
            <div class="course-info-value">${course.name || "-"}</div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Hogskolepoang</div>
            <div class="course-info-value">${credits}</div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Sparrkurser</div>
            <div class="course-info-value">${prereqText}</div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Kompatibla larare</div>
            <div class="course-info-value">${compatibleText}</div>
          </div>
          <div class="course-info-row">
            <div class="course-info-label">Examinator</div>
            <div class="course-info-value">${examinatorName || "-"}</div>
          </div>
        </div>
        <div class="course-info-section">
          <div class="course-info-section-title">Schemalaggning</div>
          ${scheduleBlocks.length
            ? scheduleBlocks
            : html`<div class="course-info-empty">Inte schemalagd.</div>`}
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

customElements.define("course-info-modal", CourseInfoModal);
