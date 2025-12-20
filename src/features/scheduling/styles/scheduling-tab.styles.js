import { css } from "lit";

export const schedulingTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
    --gantt-depot-width: 240px;
    --gantt-cohort-width: 96px;
    --gantt-slot-width: 120px;
    --gantt-row-height: 220px;
    --gantt-availability-row-height: 78px;
    --gantt-date-row-height: 32px;
    --availability-chip-gap: 4px;
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
    background: var(--color-danger-light);
    color: var(--color-danger-hover);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  .warning-pill .cohort-name {
    font-weight: var(--font-weight-semibold);
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
    color: var(--color-text-secondary);
  }

  .legend-box {
    width: 14px;
    height: 14px;
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-xs);
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
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xs);
  }

  .gantt-table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    width: calc(
      var(--gantt-depot-width) + var(--gantt-cohort-width) +
        (var(--gantt-slot-width) * var(--gantt-slot-count, 0))
    );
    background: var(--color-background);
  }

  .gantt-table th,
  .gantt-table td {
    border-right: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
    padding: 0;
    min-width: var(--gantt-slot-width);
    width: var(--gantt-slot-width);
    max-width: var(--gantt-slot-width);
    text-align: center;
    vertical-align: middle;
    box-sizing: border-box;
  }

  .gantt-table tr > :first-child {
    border-left: 1px solid var(--color-border);
  }

  .gantt-table thead tr:first-child > th {
    border-top: 1px solid var(--color-border);
  }

  .gantt-table th {
    background: rgba(237, 241, 247, 0.92);
    backdrop-filter: blur(10px);
    font-size: 0.7rem;
    letter-spacing: 0.02em;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    padding: var(--space-2) var(--space-2);
    position: sticky;
    top: 0;
    z-index: 10;
    overflow: hidden;
  }

  .gantt-table thead tr.availability-row th:not(.cohort-header) {
    top: 0;
    height: var(--gantt-availability-row-height);
    max-height: var(--gantt-availability-row-height);
    z-index: 12;
    vertical-align: top;
    text-align: left;
    padding: 0;
  }

  .gantt-table thead tr.date-row th {
    top: var(--gantt-availability-row-height);
    height: var(--gantt-date-row-height);
    z-index: 11;
    vertical-align: middle;
    text-align: left;
  }

  .gantt-table thead tr.date-row th .slot-date {
    display: block;
  }

  .gantt-table thead th:not(.cohort-header) {
    font-family: var(--font-family-mono);
    font-variant-numeric: tabular-nums;
  }

  .slot-col-header {
    padding: var(--space-2);
  }

  .gantt-table thead tr.availability-row .slot-col-header {
    padding: 0;
  }

  .slot-date {
    font-family: var(--font-family-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-primary);
    font-size: 0.72rem;
    letter-spacing: 0.01em;
  }

  .slot-availability-row {
    width: 100%;
    height: var(--gantt-availability-row-height);
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 6px;
  }

  .slot-availability {
    width: 100%;
    display: flex;
    height: 100%;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: var(--availability-chip-gap);
    padding: 6px;
    border-radius: var(--radius-md);
    background: rgba(16, 185, 129, 0.92);
    color: #fff;
    box-shadow: var(--shadow-xs);
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
  }

  .slot-availability.is-empty {
    background: rgba(239, 68, 68, 0.16);
    color: var(--color-danger-hover);
    border: 1px solid rgba(239, 68, 68, 0.18);
  }

  .availability-chip {
    display: inline-flex;
    align-items: center;
    flex: 0 0 calc((100% - var(--availability-chip-gap)) / 2);
    width: calc((100% - var(--availability-chip-gap)) / 2);
    padding: 2px 6px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
    font-size: 0.6rem;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
    box-sizing: border-box;
  }

  .availability-chip.is-empty {
    background: rgba(239, 68, 68, 0.06);
    color: var(--color-danger-hover);
    border: 1px solid rgba(239, 68, 68, 0.12);
  }

  .availability-chip.is-more {
    background: rgba(255, 255, 255, 0.22);
    font-weight: var(--font-weight-semibold);
  }

  .gantt-table th.cohort-header {
    min-width: var(--gantt-cohort-width);
    width: var(--gantt-cohort-width);
    text-align: left;
    padding-left: var(--space-3);
    position: sticky;
    z-index: 20;
    box-shadow: 6px 0 12px rgba(31, 39, 51, 0.06);
  }

  .gantt-table th.cohort-header:first-child {
    left: 0;
    min-width: var(--gantt-depot-width);
    width: var(--gantt-depot-width);
  }

  .gantt-table th.cohort-header:nth-child(2) {
    left: var(--gantt-depot-width);
  }

  .gantt-table td.depot-cell {
    min-width: var(--gantt-depot-width);
    width: var(--gantt-depot-width);
    max-width: var(--gantt-depot-width);
    background: var(--color-gray-50);
    position: sticky;
    left: 0;
    z-index: 5;
    vertical-align: top;
    padding: 0;
    box-shadow: 6px 0 12px rgba(31, 39, 51, 0.06);
  }

  .gantt-table td.depot-cell gantt-depot {
    display: block;
    height: auto;
  }

  .gantt-table td.depot-cell.drag-over {
    background: var(--color-warning-light) !important;
    box-shadow: inset 0 0 0 2px var(--color-warning);
  }

  .gantt-table td.cohort-cell {
    min-width: var(--gantt-cohort-width);
    width: var(--gantt-cohort-width);
    text-align: left;
    padding: var(--space-2);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-xs);
    color: var(--color-text-primary);
    background: var(--color-gray-50);
    position: sticky;
    left: var(--gantt-depot-width);
    z-index: 5;
    box-shadow: 6px 0 12px rgba(31, 39, 51, 0.06);
    vertical-align: top;
    line-height: 1.2;
  }

  .gantt-table td.slot-cell {
    background: var(--color-background);
    position: relative;
    cursor: pointer;
    transition: background var(--transition-fast),
      box-shadow var(--transition-fast);
    overflow: hidden;
    vertical-align: top;
  }

  .gantt-table tbody td {
    height: auto;
  }

  .gantt-table tbody td.slot-cell gantt-cell {
    display: block;
    height: 100%;
  }

  .gantt-table
    tbody
    tr:hover
    td.slot-cell:not(.disabled-slot):not(.no-teachers-available) {
    background: var(--color-primary-50);
  }

  .gantt-table
    td.slot-cell:hover:not(.disabled-slot):not(.no-teachers-available) {
    background: var(--color-primary-50);
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
    background: linear-gradient(
      0deg,
      rgba(239, 68, 68, 0.08),
      rgba(239, 68, 68, 0.08)
    );
    box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.35);
  }

  .gantt-table td.slot-cell.disabled-slot {
    background: var(--color-gray-100);
    cursor: not-allowed;
  }

  .gantt-table td.slot-cell.disabled-slot:hover {
    background: var(--color-gray-100);
  }

  .gantt-table td.slot-cell.cohort-start-slot {
    position: relative;
  }

  .gantt-table tfoot td {
    background: var(--color-gray-50);
    vertical-align: top;
    padding: var(--space-2);
    border-top: 1px solid var(--color-border);
  }

  /* === Summary row (rendered directly in scheduling-tab) === */

  .gantt-table tfoot .summary-label {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-xs);
    text-align: right;
    padding-right: var(--space-3);
    color: var(--color-text-secondary);
    background: var(--color-gray-50);
    border-top: 1px solid var(--color-border);
  }

  .gantt-table tfoot .summary-cell {
    background: var(--color-gray-50);
    vertical-align: top;
    padding: var(--space-2);
    border-top: 1px solid var(--color-border);
  }

  .gantt-table tfoot .summary-course {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-md);
    font-size: 0.65rem;
    color: white;
    margin-bottom: var(--space-2);
    box-shadow: var(--shadow-xs);
    border: 1px solid rgba(255, 255, 255, 0.22);
  }

  .gantt-table tfoot .summary-course .course-header {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .gantt-table tfoot .summary-course .course-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: bold;
  }

  .gantt-table tfoot .summary-course .participant-count {
    font-weight: bold;
    background: rgba(255, 255, 255, 0.3);
    padding: 1px 4px;
    border-radius: 2px;
  }

  .gantt-table tfoot .summary-course .summary-teacher-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: rgba(255, 255, 255, 0.92);
    border-radius: var(--radius-base);
    padding: var(--space-2);
    box-shadow: inset 0 0 0 1px rgba(31, 39, 51, 0.08);
    max-height: 180px;
    overflow: auto;
  }

  .gantt-table tfoot .summary-course .summary-teacher-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.6rem;
    color: var(--color-text-primary);
    padding: 4px 6px;
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .gantt-table tfoot .summary-course .summary-teacher-row:hover {
    background: rgba(58, 116, 246, 0.08);
  }

  .gantt-table tfoot .summary-course .summary-teacher-row input {
    width: 14px;
    height: 14px;
    margin: 0;
    accent-color: var(--color-primary-600);
    cursor: pointer;
  }

  .gantt-table tfoot .summary-course .summary-teacher-row label {
    cursor: pointer;
    flex: 1;
  }

  .gantt-table tfoot .summary-course .summary-teacher-row input:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  .gantt-table tfoot .summary-course .summary-teacher-row input:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row
    input:disabled
    + label {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .gantt-table tfoot .summary-course .summary-teacher-row.assigned {
    background: rgba(16, 185, 129, 0.16);
    font-weight: 600;
    color: var(--color-success-hover);
  }

  .gantt-table tfoot .summary-course .summary-teacher-row.assigned:hover {
    background: rgba(16, 185, 129, 0.22);
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      scroll-behavior: auto !important;
      transition: none !important;
      animation: none !important;
    }
  }
`;
