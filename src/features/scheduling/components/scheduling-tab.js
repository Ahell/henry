import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { DragDropManager } from "../services/drag-drop-manager.service.js";
import { CourseRunManager } from "../services/course-run-manager.service.js";
import "../../../components/ui/index.js";
import "./gantt-depot.js";
import "./gantt-cell.js";
import { schedulingTabStyles } from "../styles/scheduling-tab.styles.js";
import { getSlotRange } from "../../../utils/date-utils.js";
import { getCompatibleTeachersForCourse } from "../services/teacher-availability.service.js";

/**
 * Scheduling Tab - Gantt view for course planning
 * Coordinates all Gantt sub-components and handles drag-drop logic
 */
export class SchedulingTab extends LitElement {
  static styles = schedulingTabStyles;

  static properties = {
    isEditing: { type: Boolean },
  };

  constructor() {
    super();
    this.isEditing = !!store.editMode;
    this._dragDropManager = new DragDropManager(this);
    this._dragCourseId = null;
    this._teacherOverlayChipsBySlotDate = new Map();
    this._shouldShowTeacherAvailabilityOverlay = false;
    this._autoFillInProgressByCohort = new Set();
    this._didAutoScroll = false;
    this._availabilityAutoScrollRAF = null;
    this._availabilityAutoScrollLastTs = 0;
    store.subscribe(() => {
      const next = !!store.editMode;
      if (this.isEditing !== next) {
        this.setEditMode(next);
      }
      this.requestUpdate();
    });
  }

  _scrollToToday() {
    const wrapper = this.shadowRoot?.querySelector(".gantt-scroll-wrapper");
    if (!wrapper) return;
    const slots = store.getSlots() || [];
    if (slots.length === 0) return;
    const left = this._getTodayScrollLeft(slots);
    requestAnimationFrame(() => {
      wrapper.scrollLeft = left;
    });
  }

  updated() {
    // Auto-scroll horizontally once per mount, after the table exists.
    if (!this._didAutoScroll) {
      const wrapper = this.shadowRoot?.querySelector(".gantt-scroll-wrapper");
      const slots = store.getSlots() || [];
      if (wrapper && slots.length) {
        const left = this._getTodayScrollLeft(slots);
        requestAnimationFrame(() => {
          wrapper.scrollLeft = left;
          this._didAutoScroll = true;
        });
      }
    }

    // Ensure teacher chips in slot header are readable without ellipsis by
    // shrinking font-size until each chip fits its own width.
    if (this._dragCourseId && this._shouldShowTeacherAvailabilityOverlay) {
      requestAnimationFrame(() => this._fitAvailabilityHeaderChips());
      this._ensureAvailabilityHeaderAutoScroll();
    }
  }

  _ensureAvailabilityHeaderAutoScroll() {
    if (this._availabilityAutoScrollRAF) return;
    this._availabilityAutoScrollLastTs = 0;

    const tick = (ts) => {
      if (!this._dragCourseId || !this._shouldShowTeacherAvailabilityOverlay) {
        this._availabilityAutoScrollRAF = null;
        this._availabilityAutoScrollLastTs = 0;
        return;
      }

      const root = this.shadowRoot;
      const containers = root
        ? Array.from(root.querySelectorAll(".slot-availability"))
        : [];
      if (containers.length) {
        const last = this._availabilityAutoScrollLastTs || ts;
        const dt = Math.max(0, (ts - last) / 1000);
        this._availabilityAutoScrollLastTs = ts;

        const speedPxPerSec = 24;

        containers.forEach((el) => {
          // Only animate when visible (during drag overlay)
          if (el.getAttribute("aria-hidden") === "true") return;
          if (el.matches(":hover")) return; // allow manual reading/scroll

          const max = Math.max(0, el.scrollHeight - el.clientHeight);
          if (max <= 1) {
            el.scrollTop = 0;
            el.dataset.autoScrollDir = "1";
            el.dataset.autoScrollPos = "0";
            return;
          }

          const currentDir = Number(el.dataset.autoScrollDir || "1");
          let dir =
            Number.isFinite(currentDir) && currentDir !== 0 ? currentDir : 1;

          const currentPosRaw =
            el.dataset.autoScrollPos != null
              ? Number(el.dataset.autoScrollPos)
              : NaN;
          let pos = Number.isFinite(currentPosRaw)
            ? currentPosRaw
            : el.scrollTop;

          pos += dir * speedPxPerSec * dt;

          if (pos >= max) {
            pos = max;
            dir = -1;
          } else if (pos <= 0) {
            pos = 0;
            dir = 1;
          }

          // Use our own accumulator so we don't get "stuck" on sub-pixel steps.
          el.scrollTop = pos;
          el.dataset.autoScrollDir = String(dir);
          el.dataset.autoScrollPos = String(pos);
        });
      } else {
        this._availabilityAutoScrollLastTs = ts;
      }

      this._availabilityAutoScrollRAF = requestAnimationFrame(tick);
    };

    this._availabilityAutoScrollRAF = requestAnimationFrame(tick);
  }

  _stopAvailabilityHeaderAutoScroll() {
    if (this._availabilityAutoScrollRAF) {
      cancelAnimationFrame(this._availabilityAutoScrollRAF);
      this._availabilityAutoScrollRAF = null;
      this._availabilityAutoScrollLastTs = 0;
    }
  }

  _fitAvailabilityHeaderChips() {
    const root = this.shadowRoot;
    if (!root) return;

    const chips = Array.from(root.querySelectorAll(".availability-chip"));
    if (chips.length === 0) return;

    chips.forEach((chip) => {
      const textEl = chip.querySelector(".availability-chip-text");
      if (!textEl) return;

      chip.style.fontSize = "";
      const basePx = parseFloat(getComputedStyle(chip).fontSize);
      if (!Number.isFinite(basePx) || basePx <= 0) return;

      const minPx = 9; // ~0.56rem default is ~9px-10px; allow a bit smaller but stay readable.
      let currentPx = basePx;
      for (let i = 0; i < 6; i += 1) {
        const overflow = textEl.scrollWidth - textEl.clientWidth;
        if (overflow <= 0) break;

        const ratio = textEl.clientWidth / textEl.scrollWidth;
        if (!Number.isFinite(ratio) || ratio <= 0) break;

        const nextPx = Math.max(minPx, currentPx * ratio * 0.99);
        if (nextPx >= currentPx - 0.1) {
          chip.style.fontSize = `${Math.max(minPx, currentPx - 0.2)}px`;
          currentPx = Math.max(minPx, currentPx - 0.2);
          continue;
        }
        chip.style.fontSize = `${nextPx}px`;
        currentPx = nextPx;
      }
    });
  }

  _getTodayScrollLeft(slots) {
    const slotDates = [...new Set((slots || []).map((s) => s.start_date))]
      .filter(Boolean)
      .sort();
    if (slotDates.length === 0) return 0;

    const slotWidthPx = (() => {
      const raw = getComputedStyle(this).getPropertyValue("--gantt-slot-width");
      const n = parseFloat(String(raw || "").trim());
      return Number.isFinite(n) && n > 0 ? n : 120;
    })();

    const today = (() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    })();

    let targetIdx = 0;
    for (let i = 0; i < slotDates.length; i += 1) {
      const d = this._parseDateOnly(slotDates[i]);
      if (d && d <= today) targetIdx = i;
    }

