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
      <div class="cell-content">
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
}

customElements.define("gantt-cell", GanttCell);
