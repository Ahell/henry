import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import "./gantt-course-block.js";
import { ganttCellStyles } from "../styles/gantt-cell.styles.js";

/**
 * Gantt Cell Component - A single cell in the Gantt table
 * Handles drop events for course scheduling
 */
export class GanttCell extends LitElement {
  static properties = {
    slotDate: { type: String },
    cohortId: { type: Number },
    runs: { type: Array },
    continuationRuns: { type: Array },
    isBeforeCohortStart: { type: Boolean },
    isCohortStartSlot: { type: Boolean },
    cohortStartDate: { type: String },
    prerequisiteProblems: { type: Array },
  };

  static styles = ganttCellStyles;

  constructor() {
    super();
    this.slotDate = "";
    this.cohortId = null;
    this.runs = [];
    this.continuationRuns = [];
    this.isBeforeCohortStart = false;
    this.isCohortStartSlot = false;
    this.cohortStartDate = "";
    this.prerequisiteProblems = [];
  }

  render() {
    return html`
      <div
        class="cell-content"
        @dragover="${this._handleDragOver}"
        @dragleave="${this._handleDragLeave}"
        @drop="${this._handleDrop}"
      >
        ${this.isCohortStartSlot
          ? html`<span class="cohort-start-marker"
              >Start ${this.cohortStartDate}</span
            >`
          : ""}
        ${this.runs.map(
          (run) => html`
            <gantt-course-block
              .run="${run}"
              .cohortId="${this.cohortId}"
              .isSecondBlock="${false}"
              .prerequisiteProblems="${this.prerequisiteProblems}"
            ></gantt-course-block>
          `
        )}
        ${this.continuationRuns.map(
          (run) => html`
            <gantt-course-block
              .run="${run}"
              .cohortId="${this.cohortId}"
              .isSecondBlock="${true}"
              .prerequisiteProblems="${this.prerequisiteProblems}"
            ></gantt-course-block>
          `
        )}
      </div>
    `;
  }

  _handleDragOver(e) {
    if (this.isBeforeCohortStart) {
      e.dataTransfer.dropEffect = "none";
      return;
    }

    e.preventDefault();

    // Dispatch event to parent for validation
    this.dispatchEvent(
      new CustomEvent("cell-drag-over", {
        detail: {
          slotDate: this.slotDate,
          cohortId: this.cohortId,
          cell: this,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleDragLeave(e) {
    this.dispatchEvent(
      new CustomEvent("cell-drag-leave", {
        detail: { cell: this },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleDrop(e) {
    if (this.isBeforeCohortStart) {
      return;
    }

    e.preventDefault();

    let data;
    try {
      const rawData = e.dataTransfer.getData("text/plain");
      data = JSON.parse(rawData);
    } catch (err) {
      console.error("Error parsing drag data:", err);
      return;
    }

    // Dispatch event to parent to handle the drop
    this.dispatchEvent(
      new CustomEvent("cell-drop", {
        detail: {
          data,
          slotDate: this.slotDate,
          cohortId: this.cohortId,
          cell: this,
        },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("gantt-cell", GanttCell);
