import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";

/**
 * Scheduling Tab - Gantt view for course planning
 * 
 * Note: This component currently uses methods from the parent report-viewer.
 * TODO: Move all Gantt-related methods from report-viewer to this component.
 */
export class SchedulingTab extends LitElement {
  static properties = {
    _draggingTwoBlock: { type: Boolean },
    _draggingFromDepot: { type: Boolean },
    _draggingFromCohortId: { type: Number },
    _draggingCourseId: { type: Number },
  };

  static styles = css`
    :host {
      display: block;
    }

    .panel {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1.5rem;
      overflow-x: auto;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .panel-header h3 {
      margin: 0;
    }

    .legend {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-box {
      width: 30px;
      height: 20px;
      border-radius: 3px;
      border: 1px solid #ddd;
    }

    .law-course.law-order-1 {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    }

    .law-course.law-order-2 {
      background: linear-gradient(135deg, #ff8c00 0%, #ffb347 100%);
    }

    .law-course.law-order-3 {
      background: linear-gradient(135deg, #dc143c 0%, #ff6b6b 100%);
    }

    .law-course.law-order-rest {
      background: linear-gradient(135deg, #9370db 0%, #ba94d1 100%);
    }

    .normal-course {
      background: #e3f2fd;
    }

    .two-block-course {
      border: 2px dashed #555;
    }

    .gantt-scroll-wrapper {
      overflow-x: auto;
      margin-top: 1rem;
    }

    .gantt-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
    }

    .gantt-table th,
    .gantt-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
      min-width: 100px;
    }

    .gantt-table th {
      background: #f5f5f5;
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .cohort-header {
      position: sticky;
      left: 0;
      z-index: 3;
      background: #f5f5f5;
    }
  `;

  constructor() {
    super();
    this._draggingTwoBlock = false;
    this._draggingFromDepot = false;
    this._draggingFromCohortId = null;
    this._draggingCourseId = null;
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    // This is a placeholder - the actual Gantt view rendering
    // will need to be moved from report-viewer.js
    return html`
      <div class="panel">
        <div class="panel-header">
          <henry-text variant="heading-3">
            Gantt-vy: Planeringsöversikt
          </henry-text>
        </div>
        <p style="color: #666; font-size: 0.9rem;">
          TODO: Flytta Gantt-vy från report-viewer till denna komponent.
          För tillfället visas Gantt-vyn fortfarande via report-viewer.
        </p>
      </div>
    `;
  }
}

customElements.define("scheduling-tab", SchedulingTab);
