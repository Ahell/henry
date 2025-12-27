import { store } from "../../../platform/store/DataStore.js";

/**
 * Drag-Drop Manager Service
 * Manages drag-drop state and interactions for the scheduling Gantt view
 */
export class DragDropManager {
  constructor(component) {
    this.component = component;
    this.state = {
      draggingFromDepot: false,
      draggingFromCohortId: null,
      draggingRunId: null,
      draggingCourseId: null,
      draggingSlotOffset: 0,
      draggedCells: [],
    };
  }

  /**
   * Handle drag start from depot
   */
  handleDepotDragStart(e) {
    const { courseId, cohortId } = e.detail;
    this.state.draggingFromDepot = true;
    this.state.draggingFromCohortId = cohortId;
    this.state.draggingRunId = null;
    this.state.draggingCourseId = courseId;
    this.state.draggingSlotOffset = 0;

    // Trigger teacher availability overlay for all cohorts
    this.component._showAvailableTeachersForDragAllCohorts(courseId);
  }

  /**
   * Handle drag start from existing course run
   */
  handleCourseDragStart(e) {
    const { courseId, cohortId, slotOffset } = e.detail;
    this.state.draggingFromDepot = false;
    this.state.draggingFromCohortId = cohortId;
    this.state.draggingRunId = e.detail?.runId ?? null;
    this.state.draggingCourseId = courseId;
    this.state.draggingSlotOffset = Number.isFinite(Number(slotOffset))
      ? Number(slotOffset)
      : 0;

    // Trigger teacher availability overlay for specific cohort
    this.component._showAvailableTeachersForDrag(cohortId, courseId);
  }

  /**
   * Handle drag end - cleanup state and visual indicators
   */
  handleDragEnd() {
    this.state.draggingFromDepot = false;
    this.state.draggingFromCohortId = null;
    this.state.draggingRunId = null;
    this.state.draggingCourseId = null;
    this.state.draggingSlotOffset = 0;

    // Clear teacher availability overlays
    this.component._clearAvailableTeachersOverlays();

    // Remove drag-over classes from cells
    this.state.draggedCells.forEach((cell) => {
      const td = cell.closest("td");
      if (td) {
        td.classList.remove(
          "drag-over",
          "drag-over-invalid",
          "no-teachers-available"
        );
      }
    });

    this.state.draggedCells = [];
  }

  /**
   * Handle cell drag over - apply visual feedback
   */
  handleCellDragOver(e) {
    const { slotDate, cohortId, cell } = e.detail;
    const td = cell.closest("td");
    if (!td) return;

    const isDisabled = td.dataset.disabled === "true";
    const isInvalidCohort =
      this.state.draggingFromCohortId &&
      this.state.draggingFromCohortId !== cohortId;
    const isSpanOverlapInvalid = this.isSkewedOverlapForDrag(slotDate);

    if (isInvalidCohort || isDisabled || isSpanOverlapInvalid) {
      td.classList.remove("drag-over");
      td.classList.add("drag-over-invalid");
    } else {
      td.classList.remove("drag-over-invalid");
      td.classList.add("drag-over");
    }

    if (!this.state.draggedCells.includes(cell)) {
      this.state.draggedCells.push(cell);
    }

    return isInvalidCohort || isDisabled || isSpanOverlapInvalid;
  }

  /**
   * Handle cell drag leave - remove visual feedback
   */
  handleCellDragLeave(e) {
    const { cell } = e.detail;
    const td = cell.closest("td");
    if (td) {
      td.classList.remove("drag-over", "drag-over-invalid");
    }
  }

  /**
   * Handle cell drop - delegate to appropriate handler
   */
  handleCellDrop(e) {
    const { data, slotDate, cohortId, cell } = e.detail;
    const td = cell.closest("td");
    if (td) {
      td.classList.remove("drag-over", "drag-over-invalid");
      const nextTd = td.nextElementSibling;
      if (nextTd && nextTd.classList.contains("slot-cell")) {
        nextTd.classList.remove("drag-over", "drag-over-invalid");
      }
    }

    if (this.isSkewedOverlapForDrag(slotDate)) {
      return null;
    }

    // Note: We don't block drops based on teacher availability
    // The "no-teachers-available" class is purely for visualization
    // Users should be able to schedule courses even if teachers are marked as unavailable

    if (data.fromDepot) {
      return { type: "depot", data, slotDate, cohortId };
    } else {
      return { type: "existing", data, slotDate, cohortId };
    }
  }

  /**
   * Handle depot drag over - allow drop if not dragging from depot
   */
  handleDepotDragOver(e) {
    if (!this.state.draggingFromDepot) {
      e.preventDefault();
      e.currentTarget.classList.add("drag-over");
    }
  }

  /**
   * Handle depot drag leave
   */
  handleDepotDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  /**
   * Handle depot drop - return drop info for processing
   */
  handleDepotDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch (err) {
      return null;
    }

