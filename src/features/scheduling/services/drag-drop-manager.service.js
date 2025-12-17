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
      draggingCourseId: null,
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
    this.state.draggingCourseId = courseId;

    // Trigger teacher availability overlay for all cohorts
    this.component._showAvailableTeachersForDragAllCohorts(courseId);
  }

  /**
   * Handle drag start from existing course run
   */
  handleCourseDragStart(e) {
    const { courseId, cohortId } = e.detail;
    this.state.draggingFromDepot = false;
    this.state.draggingFromCohortId = cohortId;
    this.state.draggingCourseId = courseId;

    // Trigger teacher availability overlay for specific cohort
    this.component._showAvailableTeachersForDrag(cohortId, courseId);
  }

  /**
   * Handle drag end - cleanup state and visual indicators
   */
  handleDragEnd() {
    this.state.draggingFromDepot = false;
    this.state.draggingFromCohortId = null;
    this.state.draggingCourseId = null;

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
      this.state.draggingFromCohortId !== cohortId &&
      !this.isSameCourseInSlot(slotDate, this.state.draggingCourseId);

    if (isInvalidCohort || isDisabled) {
      td.classList.remove("drag-over");
      td.classList.add("drag-over-invalid");
    } else {
      td.classList.remove("drag-over-invalid");
      td.classList.add("drag-over");
    }

    if (!this.state.draggedCells.includes(cell)) {
      this.state.draggedCells.push(cell);
    }
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
}