    // Desired behavior: first visible slot should be the one just before today's period.
    const beforeIdx = Math.max(0, targetIdx - 1);
    return Math.max(0, beforeIdx * slotWidthPx);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("depot-drag-start", this._handleDepotDragStart);
    this.addEventListener("depot-drag-end", this._handleDragEnd);
    this.addEventListener("course-drag-start", this._handleCourseDragStart);
    this.addEventListener("course-drag-end", this._handleDragEnd);
    this.addEventListener("cell-drag-over", this._handleCellDragOver);
    this.addEventListener("cell-drag-leave", this._handleCellDragLeave);
    this.addEventListener("cell-drop", this._handleCellDrop);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("depot-drag-start", this._handleDepotDragStart);
    this.removeEventListener("depot-drag-end", this._handleDragEnd);
    this.removeEventListener("course-drag-start", this._handleCourseDragStart);
    this.removeEventListener("course-drag-end", this._handleDragEnd);
    this.removeEventListener("cell-drag-over", this._handleCellDragOver);
    this.removeEventListener("cell-drag-leave", this._handleCellDragLeave);
    this.removeEventListener("cell-drop", this._handleCellDrop);
  }

  render() {
    const cohorts = store.getCohorts();
    const slots = store.getSlots();

    if (slots.length === 0) {
      return html`
        <henry-panel>
          <div slot="header">
            <henry-text variant="heading-3">Schemaläggning</henry-text>
          </div>
          <p>Inga slots tillgängliga.</p>
        </henry-panel>
      `;
    }

    const slotDates = [...new Set(slots.map((s) => s.start_date))].sort();
    const prerequisiteProblems = this._computeSchedulingPrerequisiteProblems();
    const prerequisiteWarnings =
      this._computePrerequisiteRuleWarnings(prerequisiteProblems);
    const overlapWarnings = this._computeCohortSlotOverlapWarnings();
    const capacityWarnings = this._computeCourseRunCapacityWarnings();
    const skewedOverlapWarnings = this._computeSkewed15HpOverlapWarnings();
    const teacherAvailabilityWarnings =
      this._computeMissingAvailableCompatibleTeacherWarnings();
    const emptySlotWarnings = this._computeEmptySlotWarnings();

    const allWarnings = [
      ...prerequisiteWarnings,
      ...overlapWarnings,
      ...capacityWarnings,
      ...skewedOverlapWarnings,
      ...teacherAvailabilityWarnings,
      ...emptySlotWarnings,
    ];
    const cohortMarkersByCohortId =
      this._buildCohortWarningMarkersByCohortId(allWarnings);
    const slotCapacityWarningsBySlotDate =
      this._buildSlotCapacityWarningPillsBySlotDate(capacityWarnings);
    const slotTeacherSelectionWarningsBySlotDate =
      this._buildSlotTeacherSelectionWarningPillsBySlotDate();
    const slotTeacherCompatibilityWarningsBySlotDate =
      this._buildSlotTeacherCompatibilityWarningPillsBySlotDate();

    return html`
      <henry-panel>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Schemaläggning</henry-text>
          <div class="header-actions">
            <div class="header-buttons">
              <henry-button
                variant="primary"
                @click=${() => this._scrollToToday()}
                >Idag</henry-button
              >
            </div>
          </div>
        </div>

        <div class="gantt-scroll-wrapper" tabindex="0">
          <table
            class="gantt-table"
            style="--gantt-slot-count: ${slotDates.length};"
          >
            <colgroup>
              <col style="width: var(--gantt-depot-width);" />
              <col style="width: var(--gantt-cohort-width);" />
              ${slotDates.map(
                () => html`<col style="width: var(--gantt-slot-width);" />`
              )}
            </colgroup>
            <thead>
              <tr class="availability-row">
                <th class="cohort-header" rowspan="2">Depå</th>
                <th class="cohort-header" rowspan="2">Kull</th>
                ${slotDates.map(
                  (dateStr) =>
                    html`<th class="slot-col-header">
                      ${this._renderSlotAvailabilityHeader(
                        dateStr,
                        slotCapacityWarningsBySlotDate,
                        slotTeacherSelectionWarningsBySlotDate,
                        slotTeacherCompatibilityWarningsBySlotDate
                      )}
                    </th>`
                )}
              </tr>
              <tr class="date-row">
                ${slotDates.map(
                  (dateStr) =>
                    html`<th class="slot-col-header">
                      <div class="slot-date">
                        ${this._formatDateYYMMDD(dateStr)}
                      </div>
                    </th>`
                )}
              </tr>
            </thead>
            <tbody>
              ${cohorts.map((cohort) =>
                this._renderGanttRow(
                  cohort,
                  slotDates,
                  prerequisiteProblems,
                  cohortMarkersByCohortId
                )
              )}
            </tbody>
            <tfoot>
              ${this._renderSummaryRow(slotDates)}
            </tfoot>
          </table>
        </div>
      </henry-panel>
    `;
  }

  _computeCourseRunCapacityWarnings() {
    const businessLogic = store.businessLogicManager.getBusinessLogic();
    const params = businessLogic?.scheduling?.params || {};
    const hardCap = Number(params.maxStudentsHard);
    const preferredCap = Number(params.maxStudentsPreferred);

    const hard = Number.isFinite(hardCap) ? hardCap : 130;
    const preferred = Number.isFinite(preferredCap) ? preferredCap : 100;

    const slots = store.getSlots() || [];
    const warnings = [];

    for (const slot of slots) {
      const slotDate = slot?.start_date;
      if (!slotDate) continue;

      // courseId -> Set(cohortId)
      const cohortIdsByCourseId = new Map();
      const runsInSlot = (store.getCourseRuns() || [])
        .filter((run) => this._runCoversSlotId(run, slot.slot_id))
        .filter(
          (run) =>
            run?.course_id != null &&
            Array.isArray(run.cohorts) &&
            run.cohorts.some((id) => id != null)
        );

      for (const run of runsInSlot) {
        const courseKey = String(run.course_id);
        if (!cohortIdsByCourseId.has(courseKey)) {
          cohortIdsByCourseId.set(courseKey, new Set());
        }
        const cohortSet = cohortIdsByCourseId.get(courseKey);
        (run.cohorts || []).forEach((cohortId) => {
          if (cohortId != null) cohortSet.add(cohortId);
        });
      }

      for (const [courseKey, cohortSet] of cohortIdsByCourseId.entries()) {
        let total = 0;
        cohortSet.forEach((cohortId) => {
          const cohort = store.getCohort(cohortId);
          if (cohort) total += Number(cohort.planned_size) || 0;
        });

        if (total > hard) {
          cohortSet.forEach((cohortId) => {
            warnings.push({
              ruleId: "maxStudentsHard",
              cohortId,
              slotDate,
              courseId: Number(courseKey),
              total,
              limit: hard,
            });
          });
          continue;
        }
        if (total > preferred) {
          cohortSet.forEach((cohortId) => {
            warnings.push({
              ruleId: "avoidOverPreferred",
              cohortId,
              slotDate,
              courseId: Number(courseKey),
              total,
              limit: preferred,
            });
          });
        }
      }
    }

    return warnings;
  }

  _truncatePillLabel(label, maxLen = 14) {
    const text = String(label || "");
    if (text.length <= maxLen) return text;
    return `${text.slice(0, Math.max(0, maxLen - 1))}…`;
  }

  _computeSkewed15HpOverlapWarnings() {
    const slotsOrdered = (store.getSlots() || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.start_date) - new Date(b.start_date) ||
          Number(a.slot_id) - Number(b.slot_id)
      );
    const indexBySlotId = new Map(
      slotsOrdered.map((s, idx) => [String(s.slot_id), idx])
    );

    const runs = (store.getCourseRuns() || []).filter((run) => {
      if (!run || run.course_id == null || run.slot_id == null) return false;
      return this._getRunSpan(run) >= 2;
    });

    const startIdxByCourseId = new Map(); // courseId -> Set(startIdx)

    runs.forEach((run) => {
      const startIdx = indexBySlotId.get(String(run.slot_id));
      if (!Number.isFinite(startIdx)) return;
      const key = String(run.course_id);
      if (!startIdxByCourseId.has(key)) startIdxByCourseId.set(key, new Set());
      startIdxByCourseId.get(key).add(startIdx);
    });

    const warnings = [];
    for (const run of runs) {
      const startIdx = indexBySlotId.get(String(run.slot_id));
      if (!Number.isFinite(startIdx)) continue;
      const set = startIdxByCourseId.get(String(run.course_id));
      if (!set) continue;
      // Skewed overlap: another run starts one slot earlier for same 15hp course.
      if (!set.has(startIdx - 1)) continue;
      const slotDate = store.getSlot(run.slot_id)?.start_date;
      const cohortIds = Array.isArray(run.cohorts) ? run.cohorts : [];
      cohortIds
        .filter((id) => id != null)
        .forEach((cohortId) =>
          warnings.push({
            ruleId: "noSkewedOverlap15hp",
            cohortId,
            slotDate,
            courseId: run.course_id,
          })
        );
    }

    return warnings;
  }

  _computeMissingAvailableCompatibleTeacherWarnings() {
    const rules =
      store.businessLogicManager.getBusinessLogic()?.scheduling?.rules || [];
    const requireRule = rules.find(
      (r) => r?.id === "requireAvailableCompatibleTeachers"
    );
    // If rule isn't enabled, skip computing to avoid noise.
    if (requireRule && requireRule.enabled === false) return [];

    const warnings = [];
    const slots = store.getSlots() || [];
    const slotDates = [...new Set(slots.map((s) => s.start_date))].sort();
    const slotByStartDate = new Map(slots.map((s) => [s.start_date, s]));
    const teachers = store.getTeachers() || [];

    for (const cohort of store.getCohorts() || []) {
      if (!cohort || cohort.cohort_id == null) continue;

      const runsInCohort = (store.getCourseRuns() || []).filter((r) =>
        this._runHasCohort(r, cohort.cohort_id)
      );
      if (runsInCohort.length === 0) continue;

      let violation = null;
      for (const run of runsInCohort) {
        if (!run || run.course_id == null || run.slot_id == null) continue;

        const dates = this._getRunSlotDates(run, slotDates);
        if (dates.length === 0) continue;

        const compatibleTeachers = teachers.filter(
          (t) =>
            Array.isArray(t.compatible_courses) &&
            t.compatible_courses.includes(run.course_id)
        );
        if (compatibleTeachers.length === 0) {
          violation = { slotDate: dates[0], courseId: run.course_id };
          break;
        }

        for (const dateStr of dates) {
          const slot = slotByStartDate.get(dateStr);
          const slotId = slot?.slot_id ?? null;
          const hasAnyAvailable = compatibleTeachers.some(
            (t) => !store.isTeacherUnavailable(t.teacher_id, dateStr, slotId)
          );
          if (!hasAnyAvailable) {
            violation = { slotDate: dateStr, courseId: run.course_id };
            break;
          }
        }
        if (violation) break;
      }

      if (violation) {
        warnings.push({
          ruleId: "requireAvailableCompatibleTeachers",
          cohortId: cohort.cohort_id,
          slotDate: violation.slotDate,
          courseId: violation.courseId,
        });
      }
    }

    return warnings;
  }

  _computeEmptySlotWarnings() {
    const warnings = [];
    const slots = (store.getSlots() || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.start_date) - new Date(b.start_date) ||
          Number(a.slot_id) - Number(b.slot_id)
      );
    if (slots.length === 0) return warnings;

    const cohorts = store.getCohorts() || [];
    for (const cohort of cohorts) {
      if (!cohort || cohort.cohort_id == null) continue;

      const cohortStart = this._parseDateOnly(cohort.start_date);
      const startIdx = (() => {
        if (!cohortStart) return 0;
        for (let i = 0; i < slots.length; i += 1) {
          const d = this._parseDateOnly(slots[i]?.start_date);
          if (d && d >= cohortStart) return i;
        }
        return slots.length; // start after all slots
      })();
      if (startIdx >= slots.length) continue;

      const coveredIdx = new Set();
      (store.getCourseRuns() || [])
        .filter((r) => this._runHasCohort(r, cohort.cohort_id))
        .forEach((run) => {
          const startIndex = slots.findIndex(
            (s) => String(s.slot_id) === String(run.slot_id)
          );
          if (startIndex < 0) return;
          const span = this._getRunSpan(run);
          for (let i = startIndex; i < startIndex + span; i += 1) {
            coveredIdx.add(i);
          }
        });

      const afterStartCovered = Array.from(coveredIdx).filter(
        (i) => i >= startIdx
      );
      if (afterStartCovered.length < 2) continue;
      const min = Math.min(...afterStartCovered);
      const max = Math.max(...afterStartCovered);
      let hasGap = false;
      for (let i = min; i <= max; i += 1) {
        if (!coveredIdx.has(i)) {
          hasGap = true;
          break;
        }
      }
      if (hasGap) {
        warnings.push({
          ruleId: "avoidEmptySlots",
          cohortId: cohort.cohort_id,
        });
      }
    }

    return warnings;
  }

  _computePrerequisiteRuleWarnings(prerequisiteProblems) {
    const rules =
      store.businessLogicManager.getBusinessLogic()?.scheduling?.rules || [];
    const prereqRule = rules.find((r) => r?.id === "prerequisitesOrder");
    if (prereqRule && prereqRule.enabled === false) return [];

    const warnings = [];
    (Array.isArray(prerequisiteProblems) ? prerequisiteProblems : []).forEach(
      (p) => {
        if (p?.cohortId == null) return;
        warnings.push({
          ruleId: "prerequisitesOrder",
          cohortId: p.cohortId,
          courseId: p.courseId,
          courseCode: p.courseCode,
          courseName: p.courseName,
          missingPrereqCode: p.missingPrereqCode,
          missingPrereqName: p.missingPrereqName,
          type: p.type,
        });
      }
    );
    return warnings;
  }

  setEditMode(enabled) {
    const next = !!enabled;
    if (this.isEditing === next) return;
    this.isEditing = next;
    if (!next) {
      // Ensure any in-progress drag state and overlays are cleared when leaving edit mode.
      this._dragDropManager?.handleDragEnd?.();
    }
  }

  _buildCohortWarningMarkersByCohortId(warnings) {
    const schedulingRules =
      store.businessLogicManager.getBusinessLogic()?.scheduling?.rules || [];
    const ruleById = new Map(
      schedulingRules.map((r) => [String(r?.id || ""), r]).filter(([id]) => id)
    );

    const slotOnlyRuleIds = new Set(["maxStudentsHard", "avoidOverPreferred"]);
    const conciseLabelByRuleId = {
      prerequisitesOrder: "Spärrkurs",
      noSkewedOverlap15hp: "15hp snett",
      requireAvailableCompatibleTeachers: "Ingen lärare",
      avoidEmptySlots: "Tom slot",
      maxOneCoursePerSlot: "Flera kurser",
    };

    const groupedByCohort = new Map(); // cohortId -> Map(ruleId -> entry)

    (Array.isArray(warnings) ? warnings : []).forEach((w) => {
      const cohortId = w?.cohortId;
      const ruleId = w?.ruleId;
      if (cohortId == null || !ruleId) return;
      if (slotOnlyRuleIds.has(String(ruleId))) return;

      const rule = ruleById.get(String(ruleId));
      const kind =
        String(rule?.kind || "soft").toLowerCase() === "hard" ? "hard" : "soft";
      const label = this._truncatePillLabel(
        conciseLabelByRuleId[String(ruleId)] ||
          rule?.label ||
          rule?.id ||
          String(ruleId)
      );

      const cohortKey = String(cohortId);
      if (!groupedByCohort.has(cohortKey)) {
        groupedByCohort.set(cohortKey, new Map());
      }
      const byRule = groupedByCohort.get(cohortKey);
      const ruleKey = String(ruleId);
      if (!byRule.has(ruleKey)) {
        byRule.set(ruleKey, { ruleId: ruleKey, kind, label, contexts: [] });
      }

      const entry = byRule.get(ruleKey);
      entry.kind = kind;
      entry.label = label;
      entry.contexts.push({
        slotDate: w?.slotDate,
        courseId: w?.courseId,
        courseCode: w?.courseCode,
        courseName: w?.courseName,
        missingPrereqCode: w?.missingPrereqCode,
        missingPrereqName: w?.missingPrereqName,
        type: w?.type,
        total: w?.total,
        limit: w?.limit,
      });
    });

    const markersByCohortId = new Map();

    for (const [cohortKey, byRule] of groupedByCohort.entries()) {
      const markers = Array.from(byRule.values()).map((entry) => ({
        ...entry,
        title: this._formatCohortWarningMarkerTitle(entry),
      }));

      const kindOrder = { hard: 0, soft: 1 };
      markers.sort((a, b) => {
        const kindCmp = (kindOrder[a.kind] ?? 9) - (kindOrder[b.kind] ?? 9);
        if (kindCmp !== 0) return kindCmp;
        return String(a.label || "").localeCompare(String(b.label || ""));
      });

      markersByCohortId.set(cohortKey, markers);
    }

    return markersByCohortId;
  }

  _buildSlotCapacityWarningPillsBySlotDate(capacityWarnings) {
    const schedulingRules =
      store.businessLogicManager.getBusinessLogic()?.scheduling?.rules || [];
    const ruleById = new Map(
      schedulingRules.map((r) => [String(r?.id || ""), r]).filter(([id]) => id)
    );

    const labelByRuleId = {
      maxStudentsHard: "Maxantal",
      avoidOverPreferred: "Önskat antal",
    };

    const bySlotDate = new Map(); // slotDate -> { hard: Set, soft: Set, contexts: [] }

    (Array.isArray(capacityWarnings) ? capacityWarnings : []).forEach((w) => {
      const slotDate = w?.slotDate;
      const ruleId = w?.ruleId;
      if (!slotDate || !ruleId) return;

      const rule = ruleById.get(String(ruleId));
      if (!rule || rule.enabled === false) return;

      if (!bySlotDate.has(String(slotDate))) {
        bySlotDate.set(String(slotDate), {
          hard: false,
          soft: false,
          contexts: [],
        });
      }
      const entry = bySlotDate.get(String(slotDate));
      entry.contexts.push(w);

      if (String(ruleId) === "maxStudentsHard") entry.hard = true;
      if (String(ruleId) === "avoidOverPreferred") entry.soft = true;
    });

    const out = new Map();
    for (const [slotDate, entry] of bySlotDate.entries()) {
      const pills = [];
      const contexts = Array.isArray(entry.contexts) ? entry.contexts : [];

      const buildTitle = (label, filterRuleId) => {
        const lines = [label];
        const seen = new Set();
        contexts
          .filter((c) => String(c?.ruleId) === filterRuleId)
          .forEach((ctx) => {
            const courseId = ctx?.courseId;
            const key = `${ctx?.slotDate}@@${courseId}`;
            if (seen.has(key)) return;
            seen.add(key);
            const course = courseId != null ? store.getCourse(courseId) : null;
            const code =
              course?.code || (courseId != null ? `Kurs ${courseId}` : "Kurs");
            const total = Number(ctx?.total);
            const limit = Number(ctx?.limit);
            const totalText = Number.isFinite(total)
              ? `${total} studenter`
              : "";
            const limitText = Number.isFinite(limit) ? `gräns ${limit}` : "";
            const details = [totalText, limitText].filter(Boolean).join(", ");
            lines.push(`${code}${details ? ` (${details})` : ""}`);
          });
        return lines.join("\n");
      };

      if (entry.hard) {
        const label = this._truncatePillLabel(labelByRuleId.maxStudentsHard);
        pills.push({
          kind: "hard",
          label,
          title: buildTitle(label, "maxStudentsHard"),
        });
      } else if (entry.soft) {
        const label = this._truncatePillLabel(labelByRuleId.avoidOverPreferred);
        pills.push({
          kind: "soft",
          label,
          title: buildTitle(label, "avoidOverPreferred"),
        });
      }

      out.set(String(slotDate), pills);
    }

    return out;
  }

  _buildSlotTeacherSelectionWarningPillsBySlotDate() {
    const out = new Map(); // slotDate -> pills[]
    const slots = store.getSlots() || [];
    const courseById = new Map(
      (store.getCourses() || []).map((c) => [String(c.course_id), c])
    );

    for (const slot of slots) {
      if (!slot?.slot_id || !slot?.start_date) continue;

      const runsInSlot = (store.getCourseRuns() || [])
        .filter((run) => this._runCoversSlotId(run, slot.slot_id))
        // Ignore orphan runs with no cohort (they shouldn't count as "scheduled" in the grid)
        .filter(
          (run) =>
            Array.isArray(run.cohorts) && run.cohorts.some((id) => id != null)
        );

      if (!runsInSlot.length) continue;

      const missingCourseCodes = [];
      const missingKursansvarCodes = [];
      const courseIdsInSlot = Array.from(
        new Set(runsInSlot.map((r) => r?.course_id).filter((id) => id != null))
      ).map((id) => String(id));

      for (const courseIdStr of courseIdsInSlot) {
        const assignedTeachers = new Set();
        const runsForCourse = runsInSlot.filter(
          (r) => String(r?.course_id) === courseIdStr
        );
        runsForCourse.forEach((r) => {
          if (Array.isArray(r?.teachers)) {
            r.teachers.forEach((tid) => {
              if (tid != null) assignedTeachers.add(String(tid));
            });
          }
        });

        const courseId = Number(courseIdStr);
        if (assignedTeachers.size === 0) {
          const available = this._computeTeacherOverlayChips(
            courseId,
            slot.start_date
          );
          if (Array.isArray(available) && available.length > 0) {
            const course =
              courseById.get(courseIdStr) || store.getCourse(courseId) || {};
            missingCourseCodes.push(String(course?.code || `Kurs ${courseId}`));
          }
        }

        const hasKursansvarigForAllRuns = runsForCourse.every(
          (r) => r?.kursansvarig_id != null
        );
        if (!hasKursansvarigForAllRuns && assignedTeachers.size > 0) {
          const course =
            courseById.get(courseIdStr) || store.getCourse(courseId) || {};
          missingKursansvarCodes.push(
            String(course?.code || `Kurs ${courseId}`)
          );
        }
      }

      if (!missingCourseCodes.length && !missingKursansvarCodes.length)
        continue;

      const pills = [];
      if (missingCourseCodes.length) {
        missingCourseCodes.sort((a, b) => String(a).localeCompare(String(b)));
        const label = this._truncatePillLabel("Lärarval");
        const title = ["Lärarval", ...missingCourseCodes].join("\n");
        pills.push({ kind: "soft", label, title });
      }

      if (missingKursansvarCodes.length) {
        missingKursansvarCodes.sort((a, b) =>
          String(a).localeCompare(String(b))
        );
        const label = this._truncatePillLabel("Kursansvar");
        const title = ["Kursansvar", ...missingKursansvarCodes].join("\n");
        pills.push({ kind: "soft", label, title });
      }

      out.set(String(slot.start_date), pills);
    }

    return out;
  }

  _buildSlotTeacherCompatibilityWarningPillsBySlotDate() {
    const out = new Map(); // slotDate -> pills[]
    const slots = store.getSlots() || [];
    const courseById = new Map(
      (store.getCourses() || []).map((c) => [String(c.course_id), c])
    );

    for (const slot of slots) {
      if (!slot?.slot_id || !slot?.start_date) continue;

      const runsInSlot = (store.getCourseRuns() || [])
        .filter((run) => this._runCoversSlotId(run, slot.slot_id))
        // Ignore orphan runs with no cohort (they shouldn't count as "scheduled" in the grid)
        .filter(
          (run) =>
            Array.isArray(run.cohorts) && run.cohorts.some((id) => id != null)
        );

      if (!runsInSlot.length) continue;

      const missingCourseCodes = [];
      const courseIdsInSlot = Array.from(
        new Set(runsInSlot.map((r) => r?.course_id).filter((id) => id != null))
      ).map((id) => String(id));

      for (const courseIdStr of courseIdsInSlot) {
        const courseId = Number(courseIdStr);
        const compatibleTeachers = getCompatibleTeachersForCourse(courseId);
        if (compatibleTeachers.length > 0) continue;

        const course =
          courseById.get(courseIdStr) || store.getCourse(courseId) || {};
        missingCourseCodes.push(String(course?.code || `Kurs ${courseId}`));
      }

      if (!missingCourseCodes.length) continue;

      missingCourseCodes.sort((a, b) => String(a).localeCompare(String(b)));
      const label = this._truncatePillLabel("Kompabilitet");
      const title = ["Kompabilitet", ...missingCourseCodes].join("\n");
      out.set(String(slot.start_date), [{ kind: "hard", label, title }]);
    }

    return out;
  }

  _formatCohortWarningMarkerTitle(entry) {
    const ruleId = String(entry?.ruleId || "");
    const label = String(entry?.label || "").trim() || ruleId;
    const contexts = Array.isArray(entry?.contexts) ? entry.contexts : [];

    const lines = [label];

    const uniqueByKey = (arr, keyFn) => {
      const out = [];
      const seen = new Set();
      arr.forEach((item) => {
        const key = keyFn(item);
        if (!key || seen.has(key)) return;
        seen.add(key);
        out.push(item);
      });
      return out;
    };

    const courseLabel = (ctx) => {
      const courseId = ctx?.courseId;
      const fromStore = courseId != null ? store.getCourse(courseId) : null;
      const code = ctx?.courseCode || fromStore?.code || null;
      const name = ctx?.courseName || fromStore?.name || null;
      if (code && name) return `${code}: ${name}`;
      if (code) return code;
      if (courseId != null) return `Kurs ${courseId}`;
      return "Kurs";
    };

    if (ruleId === "maxStudentsHard" || ruleId === "avoidOverPreferred") {
      const normalized = uniqueByKey(
        contexts.filter((c) => c?.slotDate && c?.courseId != null),
        (c) => `${c.slotDate}@@${c.courseId}`
      );
      normalized
        .sort((a, b) => String(a.slotDate).localeCompare(String(b.slotDate)))
        .forEach((ctx) => {
          const total = Number(ctx?.total);
          const limit = Number(ctx?.limit);
          const totalText = Number.isFinite(total) ? `${total} studenter` : "";
          const limitText = Number.isFinite(limit) ? `gräns ${limit}` : "";
          const details = [totalText, limitText].filter(Boolean).join(", ");
          lines.push(
            `${ctx.slotDate}: ${courseLabel(ctx)}${
              details ? ` (${details})` : ""
            }`
          );
        });
      return lines.join("\n");
    }

    if (ruleId === "prerequisitesOrder") {
      const normalized = uniqueByKey(
        contexts.filter((c) => c?.courseId != null),
        (c) => `${c.courseId}@@${c.missingPrereqCode || ""}@@${c.type || ""}`
      );
      normalized.slice(0, 10).forEach((ctx) => {
        const course = courseLabel(ctx);
        const prereq = ctx?.missingPrereqCode || "";
        const type = String(ctx?.type || "");
        if (type === "missing") {
          lines.push(
            `${course} saknar spärrkurs${prereq ? `: ${prereq}` : ""}`
          );
          return;
        }
        if (type === "before_prerequisite") {
          lines.push(
            `${course} ligger före spärrkurs${prereq ? `: ${prereq}` : ""}`
          );
          return;
        }
        if (type === "blocked_by_prerequisite_chain") {
          lines.push(`${course} spärrkedja${prereq ? `: ${prereq}` : ""}`);
          return;
        }
        lines.push(course);
      });
      return lines.join("\n");
    }

    const slotDates = uniqueByKey(
      contexts.filter((c) => c?.slotDate),
      (c) => String(c.slotDate)
    )
      .map((c) => c.slotDate)
      .sort((a, b) => String(a).localeCompare(String(b)));
    if (slotDates.length) {
      lines.push(
        `Slots: ${slotDates.map((d) => this._formatDateYYMMDD(d)).join(", ")}`
      );
    }

    const courses = uniqueByKey(
      contexts.filter((c) => c?.courseId != null),
      (c) => String(c.courseId)
    )
      .map((ctx) => courseLabel(ctx))
      .filter(Boolean);
    if (courses.length) {
      lines.push(`Kurser: ${courses.join(", ")}`);
    }

    return lines.join("\n");
  }

  _renderSlotAvailabilityHeader(
    slotDate,
    slotCapacityWarningsBySlotDate,
    slotTeacherSelectionWarningsBySlotDate,
    slotTeacherCompatibilityWarningsBySlotDate
  ) {
    const chips = this._teacherOverlayChipsBySlotDate?.get(slotDate) || [];
    const warningPills = [
      ...(slotCapacityWarningsBySlotDate?.get?.(String(slotDate)) || []),
      ...(slotTeacherCompatibilityWarningsBySlotDate?.get?.(String(slotDate)) ||
        []),
      ...(slotTeacherSelectionWarningsBySlotDate?.get?.(String(slotDate)) ||
        []),
    ];

    const shouldShowChips =
      !!this._dragCourseId && !!this._shouldShowTeacherAvailabilityOverlay;

    const course = store.getCourse(this._dragCourseId);
    const title = course
      ? `${course.code}: kompatibla lärare`
      : "Kompatibla lärare";

    return html`
      <div class="slot-availability-row" title="${title}">
        <div
          class="slot-availability"
          aria-hidden="${shouldShowChips ? "false" : "true"}"
        >
          ${shouldShowChips
            ? chips.map((chip) => {
                const status = chip?.status || "compatible";
                const className = `availability-chip availability-chip--${status}`;
                return html`
                  <span class="${className}" title="${chip.title}">
                    <span class="availability-chip-text">${chip.label}</span>
                  </span>
                `;
              })
            : ""}
        </div>
        <div
          class="slot-warning-pills"
          aria-hidden="${warningPills.length ? "false" : "true"}"
        >
          ${warningPills.map(
            (pill) => html`
              <span
                class="slot-warning-pill slot-warning-pill--${pill.kind}"
                title="${pill.title}"
                aria-label="${pill.label}"
                >${pill.label}</span
              >
            `
          )}
        </div>
      </div>
    `;
  }

  _renderGanttRow(cohort, slotDates, prerequisiteProblems, cohortMarkersById) {
    const runsByDate = {};
    const continuationRunsByDate = {};
    const scheduledCourseIds = new Set();
    const autoFillBusy =
      this._autoFillInProgressByCohort.has(String(cohort.cohort_id)) ||
      store.isReconciling;
    const markers = cohortMarkersById?.get?.(String(cohort.cohort_id)) || [];

    store
      .getCourseRuns()
      .filter((r) => this._runHasCohort(r, cohort.cohort_id))
      .forEach((run) => {
        const slot = store.getSlot(run.slot_id);
        const course = store.getCourse(run.course_id);

        scheduledCourseIds.add(run.course_id);

        if (!slot) return;

        const runSlotDates = this._getRunSlotDates(run, slotDates);
        if (runSlotDates.length === 0) return;

        runSlotDates.forEach((dateStr, idx) => {
          if (idx === 0) {
            if (!runsByDate[dateStr]) runsByDate[dateStr] = [];
            runsByDate[dateStr].push(run);
            return;
          }
          if (!continuationRunsByDate[dateStr]) {
            continuationRunsByDate[dateStr] = [];
          }
          continuationRunsByDate[dateStr].push(run);
        });
      });

    return html`
      <tr>
        <td
          class="depot-cell"
          data-cohort-id="${cohort.cohort_id}"
          @dragover="${this._handleDepotDragOver}"
          @dragleave="${this._handleDepotDragLeave}"
          @drop="${this._handleDepotDrop}"
        >
          <gantt-depot
            .cohortId="${cohort.cohort_id}"
            .scheduledCourseIds="${Array.from(scheduledCourseIds)}"
            .disabled=${!this.isEditing}
          ></gantt-depot>
        </td>
        <td class="cohort-cell">
          <div class="cohort-cell-content">
            <span class="cohort-cell-name">${cohort.name}</span>
            <div class="cohort-cell-actions">
              <button
                class="cohort-reset-button"
                type="button"
                ?disabled=${!this.isEditing}
                title="Flytta alla kurser tillbaka till depån"
                @click=${(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this._handleResetCohortClick(cohort.cohort_id);
                }}
              >
                Återställ
              </button>
              <button
                class="cohort-autofill-button"
                type="button"
                ?disabled=${!this.isEditing || autoFillBusy}
                title="Auto-fyll schema för denna kull"
                @click=${(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this._handleAutoFillCohortClick(cohort.cohort_id);
                }}
              >
                ${autoFillBusy ? "Auto-fyll…" : "Auto-fyll"}
              </button>
            </div>
            ${markers.length
              ? html`<div class="cohort-warning-markers" aria-label="Varningar">
                  ${markers.map(
                    (m) => html`
                      <span
                        class="cohort-warning-pill cohort-warning-pill--${m.kind}"
                        title="${m.title}"
                        role="note"
                        aria-label="${m.label}"
                        >${m.label}</span
                      >
                    `
                  )}
                </div>`
              : ""}
          </div>
        </td>
        ${slotDates.map((dateStr, index) => {
          const runs = runsByDate[dateStr] || [];

          const slotDate = this._parseDateOnly(dateStr);
          const cohortStartDate = this._parseDateOnly(cohort.start_date);
          const isBeforeCohortStart =
            slotDate && cohortStartDate ? slotDate < cohortStartDate : false;

          const nextSlotDate =
            index < slotDates.length - 1
              ? this._parseDateOnly(slotDates[index + 1])
              : null;
          const isCohortStartSlot =
            slotDate && cohortStartDate
              ? cohortStartDate >= slotDate &&
                (nextSlotDate === null || cohortStartDate < nextSlotDate)
              : false;

          return html`
            <td
              class="slot-cell ${isBeforeCohortStart
                ? "disabled-slot"
                : ""} ${isCohortStartSlot ? "cohort-start-slot" : ""}"
              data-slot-date="${dateStr}"
              data-cohort-id="${cohort.cohort_id}"
              data-disabled="${isBeforeCohortStart}"
              @dragover="${this._handleSlotCellDragOver}"
              @dragleave="${this._handleSlotCellDragLeave}"
              @drop="${this._handleSlotCellDrop}"
            >
              <gantt-cell
                .slotDate="${dateStr}"
                .cohortId="${cohort.cohort_id}"
                .runs="${runs}"
                .continuationRuns="${continuationRunsByDate[dateStr] || []}"
                .isBeforeCohortStart="${isBeforeCohortStart}"
                .isCohortStartSlot="${isCohortStartSlot}"
                .cohortStartDate="${cohort.start_date}"
                .prerequisiteProblems="${prerequisiteProblems}"
                .disabled=${!this.isEditing}
              ></gantt-cell>
            </td>
          `;
        })}
      </tr>
    `;
  }

  async _handleResetCohortClick(cohortId) {
    if (!this.isEditing) return;
    try {
      await CourseRunManager.resetCohortSchedule(cohortId);
      this.requestUpdate();
    } catch (error) {
      console.error("Kunde inte återställa kullens schema:", error);
    }
  }

  _handleAutoFillCohortClick(cohortId) {
    if (!this.isEditing) return;
    this._handleAutoFillCohortClickAsync(cohortId);
  }

  async _handleAutoFillCohortClickAsync(cohortId) {
    if (!this.isEditing) return;
    const key = String(cohortId);
    if (this._autoFillInProgressByCohort.has(key) || store.isReconciling) {
      return;
    }

    this._autoFillInProgressByCohort.add(key);
    this.requestUpdate();
    try {
      await CourseRunManager.autoFillCohortSchedule(cohortId);
      this.requestUpdate();
    } catch (error) {
      console.error("Kunde inte auto-fylla kullens schema:", error);
    } finally {
      this._autoFillInProgressByCohort.delete(key);
      this.requestUpdate();
    }
  }

  _getRunSpan(run) {
    const spanFromRun = Number(run?.slot_span);
    if (Number.isFinite(spanFromRun) && spanFromRun >= 2) return spanFromRun;

    const course = store.getCourse(run?.course_id);
    const credits = Number(course?.credits);
    return credits === 15 ? 2 : 1;
  }

  _getRunSlotDates(run, slotDates) {
    if (!run) return [];

    // Prefer explicit slot_ids when present (backend provides these).
    if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
      const fromIds = run.slot_ids
        .map((slotId) => store.getSlot(slotId)?.start_date)
        .filter(Boolean);
      if (fromIds.length > 0) return fromIds;
    }

    const startDate = store.getSlot(run.slot_id)?.start_date;
    if (!startDate) return [];

    const span = this._getRunSpan(run);
    const idx = slotDates.indexOf(startDate);
    if (idx === -1) return [startDate];
    return slotDates.slice(idx, idx + span);
  }

  _parseDragDataFromEvent(e) {
    try {
      const raw = e?.dataTransfer?.getData("text/plain");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  _adjustSlotDateForDrag(slotDate) {
    const offset = Number(
      this._dragDropManager?.state?.draggingSlotOffset || 0
    );
    if (!offset) return slotDate;

    const slotDates = [
      ...new Set((store.getSlots() || []).map((s) => s.start_date)),
    ].sort();
    const idx = slotDates.indexOf(slotDate);
    const adjustedIdx = idx - offset;
    if (idx === -1 || adjustedIdx < 0) return null;
    return slotDates[adjustedIdx] || null;
  }

  _handleSlotCellDragOver(e) {
    if (!this.isEditing) {
      if (e?.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }
    const td = e.currentTarget;
    if (!td || td.dataset.disabled === "true") {
      if (e?.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }

    // Allow dropping anywhere inside the td (not just over the inner content).
    e.preventDefault();

    const adjustedSlotDate = this._adjustSlotDateForDrag(td.dataset.slotDate);
    if (!adjustedSlotDate) {
      td.classList.remove("drag-over");
      td.classList.add("drag-over-invalid");
      if (e?.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }

    // If dragging the latter part of a 15hp span, validate against the *start* slot.
    const adjustedTd = this.shadowRoot?.querySelector(
      `.gantt-table td.slot-cell[data-cohort-id="${td.dataset.cohortId}"][data-slot-date="${adjustedSlotDate}"]`
    );
    if (adjustedTd?.dataset?.disabled === "true") {
      td.classList.remove("drag-over");
      td.classList.add("drag-over-invalid");
      if (e?.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }

    this._dragDropManager.handleCellDragOver({
      detail: {
        slotDate: adjustedSlotDate,
        cohortId: Number(td.dataset.cohortId),
        cell: td,
      },
    });
  }

  _handleSlotCellDragLeave(e) {
    const td = e.currentTarget;
    if (!td) return;
    this._dragDropManager.handleCellDragLeave({
      detail: { cell: td },
    });
  }

  async _handleSlotCellDrop(e) {
    if (!this.isEditing) return;
    const td = e.currentTarget;
    if (!td || td.dataset.disabled === "true") return;

    e.preventDefault();

    const data = this._parseDragDataFromEvent(e);
    if (!data) return;

    const adjustedSlotDate = this._adjustSlotDateForDrag(td.dataset.slotDate);
    if (!adjustedSlotDate) return;

    // Reuse the same drop logic & cleanup (including overlay clearing).
    await this._handleCellDrop({
      detail: {
        data,
        slotDate: adjustedSlotDate,
        cohortId: Number(td.dataset.cohortId),
        cell: td,
      },
    });
  }

  /**
   * Scheduling-only prerequisite evaluation:
   * Uses transitive prerequisites (A -> B -> C implies A is prerequisite for C).
   * This does NOT modify persisted course prerequisites; it only affects UI warnings in scheduling.
   */
  _computeSchedulingPrerequisiteProblems() {
    const problems = [];
    const slotDates = [
      ...new Set((store.getSlots() || []).map((s) => s.start_date)),
    ].sort();

    const runsByCohort = new Map();
    for (const run of store.getCourseRuns() || []) {
      for (const cohortId of run.cohorts || []) {
        const list = runsByCohort.get(cohortId) || [];
        list.push(run);
        runsByCohort.set(cohortId, list);
      }
    }

    const courseById = new Map();
    for (const course of store.getCourses() || []) {
      courseById.set(course.course_id, course);
    }

    for (const cohort of store.getCohorts() || []) {
      const runsInCohort = runsByCohort.get(cohort.cohort_id) || [];

      // First pass: compute base problems using transitive prerequisites.
      const baseProblemCourseIds = new Set();

      for (const run of runsInCohort) {
        const course = courseById.get(run.course_id);
        if (!course) continue;

        const runSlot = store.getSlot(run.slot_id);
        if (!runSlot) continue;

        const allPrereqs = store.getAllPrerequisites(course.course_id) || [];
        const uniquePrereqs = new Set(allPrereqs);
        if (uniquePrereqs.size === 0) continue;

        const runDate = new Date(runSlot.start_date);

        for (const prereqId of uniquePrereqs) {
          const prereqCourse = courseById.get(prereqId);
          if (!prereqCourse) continue;

          const prereqRun =
            runsInCohort.find((r) => r.course_id === prereqId) || null;

          if (!prereqRun) {
            const problem = {
              type: "missing",
              cohortId: cohort.cohort_id,
              cohortName: cohort.name,
              courseId: course.course_id,
              courseName: course.name,
              courseCode: course.code,
              runId: run.run_id,
              missingPrereqId: prereqCourse.course_id,
              missingPrereqName: prereqCourse.name,
              missingPrereqCode: prereqCourse.code,
            };
            problems.push(problem);
            baseProblemCourseIds.add(course.course_id);
            continue;
          }

          const prereqSlot = store.getSlot(prereqRun.slot_id);
          if (!prereqSlot) continue;

          const prereqEndDate = this._getRunEndDate(prereqRun, slotDates);

          if (prereqEndDate && runDate <= prereqEndDate) {
            const problem = {
              type: "before_prerequisite",
              cohortId: cohort.cohort_id,
              cohortName: cohort.name,
              courseId: course.course_id,
              courseName: course.name,
              courseCode: course.code,
              runId: run.run_id,
              missingPrereqId: prereqCourse.course_id,
              missingPrereqName: prereqCourse.name,
              missingPrereqCode: prereqCourse.code,
            };
            problems.push(problem);
            baseProblemCourseIds.add(course.course_id);
          }
        }
      }

      // Second pass: propagate "blocked" status forward in the chain.
      // If any direct prerequisite has a problem, then the dependent course should
      // also be marked as problematic in scheduling (even if it's placed after all prereqs).
      const problemCourseIds = new Set(baseProblemCourseIds);
      let changed = true;
      while (changed) {
        changed = false;
        for (const run of runsInCohort) {
          const course = courseById.get(run.course_id);
          if (!course) continue;
          if (problemCourseIds.has(course.course_id)) continue;
          if (
            !Array.isArray(course.prerequisites) ||
            course.prerequisites.length === 0
          ) {
            continue;
          }

          const hasProblematicDirectPrereq = course.prerequisites.some((pid) =>
            problemCourseIds.has(pid)
          );
          if (hasProblematicDirectPrereq) {
            problemCourseIds.add(course.course_id);
            changed = true;
          }
        }
      }

      // Add a single "chain blocked" problem for each course that is only problematic
      // due to a prerequisite having its own issues.
      for (const run of runsInCohort) {
        const course = courseById.get(run.course_id);
        if (!course) continue;
        if (!problemCourseIds.has(course.course_id)) continue;
        if (baseProblemCourseIds.has(course.course_id)) continue;

        const directPrereqs = Array.isArray(course.prerequisites)
          ? course.prerequisites
          : [];
        const blocking = directPrereqs
          .map((pid) => courseById.get(pid))
          .filter(Boolean)
          .filter((c) => problemCourseIds.has(c.course_id))
          .sort((a, b) => (a.code || "").localeCompare(b.code || ""))[0];

        if (!blocking) continue;

        problems.push({
          type: "blocked_by_prerequisite_chain",
          cohortId: cohort.cohort_id,
          cohortName: cohort.name,
          courseId: course.course_id,
          courseName: course.name,
          courseCode: course.code,
          runId: run.run_id,
          missingPrereqId: blocking.course_id,
          missingPrereqName: blocking.name,
          missingPrereqCode: blocking.code,
        });
      }
    }

    return problems;
  }

  _getRunEndDate(run, slotDates) {
    const dates = this._getRunSlotDates(run, slotDates);
    const lastDate = dates.length ? dates[dates.length - 1] : null;

    const lastSlot =
      (lastDate
        ? (store.getSlots() || []).find((s) => s.start_date === lastDate)
        : null) || store.getSlot(run?.slot_id);

    const range = getSlotRange(lastSlot);
    return range?.end || null;
  }

  _computeCohortSlotOverlapWarnings() {
    const warnings = [];
    const slotDates = [
      ...new Set((store.getSlots() || []).map((s) => s.start_date)),
    ].sort();

    for (const cohort of store.getCohorts() || []) {
      const runsInCohort = (store.getCourseRuns() || []).filter((r) =>
        this._runHasCohort(r, cohort.cohort_id)
      );

      const uniqueCoursesBySlotDate = new Map();
      for (const run of runsInCohort) {
        if (run?.course_id == null) continue;
        const dates = this._getRunSlotDates(run, slotDates);
        if (dates.length === 0) continue;

        for (const dateStr of dates) {
          const courseIds = uniqueCoursesBySlotDate.get(dateStr) || new Set();
          courseIds.add(run.course_id);
          uniqueCoursesBySlotDate.set(dateStr, courseIds);
        }
      }

      for (const [dateStr, set] of uniqueCoursesBySlotDate.entries()) {
        if (set.size > 1) {
          warnings.push({
            ruleId: "maxOneCoursePerSlot",
            cohortId: cohort.cohort_id,
            slotDate: dateStr,
          });
        }
      }
    }

    return warnings;
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

  _formatDateYYMMDD(dateStr) {
    if (typeof dateStr !== "string") return "";
    const normalized = dateStr.split("T")[0];
    const parts = normalized.split("-");
    if (parts.length !== 3) return dateStr;
    const [yyyy, mm, dd] = parts;
    const yy = String(yyyy).slice(-2);
    if (!yy || !mm || !dd) return dateStr;
    return `${yy}${mm}${dd}`;
  }

  _runHasCohort(run, cohortId) {
    if (!run || cohortId == null) return false;
    if (!Array.isArray(run.cohorts)) return false;
    return run.cohorts.some((id) => String(id) === String(cohortId));
  }

  _renderSummaryRow(slotDates) {
    return html`
      <tr>
        <td class="summary-label" colspan="2">Kurser & Lärare:</td>
        ${slotDates.map((dateStr) => this._renderSummaryCell(dateStr))}
      </tr>
    `;
  }

  _renderSummaryCell(slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return html`<td class="summary-cell"></td>`;

    const runsInSlot = (store.getCourseRuns() || [])
      .filter((run) => this._runCoversSlotId(run, slot.slot_id))
      // Ignore orphan runs with no cohort (they shouldn't count as "scheduled" in the grid)
      .filter(
        (run) =>
          Array.isArray(run.cohorts) && run.cohorts.some((id) => id != null)
      );

    const courseMap = new Map();
    for (const run of runsInSlot) {
      const course = store.getCourse(run.course_id);
      if (!course) continue;

      if (!courseMap.has(course.course_id)) {
        courseMap.set(course.course_id, {
          course,
          runs: [],
          assignedTeachers: new Set(),
          totalParticipants: 0,
        });
      }
      const entry = courseMap.get(course.course_id);
      entry.runs.push(run);

      // cohorts -> participants
      if (Array.isArray(run.cohorts)) {
        for (const cohortId of run.cohorts) {
          const cohort = store.getCohort(cohortId);
          if (cohort) entry.totalParticipants += cohort.planned_size || 0;
        }
      }

      if (Array.isArray(run.teachers)) {
        run.teachers.forEach((tid) => entry.assignedTeachers.add(tid));
      }
    }

    const items = Array.from(courseMap.values()).sort((a, b) =>
      (a.course?.name || "").localeCompare(b.course?.name || "")
    );

    return html`
      <td class="summary-cell">
        ${items.map((item) => {
          const course = item.course;
          const bgColor = this._getCourseColor(course);
          const assignedTeacherIds = Array.from(item.assignedTeachers);
          const compatibleTeachers = getCompatibleTeachersForCourse(
            course.course_id
          );
          const currentKursansvarigId =
            item.runs.length > 0 ? item.runs[0].kursansvarig_id : null;

          return html`
            <div class="summary-course" style="background-color: ${bgColor};">
              <div class="course-header">
                <span class="course-name" title="${course.name}"
                  >${course.code}</span
                >
                <span class="participant-count"
                  >${item.totalParticipants} st</span
                >
              </div>

              <div class="summary-teacher-header">
                <span class="summary-column-title">Tilldelad</span>
                <span class="summary-column-title">Kursansvar</span>
              </div>
              <div class="summary-teacher-list">
                ${compatibleTeachers.length === 0
                  ? null
                  : compatibleTeachers.map((teacher) => {
                      const isAssigned = assignedTeacherIds.includes(
                        teacher.teacher_id
                      );
                      const availability =
                        this._teacherAvailabilityForCourseInSlot({
                          teacherId: teacher.teacher_id,
                          slot,
                          slotDate,
                          courseId: course.course_id,
                        });
                      const isKursansvarig =
                        Number(currentKursansvarigId) === teacher.teacher_id;
                      const baseClass = isAssigned
                        ? "assigned-course"
                        : "has-course";
                      const rowClassName = [
                        "summary-teacher-row",
                        baseClass,
                        availability.classNameSuffix,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      const pillClassName = [
                        "summary-teacher-pill",
                        isKursansvarig ? "is-kursansvarig" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return html`
                        <div
                          class="${rowClassName}"
                          title=${availability.titleText}
                        >
                          <button
                            class="${pillClassName}"
                            type="button"
                            style="position: relative;"
                            ?disabled=${!this.isEditing}
                            aria-pressed=${isAssigned ? "true" : "false"}
                            @click=${() => {
                              this._toggleTeacherAssignment({
                                runs: item.runs,
                                teacherId: teacher.teacher_id,
                                checked: !isAssigned,
                                slotDate,
                              });
                            }}
                          >
                            <span class="summary-toggle-text"
                              >${teacher.name}</span
                            >
                          </button>
                          <div class="summary-kursansvarig-cell">
                            ${isAssigned
                              ? html`
                                  <input
                                    type="checkbox"
                                    class="kursansvarig-checkbox"
                                    name="kursansvarig-${course.course_id}-${slot.slot_id}"
                                    .checked=${isKursansvarig}
                                    ?disabled=${!this.isEditing}
                                    aria-label="${isKursansvarig
                                      ? `Ta bort ${teacher.name} som kursansvarig`
                                      : `Välj ${teacher.name} som kursansvarig`}"
                                    title="${isKursansvarig
                                      ? "Kursansvarig (klicka för att ta bort)"
                                      : "Välj som kursansvarig"}"
                                    @change=${(e) =>
                                      this._handleKursansvarigChange(
                                        e,
                                        item.runs,
                                        teacher.teacher_id
                                      )}
                                    @keydown=${(e) =>
                                      this._handleKursansvarigKeydown(
                                        e,
                                        item.runs,
                                        teacher.teacher_id
                                      )}
                                  />
                                `
                              : null}
                          </div>
                        </div>
                      `;
                    })}
              </div>
            </div>
          `;
        })}
      </td>
    `;
  }

  _runCoversSlotId(run, slotId) {
    if (!run || slotId == null) return false;
    if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
      return run.slot_ids.some((id) => String(id) === String(slotId));
    }
    if (String(run.slot_id) === String(slotId)) return true;

    const span = this._getRunSpan(run);
    if (!Number.isFinite(span) || span <= 1) return false;

    const ordered = (store.getSlots() || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.start_date) - new Date(b.start_date) ||
          Number(a.slot_id) - Number(b.slot_id)
      );
    const indexById = new Map(
      ordered.map((s, idx) => [String(s.slot_id), idx])
    );
    const startIdx = indexById.get(String(run.slot_id));
    const targetIdx = indexById.get(String(slotId));
    if (!Number.isFinite(startIdx) || !Number.isFinite(targetIdx)) return false;
    return targetIdx >= startIdx && targetIdx < startIdx + span;
  }

  _teacherAvailabilityForCourseInSlot({ teacherId, slot, slotDate, courseId }) {
    const normalizeDate = (v) => (v || "").split("T")[0];
    const slotDays = (store.getSlotDays(slot.slot_id) || [])
      .map(normalizeDate)
      .filter(Boolean);

    const hasSlotBusyEntry = (store.teacherAvailability || []).some(
      (a) =>
        String(a.teacher_id) === String(teacherId) &&
        String(a.slot_id) === String(slot.slot_id) &&
        a.type === "busy"
    );

    const isUnavailableOnDay = (day) =>
      hasSlotBusyEntry || store.isTeacherUnavailableOnDay(teacherId, day);

    const unavailableDaysInSlot = hasSlotBusyEntry
      ? slotDays
      : slotDays.filter((d) => store.isTeacherUnavailableOnDay(teacherId, d));

    let classNameSuffix = "";
    if (unavailableDaysInSlot.length > 0) {
      const activeDays = (
        store.getActiveCourseDaysInSlot(slot.slot_id, courseId) || []
      )
        .map(normalizeDate)
        .filter(Boolean)
        .filter((d) => slotDays.includes(d));

      if (activeDays.length > 0) {
        const unavailableActiveDays = activeDays.filter((d) =>
          isUnavailableOnDay(d)
        );
        if (unavailableActiveDays.length === 0) {
          classNameSuffix = "partial-availability";
        } else if (unavailableActiveDays.length === activeDays.length) {
          classNameSuffix = "course-unavailable";
        } else {
          classNameSuffix = "partial-conflict";
        }
      }
    }

    const titleText =
      classNameSuffix === "course-unavailable"
        ? "Otillgänglig för kursens kursdagar"
        : classNameSuffix === "partial-conflict"
        ? "Delvis otillgänglig för kursens kursdagar"
        : classNameSuffix === "partial-availability"
        ? "Otillgänglig i perioden (men inte på kursens kursdagar)"
        : store.isTeacherUnavailable(teacherId, slotDate, slot.slot_id)
        ? "Otillgänglig i perioden"
        : "Tillgänglig";

    return { classNameSuffix, titleText };
  }

  _getCourseColor(course) {
    if (!course) return "#666";
    // Keep consistent with gantt blocks (simple deterministic color list).
    const colors = [
      "#2ecc71",
      "#3498db",
      "#e67e22",
      "#1abc9c",
      "#e74c3c",
      "#f39c12",
      "#16a085",
      "#d35400",
      "#27ae60",
      "#2980b9",
      "#c0392b",
      "#f1c40f",
      "#00cec9",
      "#0984e3",
      "#00b894",
      "#fdcb6e",
    ];
    const colorIndex = (course.course_id || 0) % colors.length;
    return colors[colorIndex];
  }

  _handleDepotDragStart(e) {
    if (!this.isEditing) return;
    this._dragDropManager.handleDepotDragStart(e);
  }

  _handleCourseDragStart(e) {
    if (!this.isEditing) return;
    this._dragDropManager.handleCourseDragStart(e);
  }

  _handleDragEnd() {
    this._dragDropManager.handleDragEnd();
  }

  _handleCellDragOver(e) {
    this._dragDropManager.handleCellDragOver(e);
  }

  _handleCellDragLeave(e) {
    this._dragDropManager.handleCellDragLeave(e);
  }

  async _handleCellDrop(e) {
    let dropResult = null;
    try {
      dropResult = this._dragDropManager.handleCellDrop(e);

      if (dropResult) {
        const { type, data, slotDate, cohortId } = dropResult;
        if (type === "depot") {
          await CourseRunManager.createRunFromDepot(data, slotDate, cohortId);
        } else if (type === "existing") {
          await CourseRunManager.moveExistingRun(data, slotDate, cohortId);
        }
        this.requestUpdate();
      }
    } catch (error) {
      console.error("Kunde inte spara förändringen i schemat:", error);
    } finally {
      // Some browsers/components can miss dragend when the dragged element is re-rendered.
      // Ensure we always clear the header "availability bubbles" after drop.
      this._dragDropManager.handleDragEnd();
    }
  }

  _handleDepotDragOver(e) {
    if (!this.isEditing) return;
    this._dragDropManager.handleDepotDragOver(e);
  }

  _handleDepotDragLeave(e) {
    if (!this.isEditing) return;
    this._dragDropManager.handleDepotDragLeave(e);
  }

  async _handleDepotDrop(e) {
    if (!this.isEditing) return;
    let dropResult = null;
    try {
      dropResult = this._dragDropManager.handleDepotDrop(e);

      if (dropResult) {
        const { runId, targetCohortId } = dropResult;
        await CourseRunManager.removeCourseRunFromCohort(runId, targetCohortId);
        this.requestUpdate();
      }
    } catch (error) {
      console.error("Kunde inte ta bort kurstillfälle:", error);
    } finally {
      // Ensure overlays never "stick" after a drop back to depot.
      this._dragDropManager.handleDragEnd();
    }
  }

  async _toggleTeacherAssignment({ runs, teacherId, checked, slotDate }) {
    if (!this.isEditing) return;
    try {
      await CourseRunManager.toggleTeacherAssignment(
        runs,
        teacherId,
        checked,
        slotDate
      );
      this.requestUpdate();
    } catch (error) {
      console.error("Kunde inte uppdatera lärarplacering:", error);
    }
  }

  async _handleKursansvarigChange(event, runs, teacherId) {
    event?.stopPropagation?.();

    if (!this.isEditing) return;

    const isChecked = event.target.checked;
    const targetId = isChecked ? teacherId : null;

    try {
      await CourseRunManager.setCourseRunKursansvarig(runs, targetId);
      this.requestUpdate();
    } catch (error) {
      console.error("Kunde inte sätta kursansvarig:", error);
    }
  }

  _handleKursansvarigKeydown(event, runs, teacherId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      this._handleKursansvarigChange(event, runs, teacherId);
    }
  }

  _showAvailableTeachersForDrag(cohortId, courseId) {
    this._setTeacherOverlayForCourse(courseId);
  }

  _showAvailableTeachersForDragAllCohorts(courseId) {
    this._setTeacherOverlayForCourse(courseId);
  }

  _clearAvailableTeachersOverlays() {
    this._dragCourseId = null;
    this._teacherOverlayChipsBySlotDate = new Map();
    this._shouldShowTeacherAvailabilityOverlay = false;
    this._stopAvailabilityHeaderAutoScroll();
    this._applyColumnTeacherShortageClasses();
    this.requestUpdate();
  }

  _setTeacherOverlayForCourse(courseId) {
    this._dragCourseId = courseId;

    const slotDates = [
      ...new Set((store.getSlots() || []).map((s) => s.start_date)),
    ].sort();
    const map = new Map();

    slotDates.forEach((slotDate) => {
      map.set(slotDate, this._computeTeacherOverlayChips(courseId, slotDate));
    });

    const compatibleCount = getCompatibleTeachersForCourse(courseId).length;
    this._shouldShowTeacherAvailabilityOverlay = compatibleCount > 0;

    this._teacherOverlayChipsBySlotDate = map;
    this._applyColumnTeacherShortageClasses();
    this.requestUpdate();
  }

  _computeTeacherOverlayChips(courseId, slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return [];

    const normalizeDate = (v) => (v || "").split("T")[0];
    const slotDays = (store.getSlotDays(slot.slot_id) || [])
      .map(normalizeDate)
      .filter(Boolean);

    const runsCoveringSlot = (store.getCourseRuns() || []).filter((run) =>
      this._runCoversSlotId(run, slot.slot_id)
    );

    const isTeacherOccupiedInSlot = (teacherId) =>
      runsCoveringSlot.some(
        (run) =>
          Array.isArray(run.teachers) &&
          run.teachers.some((tid) => String(tid) === String(teacherId))
      );

    const hasSlotBusyEntry = (teacherId) =>
      (store.teacherAvailability || []).some(
        (a) =>
          String(a.teacher_id) === String(teacherId) &&
          String(a.slot_id) === String(slot.slot_id) &&
          a.type === "busy"
      );

    const isTeacherMarkedUnavailableInSlot = (teacherId) => {
      if (hasSlotBusyEntry(teacherId)) return true;
      if (
        typeof store.isTeacherUnavailable === "function" &&
        store.isTeacherUnavailable(teacherId, slotDate, slot.slot_id)
      ) {
        return true;
      }
      return slotDays.some((day) =>
        store.isTeacherUnavailableOnDay(teacherId, day)
      );
    };

    return getCompatibleTeachersForCourse(courseId)
      .filter((teacher) => !isTeacherOccupiedInSlot(teacher.teacher_id))
      .filter(
        (teacher) => !isTeacherMarkedUnavailableInSlot(teacher.teacher_id)
      )
      .map((teacher) => {
        const label = (teacher.name || "").split(" ")[0] || teacher.name || "";
        return {
          teacherId: teacher.teacher_id,
          label,
          status: "drag-available",
          title: "Tillgänglig",
        };
      });
  }

  _applyColumnTeacherShortageClasses() {
    if (!this.shadowRoot) return;

    // Clear all existing shortage marks first.
    this.shadowRoot
      .querySelectorAll(".gantt-table td.slot-cell.no-teachers-available")
      .forEach((td) => td.classList.remove("no-teachers-available"));
  }
}

customElements.define("scheduling-tab", SchedulingTab);
