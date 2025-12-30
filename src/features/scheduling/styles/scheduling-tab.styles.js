import { css } from "lit";

export const schedulingTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    --gantt-depot-width: 160px;
    --gantt-cohort-width: 136px;
    --gantt-slot-width: 160px;
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
    gap: var(--space-3);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
    min-height: var(--button-height-base);
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
    border: 2px dashed var(--color-white-70);
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
    background: var(--color-table-header-bg);
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

  .gantt-table thead th.cohort-header .cohort-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
  }

  .gantt-table thead tr.date-row th {
    top: 0;
    z-index: 11;
    vertical-align: middle;
    text-align: center;
    padding: var(--space-3) var(--space-4);
    background: var(--color-table-header-bg);
    border-bottom: 0;
    box-shadow: inset 0 -1px 0 var(--color-border);
  }

  .gantt-table thead tr.date-row th.cohort-header {
    text-align: left;
    padding: var(--space-3) var(--space-4);
  }

  .gantt-table thead tr.date-row th .slot-date {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slot-date {
    font: inherit;
    color: inherit;
    font-feature-settings: normal;
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

  .slot-compatibility-text {
    font-size: 0.65rem;
    color: var(--color-text-primary);
    line-height: 1.2;
    white-space: normal;
    word-break: break-word;
  }

  .scheduling-footer {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  /* Warnings Footer */
  .warnings-footer {
    background: var(--color-surface);
  }

  .warnings-footer-viewport {
    position: relative;
    overflow: hidden;
  }

.warnings-footer-track {
  position: relative;
}

  .warnings-footer-spacer {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: calc(var(--gantt-depot-width) + var(--gantt-cohort-width));
    background: var(--color-white);
    border-right: 1px solid var(--color-border);
    box-sizing: border-box;
    z-index: 2;
  }

  .warnings-footer-slots {
    --warnings-scroll-x: 0px;
    display: grid;
    grid-template-columns: repeat(var(--gantt-slot-count, 0), var(--gantt-slot-width));
    width: calc(var(--gantt-slot-width) * var(--gantt-slot-count, 0));
    transform: translateX(calc(var(--warnings-scroll-x) * -1));
    margin-left: calc(var(--gantt-depot-width) + var(--gantt-cohort-width));
  }

.warnings-footer-cell {
  background: var(--color-surface);
  box-sizing: border-box;
}

  .warnings-footer-cell:last-child {
    border-right: none;
  }

  /* Compatibility Footer */
.compatibility-footer {
  background: var(--color-surface);
  margin-top: var(--space-3);
}

  .compatibility-footer-viewport {
    position: relative;
    overflow: hidden;
  }

.compatibility-footer-track {
  position: relative;
}

  .compatibility-footer-spacer {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: calc(var(--gantt-depot-width) + var(--gantt-cohort-width));
    background: var(--color-white);
    border-right: 1px solid var(--color-border);
    box-sizing: border-box;
    z-index: 2;
  }

  .compatibility-footer-slots {
    --compat-scroll-x: 0px;
    display: grid;
    grid-template-columns: repeat(var(--gantt-slot-count, 0), var(--gantt-slot-width));
    width: calc(var(--gantt-slot-width) * var(--gantt-slot-count, 0));
    transform: translateX(calc(var(--compat-scroll-x) * -1));
    margin-left: calc(var(--gantt-depot-width) + var(--gantt-cohort-width));
  }

.compatibility-footer-cell {
  background: var(--color-surface);
  box-sizing: border-box;
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

.warnings-footer .slot-availability-row {
  height: auto;
  min-height: 0;
  padding: 2px;
  gap: 6px;
}

.warnings-footer .slot-warning-pills {
  gap: 6px;
}

.compatibility-footer .slot-compatibility-row {
  height: auto;
  min-height: 0;
  padding: 2px;
  gap: 2px;
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

  .slot-warning-label {
    font-size: 0.6rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
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
    border-color: var(--color-red-20);
  }

  .slot-warning-pill--soft {
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
    border-color: var(--color-yellow-20);
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
    color: var(--color-white);
    border-color: transparent;
  }

  .availability-chip--compatible {
    background: var(--color-info-bg);
    color: var(--color-info-text);
    border-color: transparent;
  }

  .availability-chip--assigned {
    background: var(--color-success);
    color: var(--color-white);
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
    z-index: 30;
    box-shadow: none;
    background: var(--color-table-header-bg);
  }

  .gantt-table th.cohort-header:first-child {
    left: 0;
    min-width: var(--gantt-depot-width);
    width: var(--gantt-depot-width);
    background: var(--color-table-header-bg);
  }

  .gantt-table th.cohort-header:nth-child(2) {
    left: var(--gantt-depot-width);
  }

  .gantt-table thead tr.date-row th.cohort-header {
    z-index: 31;
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
    padding: var(--space-2);
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
    gap: var(--space-2);
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
    font-size: 0.75rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-kth-blue);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gantt-table td.cohort-cell .cohort-cell-date {
    font-size: 0.65rem;
    color: var(--color-text-secondary);
    font-family: var(--font-family-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Cohort Warning/Actions Styling */
  .gantt-table td.cohort-cell .cohort-warning-section,
  .gantt-table td.cohort-cell .cohort-cell-actions {
    width: 100%;
    padding: 0;
    border-radius: 0;
    background: transparent;
    border: none;
    box-shadow: none;
    box-sizing: border-box; /* Ensure padding is included in width */
  }

  .gantt-table td.cohort-cell .cohort-cell-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: var(--space-2);
    column-gap: var(--space-1);
    align-items: center;
  }

  .gantt-table td.cohort-cell .cohort-warning-section {
    display: grid;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .gantt-table td.cohort-cell .cohort-section-label {
    font-size: 0.6rem;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .gantt-table td.cohort-cell .cohort-cell-actions .cohort-section-label,
  .gantt-table td.cohort-cell .cohort-warning-section .cohort-section-label {
    grid-column: 1 / -1;
  }

  .gantt-table td.cohort-cell .cohort-warning-markers {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .gantt-table td.cohort-cell .cohort-warning-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: 0.6rem;
    font-weight: var(--font-weight-semibold);
    border: 1px solid var(--color-border);
    background: var(--color-gray-lighter);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .gantt-table td.cohort-cell .cohort-warning-pill--hard {
    background: var(--color-danger-bg);
    color: var(--color-danger-text);
    border-color: var(--color-red-20);
  }

  .gantt-table td.cohort-cell .cohort-warning-pill--soft {
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
    border-color: var(--color-yellow-20);
  }

  .gantt-table td.cohort-cell .cohort-reset-button,
  .gantt-table td.cohort-cell .cohort-autofill-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 26px;
    padding: 5px 8px;
    font-family: var(--font-family-base);
    font-size: 0.75rem;
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: center;
    line-height: 1.1;
    white-space: nowrap;
    border: 1px solid transparent;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  }

  .gantt-table td.cohort-cell .cohort-reset-button {
    background: var(--color-white);
    color: var(--color-kth-blue);
    border-color: var(--color-kth-blue);
  }

  .gantt-table td.cohort-cell .cohort-reset-button:hover:not(:disabled) {
    background: var(--color-sand-dark);
    color: var(--color-kth-blue);
  }

  .gantt-table td.cohort-cell .cohort-autofill-button {
    background: var(--color-light-blue);
    color: var(--color-navy);
    border-color: var(--color-kth-blue);
  }

  .gantt-table td.cohort-cell .cohort-autofill-button:hover:not(:disabled) {
    background: var(--color-sky-blue);
    border-color: var(--color-kth-blue);
    color: var(--color-navy);
  }

  .gantt-table td.cohort-cell .cohort-reset-button:disabled,
  .gantt-table td.cohort-cell .cohort-autofill-button:disabled {
    background: var(--color-sand-dark);
    border-color: var(--color-sand-dark);
    color: var(--color-text-disabled);
    opacity: 1;
    cursor: default;
    filter: none;
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
    box-shadow: inset 0 0 0 2px var(--color-red-20);
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
    padding: calc(var(--space-4) + var(--space-2)) var(--space-4)
      var(--space-4);
    border-top: 1px solid var(--color-border);
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
    --summary-stripe-angle: 135deg;
    --summary-stripe-size: 8px;
    font-size: 0.7rem;
    color: var(--course-text-color, var(--color-text-primary));
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
    border-bottom: 1px solid var(--color-white-50);
    margin-bottom: 4px;
  }

  .gantt-table tfoot .summary-course .course-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: var(--font-weight-bold);
    color: var(--course-text-color, var(--color-kth-blue));
  }

  .gantt-table tfoot .summary-course .participant-count {
    font-weight: bold;
    background: var(--color-gray-lighter);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
  }

  .gantt-table tfoot .summary-course .summary-teacher-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.6rem;
    color: var(--color-text-secondary);
  }

  .gantt-table tfoot .summary-course .summary-teacher-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .gantt-table tfoot .summary-course .summary-teacher-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Toggle Pill for Teachers in Summary */
  .gantt-table tfoot .summary-course .summary-teacher-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: var(--font-weight-medium);
    border: 1px solid transparent;
    background-color: var(--color-gray-lighter);
    color: var(--color-text-primary);
    transition: all 0.1s;
  }

  .gantt-table tfoot .summary-course .summary-toggle-text {
    font-size: 0.62rem;
    line-height: 1.2;
  }

  .gantt-table tfoot .summary-course .summary-kursansvarig-cell {
    display: flex;
    align-items: center;
  }

  .gantt-table tfoot .summary-course .summary-teacher-pill:hover {
    background-color: var(--color-border);
  }

  .gantt-table tfoot .summary-course .summary-teacher-row.partial-availability .summary-teacher-pill {
    --summary-stripe-color: color-mix(
      in srgb,
      var(--color-info) 60%,
      transparent
    );
    background-image: repeating-linear-gradient(
      var(--summary-stripe-angle),
      var(--summary-stripe-color) 0,
      var(--summary-stripe-color) var(--summary-stripe-size),
      transparent var(--summary-stripe-size),
      transparent calc(var(--summary-stripe-size) * 2)
    );
  }

  .gantt-table tfoot .summary-course .summary-teacher-row.partial-conflict .summary-teacher-pill {
    --summary-stripe-color: color-mix(
      in srgb,
      var(--color-danger) 65%,
      transparent
    );
    background-image: repeating-linear-gradient(
      var(--summary-stripe-angle),
      var(--summary-stripe-color) 0,
      var(--summary-stripe-color) var(--summary-stripe-size),
      transparent var(--summary-stripe-size),
      transparent calc(var(--summary-stripe-size) * 2)
    );
  }

  .gantt-table tfoot .summary-course .summary-teacher-row.course-unavailable .summary-teacher-pill {
    --summary-stripe-color: color-mix(
      in srgb,
      var(--color-danger) 80%,
      transparent
    );
    background-image: repeating-linear-gradient(
      var(--summary-stripe-angle),
      var(--summary-stripe-color) 0,
      var(--summary-stripe-color) var(--summary-stripe-size),
      transparent var(--summary-stripe-size),
      transparent calc(var(--summary-stripe-size) * 2)
    );
  }

  /* Active states for Summary Teachers */
  .gantt-table tfoot .summary-course .summary-teacher-row.assigned-course .summary-teacher-pill {
    background-color: var(--color-success-bg);
    color: var(--color-success-text);
    border-color: var(--color-success);
  }

  .gantt-table tfoot .summary-course .summary-teacher-row.has-course .summary-teacher-pill {
    background-color: var(--color-info-bg);
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