    if (data.fromDepot) {
      return null; // Can't drop depot item back to depot
    }

    const runId = parseInt(data.runId);
    const targetCohortId = parseInt(e.currentTarget.dataset.cohortId);

    return { runId, targetCohortId };
  }

  /**
   * Check if the same course exists in a slot
   * Used for cross-cohort drag validation
   */
  isSameCourseInSlot(slotDate, courseId) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return false;

    return store
      .getCourseRuns()
      .some((r) => r.slot_id === slot.slot_id && r.course_id === courseId);
  }

  /**
   * Get current drag state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Check if currently dragging
   */
  isDragging() {
    return this.state.draggingCourseId !== null;
  }

  /**
   * Check if dragging from depot
   */
  isDraggingFromDepot() {
    return this.state.draggingFromDepot;
  }

  _sortedSlotDates() {
    return [...new Set((store.getSlots() || []).map((s) => s.start_date))].sort();
  }

  _slotIdxByDate(slotDates) {
    return new Map((slotDates || []).map((d, idx) => [String(d), idx]));
  }

  _getRunStartIdx(run, slotDates, slotIdxByDate) {
    if (!run) return null;
    if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
      const idxs = run.slot_ids
        .map((sid) => store.getSlot(sid)?.start_date)
        .map((d) => (d ? slotIdxByDate.get(String(d)) : null))
        .filter((v) => Number.isFinite(v));
      if (idxs.length > 0) return Math.min(...idxs);
    }

    const startDate = store.getSlot(run.slot_id)?.start_date;
    const startIdx = startDate ? slotIdxByDate.get(String(startDate)) : null;
    if (!Number.isFinite(startIdx)) return null;
    if (startIdx < 0 || startIdx >= slotDates.length) return null;
    return startIdx;
  }

  _getRunSpan(run) {
    if (!run) return 1;
    const spanFromRun = Number(run?.slot_span);
    if (Number.isFinite(spanFromRun) && spanFromRun >= 2) return spanFromRun;
    const course = store.getCourse(run.course_id);
    return Number(course?.credits) === 15 ? 2 : 1;
  }

  _getCandidateSpan(courseId, runId) {
    const run =
      runId != null
        ? (store.getCourseRuns() || []).find(
            (r) => String(r.run_id) === String(runId)
          )
        : null;
    const spanFromRun = Number(run?.slot_span);
    if (Number.isFinite(spanFromRun) && spanFromRun >= 2) return spanFromRun;
    const course = store.getCourse(courseId);
    return Number(course?.credits) === 15 ? 2 : 1;
  }

  _getDragRun() {
    const runId = this.state.draggingRunId;
    if (runId == null) return null;
    return (store.getCourseRuns() || []).find(
      (r) => String(r.run_id) === String(runId)
    );
  }

  _hasSkewedSpanOverlap({
    courseId,
    candidateStartIdx,
    candidateSpan,
    slotDates,
    slotIdxByDate,
    excludeRunId = null,
  }) {
    if (!Number.isFinite(candidateStartIdx) || candidateSpan <= 1) return false;
    const candidateEndExclusive = candidateStartIdx + candidateSpan;

    for (const run of store.getCourseRuns() || []) {
      if (excludeRunId != null && String(run.run_id) === String(excludeRunId)) {
        continue;
      }
      if (Number(run.course_id) !== Number(courseId)) continue;

      const runStartIdx = this._getRunStartIdx(run, slotDates, slotIdxByDate);
      if (!Number.isFinite(runStartIdx)) continue;
      if (runStartIdx === candidateStartIdx) continue;

      const runSpan = this._getRunSpan(run);
      if (runSpan <= 1) continue;

      const runEndExclusive = runStartIdx + runSpan;
      const overlaps =
        candidateStartIdx < runEndExclusive && runStartIdx < candidateEndExclusive;
      if (overlaps) return true;
    }
    return false;
  }

  isSkewedOverlapForDrag(slotDate) {
    const courseId = this.state.draggingCourseId;
    if (courseId == null) return false;

    const slotDates = this._sortedSlotDates();
    const slotIdxByDate = this._slotIdxByDate(slotDates);
    const candidateStartIdx = slotIdxByDate.get(String(slotDate));
    if (!Number.isFinite(candidateStartIdx)) return false;

    const candidateSpan = this._getCandidateSpan(
      courseId,
      this.state.draggingRunId
    );
    if (candidateSpan <= 1) return false;

    const dragRun = this._getDragRun();
    const dragRunCohorts = Array.isArray(dragRun?.cohorts)
      ? dragRun.cohorts.filter((id) => id != null)
      : [];
    const excludeRunId =
      dragRunCohorts.length > 1 ? null : this.state.draggingRunId;

    return this._hasSkewedSpanOverlap({
      courseId,
      candidateStartIdx,
      candidateSpan,
      slotDates,
      slotIdxByDate,
      excludeRunId,
    });
  }
}
