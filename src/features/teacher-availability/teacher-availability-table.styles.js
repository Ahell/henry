import { css } from "lit";

export const teacherAvailabilityTableStyles = css`
  :host {
    display: block;
    --teaching-day-default-bg: var(--color-secondary-600);
    --teaching-day-default-text: var(--color-background);
    --teaching-day-default-cursor: pointer;
    --teaching-day-default-hover-bg: color-mix(
      in srgb,
      var(--teaching-day-default-bg),
      black 15%
    );
    --teaching-day-default-dimmed-bg: var(--color-secondary-200);
    --teaching-day-default-dimmed-text: var(--color-secondary-700);
    --teaching-day-default-dimmed-cursor: pointer;
    --teaching-day-default-dimmed-opacity: 0.5;
    --teaching-day-default-dimmed-hover-opacity: 0.7;
    --teaching-day-alt-bg: var(--color-info);
    --teaching-day-alt-text: var(--color-background);
    --teaching-day-alt-cursor: pointer;
    --teaching-day-alt-hover-bg: color-mix(
      in srgb,
      var(--teaching-day-alt-bg),
      black 10%
    );
    --exam-date-locked-bg: var(--color-warning-hover);
    --exam-date-locked-text: var(--color-background);
    --exam-date-locked-cursor: not-allowed;
    --exam-date-unlocked-bg: var(--color-warning-light);
    --exam-date-unlocked-text: var(--color-warning-hover);
    --exam-date-unlocked-cursor: pointer;
    --exam-date-unlocked-opacity: 0.7;
    --exam-date-unlocked-hover-opacity: 0.9;
    --exam-date-new-bg: var(--color-warning);
    --exam-date-new-text: var(--color-background);
    --exam-date-new-cursor: pointer;
    --exam-date-new-hover-bg: color-mix(
      in srgb,
      var(--exam-date-new-bg),
      black 10%
    );
  }

  .table-card {
    display: contents;
  }

  .table-container {
    overflow-x: auto;
    background: var(--color-background);
  }

  .table-container.painting-active {
    cursor: crosshair;
  }

  .teacher-timeline-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .teacher-timeline-table th,
  .teacher-timeline-table td {
    border: none;
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-4) var(--space-2);
    text-align: center;
    min-width: 96px;
    background: var(--color-background);
  }

  .teacher-timeline-table tbody tr:nth-child(even) td {
    background: var(--color-gray-50);
  }

  .teacher-timeline-table tbody tr:hover td {
    background: var(--color-primary-50);
  }

  .teacher-timeline-table tbody tr:nth-child(even) td:first-child {
    background: var(--color-gray-50);
  }

  .teacher-timeline-table tbody tr:hover td:first-child {
    background: var(--color-primary-50);
  }

  .teacher-timeline-table th:not(:first-child),
  .teacher-timeline-table td:not(:first-child) {
    width: 120px;
    min-width: 120px;
    max-width: 120px;
  }

  .teacher-timeline-table th {
    background: var(--color-gray-100);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .teacher-timeline-table thead th:first-child {
    position: sticky;
    left: 0;
    z-index: 3;
    background: var(--color-gray-100);
  }

  .teacher-timeline-table th.slot-header {
    cursor: pointer;
    transition: var(--transition-all);
    background: var(--color-gray-100);
    color: var(--color-text-primary);
    border-color: var(--color-border);
  }

  .teacher-timeline-table th.slot-header:hover {
    background: var(--color-gray-200);
  }

  .teacher-timeline-table tbody tr td:first-child {
    text-align: left;
    font-weight: var(--font-weight-semibold);
    background: var(--color-background);
    position: sticky;
    left: 0;
    z-index: 2;
    min-width: 160px;
    box-shadow: 2px 0 0 var(--color-border);
  }

  .teacher-timeline-table tr:last-child td {
    border-bottom: none;
  }

  .teacher-name {
    display: block;
    color: var(--color-text-primary);
  }

  .teacher-department {
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-normal);
  }

  .teacher-cell {
    display: flex;
    width: 100%;
    max-width: 100%;
    height: 64px;
    min-height: 64px;
    max-height: 64px;
    padding: var(--space-4) var(--space-2);
    cursor: pointer;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    transition: var(--transition-all);
    user-select: none;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    background: transparent;
    text-align: center;
    box-sizing: border-box;
  }

  .teacher-cell.assigned-course {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    );
    color: white;
    font-weight: var(--font-weight-semibold);
    border-color: transparent;
    box-shadow: var(--shadow-success);
  }

  .teacher-cell.has-course {
    background: linear-gradient(
      135deg,
      var(--color-info),
      var(--color-info-hover)
    );
    color: white;
    border-color: transparent;
  }

  .teacher-cell.unavailable {
    background: var(--color-danger);
    color: white;
    position: relative;
    border-color: transparent;
    box-shadow: var(--shadow-danger);
  }

  .teacher-cell .cell-content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    width: 100%;
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-semibold);
    text-align: center;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: clamp(10px, 0.95rem, var(--font-size-sm));
  }

  .teacher-cell.unavailable .cell-content,
  .teacher-cell.partially-unavailable .cell-content {
    background: transparent;
    color: white;
    box-shadow: none;
  }

  /* Default teaching day - purple/lila, active */
  .teacher-cell.teaching-day-default:not(.unavailable) {
    background-color: var(--teaching-day-default-bg);
    color: var(--teaching-day-default-text);
    border-color: transparent;
  }

  .teacher-timeline-table td:has(.teacher-cell.teaching-day-default) {
    background-color: var(--teaching-day-default-bg);
  }

  .teacher-timeline-table th.teaching-day-default-header {
    background-color: var(--teaching-day-default-bg);
    color: var(--teaching-day-default-text);
    cursor: var(--teaching-day-default-cursor);
    font-weight: var(--font-weight-bold);
  }

  .teacher-timeline-table th.teaching-day-default-header:hover {
    background-color: var(--teaching-day-default-hover-bg);
  }

  /* Default teaching day - dimmed (inactive) */
  .teacher-cell.teaching-day-default-dimmed:not(.unavailable) {
    background-color: var(--teaching-day-default-dimmed-bg);
    opacity: var(--teaching-day-default-dimmed-opacity);
    border-color: transparent;
  }

  .teacher-timeline-table td:has(.teacher-cell.teaching-day-default-dimmed) {
    background-color: var(--teaching-day-default-dimmed-bg);
    opacity: var(--teaching-day-default-dimmed-opacity);
  }

  .teacher-timeline-table th.teaching-day-default-dimmed-header {
    background-color: var(--teaching-day-default-dimmed-bg);
    color: var(--teaching-day-default-dimmed-text);
    cursor: var(--teaching-day-default-dimmed-cursor);
    font-weight: var(--font-weight-bold);
    opacity: var(--teaching-day-default-dimmed-opacity);
  }

  .teacher-timeline-table th.teaching-day-default-dimmed-header:hover {
    opacity: var(--teaching-day-default-dimmed-hover-opacity);
  }

  /* Alternative teaching day - blue */
  .teacher-cell.teaching-day-alt:not(.unavailable) {
    background-color: var(--teaching-day-alt-bg);
    color: var(--teaching-day-alt-text);
    border-color: transparent;
  }

  .teacher-timeline-table td:has(.teacher-cell.teaching-day-alt) {
    background-color: var(--teaching-day-alt-bg);
  }

  .teacher-timeline-table th.teaching-day-alt-header {
    background-color: var(--teaching-day-alt-bg);
    color: var(--teaching-day-alt-text);
    cursor: var(--teaching-day-alt-cursor);
    font-weight: var(--font-weight-bold);
  }

  .teacher-timeline-table th.teaching-day-alt-header:hover {
    background-color: var(--teaching-day-alt-hover-bg);
  }

  /* Exam date - orange (locked) */
  .teacher-cell.exam-date-locked:not(.unavailable) {
    background-color: var(--exam-date-locked-bg);
    color: var(--exam-date-locked-text);
    border-color: transparent;
  }

  .teacher-timeline-table td:has(.teacher-cell.exam-date-locked) {
    background-color: var(--exam-date-locked-bg);
  }

  .teacher-timeline-table th.exam-date-locked-header {
    background-color: var(--exam-date-locked-bg);
    color: var(--exam-date-locked-text);
    cursor: var(--exam-date-locked-cursor);
    font-weight: var(--font-weight-bold);
  }

  /* Exam date - dimmed orange (unlocked) */
  .teacher-cell.exam-date-unlocked:not(.unavailable) {
    background-color: var(--exam-date-unlocked-bg);
    opacity: var(--exam-date-unlocked-opacity);
    border-color: transparent;
  }

  .teacher-timeline-table td:has(.teacher-cell.exam-date-unlocked) {
    background-color: var(--exam-date-unlocked-bg);
    opacity: var(--exam-date-unlocked-opacity);
  }

  .teacher-timeline-table th.exam-date-unlocked-header {
    background-color: var(--exam-date-unlocked-bg);
    color: var(--exam-date-unlocked-text);
    cursor: var(--exam-date-unlocked-cursor);
    font-weight: var(--font-weight-bold);
    opacity: var(--exam-date-unlocked-opacity);
  }

  .teacher-timeline-table th.exam-date-unlocked-header:hover {
    opacity: var(--exam-date-unlocked-hover-opacity);
  }

  /* Exam date - yellow (new selection) */
  .teacher-cell.exam-date-new:not(.unavailable) {
    background-color: var(--exam-date-new-bg);
    color: var(--exam-date-new-text);
    border-color: transparent;
  }

  .teacher-timeline-table td:has(.teacher-cell.exam-date-new) {
    background-color: var(--exam-date-new-bg);
  }

  .teacher-timeline-table th.exam-date-new-header {
    background-color: var(--exam-date-new-bg);
    color: var(--exam-date-new-text);
    cursor: var(--exam-date-new-cursor);
    font-weight: var(--font-weight-bold);
  }

  .teacher-timeline-table th.exam-date-new-header:hover {
    background-color: var(--exam-date-new-hover-bg);
  }

  .teacher-cell.partially-unavailable {
    background: var(--color-danger);
    color: white;
    position: relative;
  }

  .teacher-cell.locked {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .teacher-cell.locked::before {
    content: "🔒";
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 0.7rem;
    opacity: 0.6;
  }

  .painting-active .teacher-cell:hover {
    opacity: 0.85;
  }

  .painting-active .teacher-cell.locked:hover {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .empty-state {
    text-align: center;
    padding: var(--space-8);
    color: var(--color-text-secondary);
    background: var(--color-gray-50);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
  }
`;
