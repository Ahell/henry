import { css } from "lit";

export const schedulingTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
  }

  .warning-pills {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .header-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .warning-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    background: var(--color-danger);
    color: white;
    padding: var(--space-1) var(--space-3);
    border-radius: 16px;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    animation: pulse-pill 1.5s infinite;
  }

  .warning-pill .cohort-name {
    font-weight: var(--font-weight-semibold);
  }

  @keyframes pulse-pill {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.02);
    }
  }

  .legend {
    display: flex;
    gap: var(--space-8);
    margin-top: var(--space-4);
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
  }

  .legend-box {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
  }

  .law-course.law-order-1 {
    background: var(--color-secondary-900);
  }

  .law-course.law-order-2 {
    background: var(--color-secondary-700);
  }

  .law-course.law-order-3 {
    background: var(--color-secondary-500);
  }

  .law-course.law-order-rest {
    background: var(--color-secondary-300);
  }

  .normal-course {
    background: var(--color-primary-500);
  }

  .teacher-shortage {
    background: var(--color-primary-500);
    outline: 3px solid var(--color-info);
    outline-offset: 1px;
  }

  .two-block-course {
    border: 2px dashed rgba(255, 255, 255, 0.7);
  }

  .gantt-scroll-wrapper {
    overflow-x: auto;
    overflow-y: auto;
    max-height: calc(100vh - 220px);
    padding-bottom: 15px;
  }

  .gantt-table {
    border-collapse: collapse;
    min-width: 100%;
  }

  .gantt-table th,
  .gantt-table td {
    border: 1px solid var(--color-border);
    padding: 0;
    min-width: 100px;
    width: 100px;
    height: 44px;
    text-align: center;
    vertical-align: middle;
  }

  .gantt-table th {
    background: var(--color-gray-200);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    padding: var(--space-1) var(--space-1);
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: var(--shadow-sm);
  }

  .gantt-table th.cohort-header {
    min-width: 70px;
    width: 70px;
    text-align: left;
    padding-left: var(--space-2);
    position: sticky;
    background: var(--color-gray-200);
    z-index: 20;
    box-shadow: var(--shadow-sm);
  }

  .gantt-table th.cohort-header:first-child {
    left: 0;
    min-width: 180px;
    width: 180px;
  }

  .gantt-table th.cohort-header:nth-child(2) {
    left: 180px;
  }

  .gantt-table td.depot-cell {
    min-width: 180px;
    width: 180px;
    max-width: 180px;
    background: var(--color-surface);
    position: sticky;
    left: 0;
    z-index: 5;
    vertical-align: top;
    padding: var(--space-1);
  }

  .gantt-table td.depot-cell.drag-over {
    background: var(--color-warning-light) !important;
    box-shadow: inset 0 0 0 2px var(--color-warning);
  }

  .gantt-table td.cohort-cell {
    min-width: 70px;
    width: 70px;
    text-align: left;
    padding-left: var(--space-2);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-xs);
    background: var(--color-gray-50);
    position: sticky;
    left: 180px;
    z-index: 5;
  }

  .gantt-table td.slot-cell {
    background: var(--color-surface);
    position: relative;
    cursor: pointer;
    transition: var(--transition-fast);
    overflow: visible;
    min-width: 85px;
    width: 85px;
    vertical-align: top;
  }

  .gantt-table td.slot-cell:hover {
    background: var(--color-info-light);
  }

  .gantt-table td.slot-cell.drag-over {
    background: var(--color-info-light);
    box-shadow: inset 0 0 0 2px var(--color-info);
  }

  .gantt-table td.slot-cell.drag-over-invalid {
    background: var(--color-danger-light);
    box-shadow: inset 0 0 0 2px var(--color-danger);
  }

  .gantt-table td.slot-cell.no-teachers-available {
    background: var(--color-danger-light) !important;
    box-shadow: inset 0 0 0 2px var(--color-danger);
  }

  .gantt-table td.slot-cell.disabled-slot {
    background: var(--color-gray-300);
    cursor: not-allowed;
    opacity: 0.5;
  }

  .gantt-table td.slot-cell.disabled-slot:hover {
    background: var(--color-gray-300);
  }

  .gantt-table td.slot-cell.cohort-start-slot {
    position: relative;
  }

  .gantt-table tfoot td {
    background: var(--color-gray-200);
    vertical-align: top;
    padding: var(--space-1);
    border-top: 2px solid var(--color-gray-300);
  }
`;
