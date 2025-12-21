import { css } from "lit";

export const schedulingTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
    --gantt-depot-width: 240px;
    --gantt-cohort-width: 96px;
    --gantt-slot-width: 170px;
    --gantt-row-height: 160px;
    --gantt-availability-row-height: 78px;
    --gantt-date-row-height: 32px;
    --availability-chip-gap: 4px;
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
    /* Allow both horizontal and vertical scrolling inside the gantt area */
    overflow: auto;
    /* Keep headers visible while rows scroll underneath */
    max-height: min(70dvh, 720px);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 0;
    box-shadow: var(--shadow-xs);
    position: relative;
    z-index: 0;
    isolation: isolate;
    margin-top: var(--space-4);
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
    background: var(--color-gray-100);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
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
    text-align: center;
  }

  .gantt-table thead tr.date-row th .slot-date {
    display: block;
  }

  .gantt-table thead th:not(.cohort-header) {
    font-family: var(--font-family-base);
  }

  .slot-col-header {
    padding: var(--space-2);
  }

  .gantt-table thead tr.availability-row .slot-col-header {
    padding: 0;
  }

  .slot-date {
    font-family: var(--font-family-base);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

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
    padding: 6px;
    gap: 6px;
  }

  .slot-availability {
    width: 100%;
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    height: auto;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: var(--availability-chip-gap);
    padding: 0;
    border-radius: 0;
    background: transparent;
    color: #fff;
    box-shadow: none;
    box-sizing: border-box;
    max-width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge legacy */
  }

  .slot-availability::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  .slot-warning-pills {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: auto;
    min-height: 18px;
  }

  .slot-warning-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    font-size: 0.62rem;
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
    border: 1px solid var(--color-border);
    background: var(--color-gray-100);
    color: var(--color-text-primary);
    cursor: help;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .slot-warning-pill--hard {
    background: var(--color-danger-light);
    color: var(--color-danger-hover);
    border-color: rgba(239, 68, 68, 0.25);
  }

  .slot-warning-pill--soft {
    background: var(--color-warning-light);
    color: var(--color-warning-hover);
    border-color: rgba(245, 158, 11, 0.28);
  }

  .availability-chip {
    display: inline-flex;
    align-items: center;
    /* Aim for 3 chips per row in the slot header overlay */
    flex: 0 0 calc((100% - (var(--availability-chip-gap) * 2)) / 3);
    width: calc((100% - (var(--availability-chip-gap) * 2)) / 3);
    padding: 2px 5px;
    border-radius: var(--radius-full);
    background: rgba(15, 23, 42, 0.18);
    color: #fff;
    font-size: 0.56rem;
    line-height: 1.05;
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: keep-all;
    overflow: hidden;
    text-overflow: clip;
    justify-content: flex-start;
    box-sizing: border-box;
    position: relative;
    isolation: isolate;
  }

  .availability-chip-text {
    position: relative;
    z-index: 1;
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: keep-all;
    overflow: hidden;
    text-overflow: clip;
    display: block;
    min-width: 0;
  }

  .availability-chip--available {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    );
  }

  .availability-chip--drag-available {
    background: rgba(31, 39, 51, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  .availability-chip--compatible {
    background: linear-gradient(
      135deg,
      var(--color-info),
      var(--color-info-hover)
    );
  }

  .availability-chip--assigned {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    );
  }

  .availability-chip--course-unavailable {
    background: var(--color-danger);
  }

  .availability-chip--partial-conflict {
    background: var(--color-danger);
  }

  .availability-chip--partial-conflict::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.22) 0px,
      rgba(255, 255, 255, 0.22) 8px,
      rgba(255, 255, 255, 0) 8px,
      rgba(255, 255, 255, 0) 16px
    );
    opacity: 0.95;
  }

  .availability-chip--partial-availability {
    background: linear-gradient(
      135deg,
      var(--color-info),
      var(--color-info-hover)
    );
  }

  .availability-chip--partial-availability::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.32) 0px,
      rgba(255, 255, 255, 0.32) 8px,
      rgba(255, 255, 255, 0) 8px,
      rgba(255, 255, 255, 0) 16px
    );
    opacity: 0.9;
  }

  /* Assigned + warning patterns (match summary row) */
  .availability-chip--assigned-course-unavailable {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    );
  }

  .availability-chip--assigned-course-unavailable::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.82) 0px,
      rgba(239, 68, 68, 0.82) 8px,
      rgba(239, 68, 68, 0) 8px,
      rgba(239, 68, 68, 0) 16px
    );
    opacity: 0.95;
  }

  .availability-chip--assigned-partial-conflict {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    );
  }

  .availability-chip--assigned-partial-conflict::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.28) 0px,
      rgba(239, 68, 68, 0.28) 8px,
      rgba(239, 68, 68, 0) 8px,
      rgba(239, 68, 68, 0) 16px
    );
    opacity: 0.95;
  }

  .availability-chip--assigned-partial-availability {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    );
  }

  .availability-chip--assigned-partial-availability::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.28) 0px,
      rgba(59, 130, 246, 0.28) 8px,
      rgba(59, 130, 246, 0) 8px,
      rgba(59, 130, 246, 0) 16px
    );
    opacity: 0.9;
  }

  .gantt-table th.cohort-header {
    min-width: var(--gantt-cohort-width);
    width: var(--gantt-cohort-width);
    text-align: left;
    padding-left: var(--space-3);
    position: sticky;
    z-index: 20;
    box-shadow: 6px 0 12px rgba(31, 39, 51, 0.06);
    vertical-align: bottom;
    padding-bottom: var(--space-2);
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
    padding-left: var(--space-3);
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

  .gantt-table td.cohort-cell .cohort-cell-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
  }

  .gantt-table td.cohort-cell .cohort-cell-name {
    flex: 0 0 auto;
  }

  .gantt-table td.cohort-cell .cohort-warning-markers {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
    width: 100%;
    box-sizing: border-box;
    margin-top: auto;
  }

  .gantt-table td.cohort-cell .cohort-warning-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    font-size: 0.62rem;
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
    border: 1px solid var(--color-border);
    background: var(--color-gray-100);
    color: var(--color-text-primary);
    cursor: help;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .gantt-table td.cohort-cell .cohort-warning-pill--hard {
    background: var(--color-danger-light);
    color: var(--color-danger-hover);
    border-color: rgba(239, 68, 68, 0.25);
  }

  .gantt-table td.cohort-cell .cohort-warning-pill--soft {
    background: var(--color-warning-light);
    color: var(--color-warning-hover);
    border-color: rgba(245, 158, 11, 0.28);
  }

  .gantt-table td.cohort-cell .cohort-cell-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
    flex: 0 0 auto;
  }

  .gantt-table td.cohort-cell .cohort-reset-button {
    flex: 0 0 auto;
    font: inherit;
    font-size: 0.65rem;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    line-height: 1.2;
  }

  .gantt-table td.cohort-cell .cohort-reset-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .gantt-table td.cohort-cell .cohort-reset-button:hover:not(:disabled) {
    background: rgba(15, 23, 42, 0.04);
    color: var(--color-text-primary);
  }

  .gantt-table td.cohort-cell .cohort-reset-button:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  .gantt-table td.cohort-cell .cohort-autofill-button {
    flex: 0 0 auto;
    font: inherit;
    font-size: 0.65rem;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(37, 99, 235, 0.35);
    background: rgba(37, 99, 235, 0.06);
    color: var(--color-primary-700);
    cursor: pointer;
    line-height: 1.2;
  }

  .gantt-table td.cohort-cell .cohort-autofill-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .gantt-table td.cohort-cell .cohort-autofill-button:hover:not(:disabled) {
    background: rgba(37, 99, 235, 0.1);
    border-color: rgba(37, 99, 235, 0.5);
  }

  .gantt-table td.cohort-cell .cohort-autofill-button:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
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
    height: var(--gantt-row-height);
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
    position: sticky;
    left: 0;
    z-index: 6;
    min-width: calc(var(--gantt-depot-width) + var(--gantt-cohort-width));
    width: calc(var(--gantt-depot-width) + var(--gantt-cohort-width));
    box-shadow: 6px 0 12px rgba(31, 39, 51, 0.06);
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
    background: transparent;
    border-radius: var(--radius-base);
    padding: 0;
    box-shadow: inset 0 0 0 1px rgba(31, 39, 51, 0.08);
    max-height: 180px;
    overflow: auto;
  }

  .gantt-table tfoot .summary-course .summary-teacher-row {
    display: flex;
    align-items: stretch;
    justify-content: flex-start;
    font-size: 0.6rem;
    color: var(--color-text-primary);
    text-align: left;
    padding: 0;
    border-radius: 0;
    cursor: pointer;
    transition: background var(--transition-fast);
    position: relative;
    overflow: hidden;
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row:not(.has-course):not(.assigned-course):not(
      .course-unavailable
    ):not(.partial-conflict):hover {
    background: transparent;
  }

  .gantt-table tfoot .summary-course .summary-teacher-pill {
    display: flex;
    align-items: center;
    gap: 0;
    width: 100%;
    padding: 4px 6px;
    border-radius: var(--radius-base);
    position: relative;
    overflow: hidden;
    isolation: isolate;
    cursor: pointer;
    font-weight: var(--font-weight-semibold);
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
  }

  .gantt-table tfoot .summary-course .summary-teacher-pill::after {
    z-index: 0;
  }

  .gantt-table tfoot .summary-course .summary-toggle-text {
    flex: 1;
    text-align: left;
    color: #fff;
    position: relative;
    z-index: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow-wrap: normal;
    word-break: keep-all;
  }

  .gantt-table tfoot .summary-course .summary-teacher-pill:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  .gantt-table tfoot .summary-course .summary-teacher-pill:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  /* Summary teacher status styling (mirrors teacher-availability patterns) */
  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.has-course
    .summary-teacher-pill {
    background: linear-gradient(
      135deg,
      var(--color-info),
      var(--color-info-hover)
    );
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.assigned-course
    .summary-teacher-pill {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    );
  }

  .gantt-table tfoot .summary-course .summary-teacher-row.course-unavailable,
  .gantt-table tfoot .summary-course .summary-teacher-row.partial-conflict {
    background: transparent;
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.course-unavailable:not(.assigned-course)
    .summary-teacher-pill,
  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.partial-conflict:not(.assigned-course)
    .summary-teacher-pill {
    background: var(--color-danger);
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.partial-availability
    .summary-teacher-pill::after,
  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.partial-conflict
    .summary-teacher-pill::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.32) 0px,
      rgba(255, 255, 255, 0.32) 8px,
      rgba(255, 255, 255, 0) 8px,
      rgba(255, 255, 255, 0) 16px
    );
    opacity: 0.9;
  }

  /* Assigned + warnings: keep green base and overlay colored stripes */
  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.assigned-course.course-unavailable
    .summary-teacher-pill {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    ) !important;
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.assigned-course.course-unavailable
    .summary-teacher-pill::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.82) 0px,
      rgba(239, 68, 68, 0.82) 8px,
      rgba(239, 68, 68, 0) 8px,
      rgba(239, 68, 68, 0) 16px
    );
    opacity: 0.95;
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.assigned-course.partial-conflict
    .summary-teacher-pill {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    ) !important;
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.assigned-course.partial-conflict
    .summary-teacher-pill::after {
    background: repeating-linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.28) 0px,
      rgba(239, 68, 68, 0.28) 8px,
      rgba(239, 68, 68, 0) 8px,
      rgba(239, 68, 68, 0) 16px
    );
    opacity: 0.95;
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.assigned-course.partial-availability
    .summary-teacher-pill::after {
    background: repeating-linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.28) 0px,
      rgba(59, 130, 246, 0.28) 8px,
      rgba(59, 130, 246, 0) 8px,
      rgba(59, 130, 246, 0) 16px
    );
    opacity: 0.9;
  }

  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.has-course:hover
    .summary-teacher-pill,
  .gantt-table
    tfoot
    .summary-course
    .summary-teacher-row.assigned-course:hover
    .summary-teacher-pill {
    filter: brightness(1.02);
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      scroll-behavior: auto !important;
      transition: none !important;
      animation: none !important;
    }
  }
`;
