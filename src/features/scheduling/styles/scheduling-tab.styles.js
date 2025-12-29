import { css } from "lit";

export const schedulingTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    --gantt-depot-width: 240px;
    --gantt-cohort-width: 136px;
    --gantt-slot-width: 180px;
    --gantt-row-height: 160px;
    --gantt-compatibility-row-height: 72px;
    --gantt-availability-row-height: 72px;
    --gantt-teacher-overlay-height: 72px;
    --gantt-date-row-height: 32px;
    --availability-chip-gap: 4px;
  }

  henry-panel {
    flex: 1;
    min-height: 0;
  }

  .tab-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .tab-scroll {
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: auto;
  }

  .gantt-layout {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
    min-height: var(--button-height-base);
    margin-bottom: var(--space-4);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .header-buttons {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
    position: relative;
    z-index: 30;
  }

  .legend {
    display: flex;
    gap: var(--space-6);
    margin-top: var(--space-4);
    flex-wrap: wrap;
    padding: var(--space-4);
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-medium);
  }

  .legend-box {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-sm);
  }

  .law-course.law-order-1 { background: var(--color-secondary-900); }
  .law-course.law-order-2 { background: var(--color-secondary-700); }
  .law-course.law-order-3 { background: var(--color-secondary-500); }
  .law-course.law-order-rest { background: var(--color-secondary-300); }

  .normal-course { background: var(--color-primary-500); }

  .teacher-shortage {
    background: var(--color-primary-500);
    outline: 2px solid var(--color-info);
    outline-offset: 1px;
  }

  .two-block-course {
    border: 2px dashed rgba(255, 255, 255, 0.7);
  }

  /* Main Gantt Area */
  .gantt-scroll-wrapper {
    overflow: auto;
    max-height: none;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    position: relative;
    z-index: 0;
    isolation: isolate;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overscroll-behavior: contain;
  }

  .gantt-scroll-wrapper:focus {
    outline: none;
  }

  .gantt-table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    width: calc(
      var(--gantt-depot-width) + var(--gantt-cohort-width) +
        (var(--gantt-slot-width) * var(--gantt-slot-count, 0))
    );
    background: var(--color-surface);
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

  /* Remove double borders */
  .gantt-table tr > :first-child { border-left: none; }
  .gantt-table thead tr:first-child > th { border-top: none; }
  .gantt-table th:last-child, .gantt-table td:last-child { border-right: none; }
  .gantt-table tr:last-child td { border-bottom: none; }

  /* Table Headers */
  .gantt-table th {
    background: var(--color-gray-lighter);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    padding: var(--space-2);
    position: sticky;
    top: 0;
    z-index: 10;
    overflow: hidden;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .gantt-table thead tr.compatibility-row th {
    top: 0;
    height: var(--gantt-compatibility-row-height);
    max-height: var(--gantt-compatibility-row-height);
    z-index: 13;
    vertical-align: top;
    text-align: left;
    padding: 0;
    background: var(--color-white);
    text-transform: none;
    letter-spacing: normal;
    font-weight: var(--font-weight-medium);
    border-bottom: 0;
  }

  .gantt-table thead tr.availability-row th {
    top: var(--gantt-compatibility-row-height);
    height: var(--gantt-availability-row-height);
    max-height: var(--gantt-availability-row-height);
    z-index: 12;
    vertical-align: top;
    text-align: left;
    padding: 0;
    background: var(--color-white);
    text-transform: none;
    letter-spacing: normal;
    font-weight: var(--font-weight-medium);
    border-bottom: 0;
  }

  .gantt-table thead th.cohort-header .cohort-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
  }

  .gantt-table thead tr.date-row th {
    top: calc(
      var(--gantt-compatibility-row-height) + var(--gantt-availability-row-height)
    );
    height: var(--gantt-date-row-height);
    z-index: 11;
    vertical-align: middle;
    text-align: center;
    padding: 0;
    background: var(--color-gray-lighter);
    border-bottom: 1px solid var(--color-border);
  }

  .gantt-table thead tr.date-row th.cohort-header {
    text-align: left;
    padding: var(--space-2) var(--space-4);
  }

  .gantt-table thead tr.date-row th .slot-date {
    display: flex;
    height: var(--gantt-date-row-height);
    align-items: center;
    justify-content: center;
  }

  .slot-date {
    font-family: var(--font-family-base); /* Changed from mono to base as requested */
    color: var(--color-text-secondary);
    font-size: 0.7rem;
    font-weight: var(--font-weight-medium);
    font-feature-settings: "tnum"; /* Tabular nums if supported */
  }

  /* Teacher Overlay */
  .slot-teacher-overlay-wrapper {
    position: absolute;
    top: 0;
    transform: translateY(calc(-100% - 6px));
    left: 0;
    right: 0;
    height: auto;
    overflow: hidden;
    pointer-events: none;
    z-index: 5;
  }

  .slot-teacher-overlay {
    display: grid;
    grid-template-columns:
      var(--gantt-depot-width)
      var(--gantt-cohort-width)
      repeat(var(--gantt-slot-count, 0), var(--gantt-slot-width));
    width: calc(
      var(--gantt-depot-width) + var(--gantt-cohort-width) +
        (var(--gantt-slot-width) * var(--gantt-slot-count, 0))
    );
    min-height: var(--gantt-teacher-overlay-height);
  }

  .slot-teacher-overlay-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 4px;
    padding: 6px;
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    min-height: calc(var(--gantt-teacher-overlay-height) - 12px);
    box-sizing: border-box;
    overflow: hidden;
  }

  .slot-teacher-overlay-cell.is-hidden {
    visibility: hidden;
    height: 0;
    min-height: 0;
    margin: 0;
    padding: 0;
    border: 0;
    box-shadow: none;
  }

  .slot-teacher-overlay-label {
    font-size: 0.6rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-kth-blue);
    text-transform: uppercase;
  }

  .slot-teacher-overlay-names {
    font-size: 0.65rem;
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  /* Compatibility Row */
  .slot-compatibility-row {
    width: 100%;
    height: var(--gantt-compatibility-row-height);
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: 4px;
    gap: 4px;
    background: transparent;
  }

  .slot-compatibility-row[aria-hidden="true"] {
    justify-content: center;
  }

  .slot-compatibility-label {
    font-size: 0.6rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .slot-compatibility-chips {
    display: flex;
    gap: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .slot-compatibility-chips::-webkit-scrollbar {
    display: none;
  }

  /* Availability Row */
  .slot-availability-row {
    width: 100%;
    height: var(--gantt-availability-row-height);
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: 4px;
    gap: 4px;
    background: transparent;
  }

  .slot-availability-row[data-has-warnings="false"] {
    justify-content: center;
  }

  .slot-warning-pills {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    gap: 4px;
    min-height: 18px;
    overflow: hidden;
  }

  .slot-warning-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: 0.6rem;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    border: 1px solid var(--color-border);
    background: var(--color-gray-lighter);
    color: var(--color-text-secondary);
    cursor: help;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .slot-warning-pill--hard {
    background: var(--color-danger-bg);
    color: var(--color-danger-text);
    border-color: rgba(239, 68, 68, 0.2);
  }

  .slot-warning-pill--soft {
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
    border-color: rgba(245, 158, 11, 0.2);
  }

  /* Availability Chips */
  .availability-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    background: var(--color-white);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    font-size: 0.65rem;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .availability-chip--available {
    background: var(--color-success-bg);
    color: var(--color-success-text);
    border-color: transparent;
  }

  .availability-chip--drag-available {
    background: var(--color-navy);
    color: white;
    border-color: transparent;
  }

  .availability-chip--compatible {
    background: var(--color-info-bg);
    color: var(--color-info-text);
    border-color: transparent;
  }

  .availability-chip--assigned {
    background: var(--color-success);
    color: white;
    border-color: transparent;
  }

  .availability-chip--course-unavailable {
    background: var(--color-danger-bg);
    color: var(--color-danger-text);
    border-color: transparent;
  }

  /* Cohort Headers & Cells */
  .gantt-table th.cohort-header {
    min-width: var(--gantt-cohort-width);
    width: var(--gantt-cohort-width);
    text-align: left;
    padding-left: var(--space-4);
    position: sticky;
    z-index: 20;
    box-shadow: none;
    background: var(--color-gray-lighter);
  }

  .gantt-table th.cohort-header:first-child {
    left: 0;
    min-width: var(--gantt-depot-width);
    width: var(--gantt-depot-width);
    background: var(--color-gray-lighter);
  }

  .gantt-table th.cohort-header:nth-child(2) {
    left: var(--gantt-depot-width);
  }

  .gantt-table thead tr.compatibility-row th.cohort-header,
  .gantt-table thead tr.availability-row th.cohort-header {
    background: var(--color-white);
    border-bottom: 0;
    box-shadow: none;
  }

  .gantt-table td.depot-cell {
    min-width: var(--gantt-depot-width);
    width: var(--gantt-depot-width);
    max-width: var(--gantt-depot-width);
    background: var(--color-surface);
    position: sticky;
    left: 0;
    z-index: 5;
    vertical-align: top;
    padding: 0;
    border-right: 1px solid var(--color-border);
  }

  .gantt-table td.cohort-cell {
    min-width: var(--gantt-cohort-width);
    width: var(--gantt-cohort-width);
    text-align: left;
    padding: var(--space-3);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    background: var(--color-surface);
    position: sticky;
    left: var(--gantt-depot-width);
    z-index: 5;
    vertical-align: top;
    line-height: 1.2;
    border-right: 1px solid var(--color-border);
  }

  .gantt-table td.cohort-cell .cohort-cell-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    min-width: 0; /* Important for overflow */
  }

  .gantt-table td.cohort-cell .cohort-cell-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  .gantt-table td.cohort-cell .cohort-cell-number {
    font-size: 0.8rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-kth-blue);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gantt-table td.cohort-cell .cohort-cell-date {
    font-size: 0.7rem;
    color: var(--color-text-secondary);
    font-family: var(--font-family-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Cohort Warning/Actions Styling */
  .gantt-table td.cohort-cell .cohort-warning-section,
  .gantt-table td.cohort-cell .cohort-cell-actions {
    width: 100%;
    padding: 8px;
    border-radius: var(--radius-md);
    background: var(--color-white);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    box-sizing: border-box; /* Ensure padding is included in width */
  }

  .gantt-table td.cohort-cell .cohort-reset-button,
  .gantt-table td.cohort-cell .cohort-autofill-button {
    width: 100%;
    padding: 6px;
    font-size: 0.7rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: center;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .gantt-table td.cohort-cell .cohort-reset-button {
    background: transparent;
    color: var(--color-text-secondary);
    border-color: var(--color-border);
  }

  .gantt-table td.cohort-cell .cohort-reset-button:hover:not(:disabled) {
    background: var(--color-gray-lighter);
    color: var(--color-text-primary);
  }

  .gantt-table td.cohort-cell .cohort-autofill-button {
    background: var(--color-info-bg);
    color: var(--color-info-text);
    font-weight: var(--font-weight-semibold);
  }

  .gantt-table td.cohort-cell .cohort-autofill-button:hover:not(:disabled) {
    background: var(--color-info);
    color: white;
  }

  /* Slot Cells */
  .gantt-table td.slot-cell {
    background: var(--color-white);
    position: relative;
    cursor: pointer;
    transition: background var(--transition-fast);
    overflow: hidden;
    vertical-align: top;
  }

  .gantt-table tbody td.slot-cell gantt-cell {
    display: block;
    height: 100%;
  }

  .gantt-table
    tbody
    tr:hover
    td.slot-cell:not(.disabled-slot):not(.no-teachers-available) {
    background: var(--color-broken-white);
  }

  .gantt-table
    td.slot-cell:hover:not(.disabled-slot):not(.no-teachers-available) {
    background: var(--color-broken-white);
  }

  .gantt-table td.slot-cell.drag-over {
    background: var(--color-info-bg);
    box-shadow: inset 0 0 0 2px var(--color-info);
  }

  .gantt-table td.slot-cell.drag-over-invalid {
    background: var(--color-danger-bg);
    box-shadow: inset 0 0 0 2px var(--color-danger);
  }

  .gantt-table td.slot-cell.no-teachers-available {
    background: var(--color-danger-bg);
    box-shadow: inset 0 0 0 2px rgba(220, 38, 38, 0.2);
  }

  .gantt-table td.slot-cell.disabled-slot {
    background: repeating-linear-gradient(
      45deg,
      var(--color-broken-white),
      var(--color-broken-white) 10px,
      var(--color-gray-lighter) 10px,
      var(--color-gray-lighter) 20px
    );
    cursor: not-allowed;
  }

  /* Summary Row (Footer) */
  .gantt-table tfoot td {
    background: var(--color-broken-white);
    vertical-align: top;
    padding: var(--space-4);
    border-top: 2px solid var(--color-border);
  }

  .gantt-table tfoot .summary-label {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    text-align: right;
    padding-right: var(--space-4);
    color: var(--color-text-secondary);
    background: var(--color-broken-white);
    position: sticky;
    left: 0;
    z-index: 6;
  }

  .gantt-table tfoot .summary-course {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-md);
    font-size: 0.7rem;
    color: var(--color-text-primary);
    background: var(--color-white);
    margin-bottom: var(--space-2);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border);
  }

  .gantt-table tfoot .summary-course .course-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 4px;
  }

  .gantt-table tfoot .summary-course .course-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: var(--font-weight-bold);
    color: var(--color-kth-blue);
  }

  .gantt-table tfoot .summary-course .participant-count {
    font-weight: bold;
    background: var(--color-gray-lighter);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
  }

  /* Toggle Pill for Teachers in Summary */
  .gantt-table tfoot .summary-course .summary-teacher-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: var(--font-weight-medium);
    border: 1px solid transparent;
    background: var(--color-gray-lighter);
    color: var(--color-text-primary);
    transition: all 0.1s;
  }

  .gantt-table tfoot .summary-course .summary-teacher-pill:hover {
    background: var(--color-border);
  }

  /* Active states for Summary Teachers */
  .gantt-table tfoot .summary-course .summary-teacher-row.assigned-course .summary-teacher-pill {
    background: var(--color-success-bg);
    color: var(--color-success-text);
    border-color: var(--color-success);
  }

  .gantt-table tfoot .summary-course .summary-teacher-row.has-course .summary-teacher-pill {
    background: var(--color-info-bg);
    color: var(--color-info-text);
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      scroll-behavior: auto !important;
      transition: none !important;
      animation: none !important;
    }
  }
`;
