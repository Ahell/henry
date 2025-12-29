import { css } from "lit";

export const teacherAvailabilityTableStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
    min-height: 0;
    min-width: 0;
    --teaching-day-default-bg: var(--color-primary-600);
    --teaching-day-default-text: var(--color-background);
    --teaching-day-default-cursor: pointer;
    --teaching-day-default-hover-bg: color-mix(
      in srgb,
      var(--teaching-day-default-bg),
      var(--color-broken-black) 15%
    );
    --teaching-day-default-dimmed-bg: var(--color-primary-100);
    --teaching-day-default-dimmed-text: var(--color-primary-700);
    --teaching-day-default-dimmed-cursor: pointer;
    --teaching-day-default-dimmed-opacity: 0.5;
    --teaching-day-default-dimmed-hover-opacity: 0.7;
    --teaching-day-alt-bg: var(--color-primary-500);
    --teaching-day-alt-text: var(--color-background);
    --teaching-day-alt-cursor: pointer;
    --teaching-day-alt-hover-bg: color-mix(
      in srgb,
      var(--teaching-day-alt-bg),
      var(--color-broken-black) 10%
    );
    --exam-date-locked-bg: var(--color-primary-600);
    --exam-date-locked-text: var(--color-background);
    --exam-date-locked-cursor: not-allowed;
    --exam-date-unlocked-bg: var(--color-primary-100);
    --exam-date-unlocked-text: var(--color-primary-700);
    --exam-date-unlocked-cursor: pointer;
    --exam-date-unlocked-opacity: 0.7;
    --exam-date-unlocked-hover-opacity: 0.9;
    --exam-date-new-bg: var(--color-primary-600);
    --exam-date-new-text: var(--color-background);
    --exam-date-new-cursor: pointer;
    --exam-date-new-hover-bg: color-mix(
      in srgb,
      var(--exam-date-new-bg),
      var(--color-broken-black) 10%
    );
  }

  .table-card {
    display: contents;
  }

  overview-table,
  detail-table {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
  }

  .table-container {
    overflow: auto; /* Both x and y */
    background: transparent;
    flex: 1; /* Allow it to grow */
    min-height: 0;
    min-width: 0;
    width: 100%;
  }

  .table-container.painting-active {
    cursor: crosshair;
  }

  .teacher-timeline-table {
    width: max-content;
    min-width: 100%;
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
    background: var(--color-surface);
  }

  overview-table .teacher-timeline-table th,
  overview-table .teacher-timeline-table td {
    border-right: 1px solid var(--color-border);
  }

  detail-table .teacher-timeline-table th,
  detail-table .teacher-timeline-table td {
    border-right: 1px solid var(--color-border);
  }

  .teacher-timeline-table th:last-child,
  .teacher-timeline-table td:last-child {
    border-right: none;
  }

  .teacher-timeline-table tbody tr:nth-child(even) td {
    background: var(--color-broken-white);
  }

  .teacher-timeline-table tbody tr:hover td {
    background: var(--color-surface-hover);
  }

  .teacher-timeline-table tbody tr:nth-child(even) td:first-child {
    background: var(--color-broken-white);
  }

  .teacher-timeline-table tbody tr:hover td:first-child {
    background: var(--color-surface-hover);
  }

  .teacher-timeline-table th:not(:first-child),
  .teacher-timeline-table td:not(:first-child) {
    width: 120px;
    min-width: 120px;
    max-width: 120px;
  }

  .teacher-timeline-table th {
    background: var(--color-gray-lighter);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-xs);
    position: sticky;
    top: 0;
    z-index: 2;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    border-bottom: 2px solid var(--color-border);
    padding: var(--space-3) var(--space-4);
  }

  .teacher-timeline-table thead th:first-child {
    position: sticky;
    left: 0;
    z-index: 3;
    background: var(--color-gray-lighter);
    font-size: var(--font-size-xs);
    text-align: left;
  }

  .teacher-timeline-table th.slot-header {
    cursor: pointer;
    transition: var(--transition-all);
    background: var(--color-gray-lighter);
    color: var(--color-text-secondary);
    border-color: var(--color-border);
    font-size: var(--font-size-xs);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .teacher-timeline-table th.slot-header:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  .teacher-timeline-table tbody tr td:first-child {
    text-align: left;
    font-weight: var(--font-weight-semibold);
    background: var(--color-surface);
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
    font-size: var(--font-size-xs);
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
    position: relative;
  }

  /* When rendering multiple course codes (stack), let content use full area. */
  .teacher-cell.has-segments {
    padding: 0;
    overflow: hidden;
  }

  .teacher-cell.has-segments.assigned-course,
  .teacher-cell.has-segments.has-course,
  .teacher-cell.has-segments.unavailable {
    background: transparent !important;
    box-shadow: none;
    border-color: transparent;
  }

  .teacher-cell.assigned-course {
    background: var(--color-success);
    color: var(--color-white);
    font-weight: var(--font-weight-semibold);
    border-color: transparent;
    box-shadow: none;
  }

  .teacher-cell.has-course {
    background: var(--color-info);
    color: var(--color-white);
    border-color: transparent;
  }

  .teacher-cell.unavailable {
    background: var(--color-danger);
    color: var(--color-white);
    position: relative;
    border-color: transparent;
    box-shadow: none;
  }

  /* No-course partial unavailability in slot view (some days unavailable): stripe only, no solid fill */
  .teacher-cell.partial-unavailable {
    background: transparent;
    border-color: var(--color-danger-hover);
    border-style: dashed;
  }

  .teacher-cell.partial-unavailable::after {
    content: none;
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
    font-size: var(
      --teacher-cell-code-font-size,
      clamp(10px, 0.95rem, var(--font-size-sm))
    );
  }

  .teacher-cell .course-stack {
    position: absolute;
    inset: 4px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .teacher-cell.has-segments .course-stack {
    inset: 0;
    padding: 0;
    box-sizing: border-box;
    gap: 2px;
  }

  .teacher-cell.many-codes .course-stack {
    gap: 2px;
  }

  .teacher-cell.has-segments.many-codes .course-stack {
    gap: 2px;
  }

  /* Segment base colors (per course) */
  .teacher-cell .course-segment.segment-assigned {
    background: var(--color-success);
    color: var(--color-white);
    border-color: transparent;
  }

  .teacher-cell .course-segment.segment-compatible-free {
    background: var(--color-info);
    color: var(--color-white);
    border-color: transparent;
  }

  .teacher-cell .course-segment.segment-compatible-occupied {
    background: color-mix(in srgb, var(--color-info) 60%, var(--color-gray-600));
    color: var(--color-white-92);
    border-color: transparent;
  }

  .teacher-cell .course-segment {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 0;
    background: transparent;
    border: 1px solid var(--color-broken-black-8);
    border-radius: var(--radius-sm);
  }

  .teacher-cell.many-codes .course-segment {
    padding: 0;
  }

  .teacher-cell .course-segment-text {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: var(--font-weight-semibold);
    font-size: var(
      --teacher-cell-code-font-size,
      clamp(10px, 0.95rem, var(--font-size-sm))
    );
    position: relative;
    z-index: 1;
  }

  .teacher-cell.unavailable .cell-content,
  .teacher-cell.partially-unavailable .cell-content,
  .teacher-cell.partial-availability .cell-content {
    background: transparent;
    color: var(--color-white);
    box-shadow: none;
    position: relative;
    z-index: 1;
  }

  .teacher-cell.partial-conflict .cell-content {
    background: transparent;
    color: var(--color-white);
    box-shadow: none;
    position: relative;
    z-index: 1;
  }

  .teacher-cell.course-unavailable .cell-content {
    background: transparent;
    color: var(--color-white);
    box-shadow: none;
    position: relative;
    z-index: 1;
  }

  /* === Availability overlays (slot view) === */
  /* Info (unavailability exists, but outside this course's active days): blue stripes */
  .teacher-cell.partial-availability {
    border-color: var(--color-info-hover);
    border-style: dashed;
  }

  .teacher-cell.partial-availability::after {
    content: none;
  }

  .teacher-cell .course-segment.partial-availability {
    border-color: var(--color-info-hover);
    border-style: dashed;
  }

  .teacher-cell .course-segment.partial-availability::after {
    content: none;
  }

  /* Partial conflict (some active days unavailable): light red stripes */
  .teacher-cell.partial-conflict {
    border-color: var(--color-danger-hover);
    border-style: dashed;
  }

  .teacher-cell.partial-conflict::after {
    content: none;
  }

  .teacher-cell .course-segment.partial-conflict {
    border-color: var(--color-danger-hover);
    border-style: dashed;
  }

  .teacher-cell .course-segment.partial-conflict::after {
    content: none;
  }

  .teacher-cell .course-segment.partial-conflict .course-segment-text {
    color: var(--color-white);
  }

  /* Full conflict (all active days unavailable): strong red stripes */
  .teacher-cell.course-unavailable {
    border-color: var(--color-danger-hover);
  }

  .teacher-cell.course-unavailable::after {
    content: none;
  }

  .teacher-cell .course-segment.course-unavailable {
    border-color: var(--color-danger-hover);
  }

  .teacher-cell .course-segment.course-unavailable::after {
    content: none;
  }

  /* Keep text readable in "course-unavailable" segments */
  .teacher-cell .course-segment.course-unavailable .course-segment-text {
    color: var(--color-white);
  }

  /* Assigned + Info (utanför kursdagar): ensure blue stripes still visible */
  .teacher-cell .course-segment.segment-assigned.partial-availability::after {
    content: none;
  }

  /* Default teaching day - purple/lila, active */
  .teacher-cell.teaching-day-default:not(.unavailable) {
    background-color: var(--teaching-day-default-bg);
    color: var(--teaching-day-default-text);
    border-color: transparent;
  }

  /* === Header markers (clean three-state model) === */
  /* 1) Ordinarie datum aktiverat: primär underlinje + stark text */
  .teacher-timeline-table th.teaching-day-default-header {
    background: transparent;
    color: var(--color-primary-700);
    cursor: var(--teaching-day-default-cursor);
    font-weight: var(--font-weight-bold);
    border: none;
    border-bottom: 3px solid var(--color-primary-500);
    box-shadow: none;
  }

  .teacher-timeline-table th.teaching-day-default-header:hover {
    border-bottom-color: var(--color-primary-600);
  }

  /* Default teaching day - dimmed (inactive) */
  .teacher-cell.teaching-day-default-dimmed:not(.unavailable)) {
    background-color: var(--teaching-day-default-dimmed-bg);
    opacity: var(--teaching-day-default-dimmed-opacity);
    border-color: transparent;
  }

  /* === Header markers (tre tydliga tillstånd) === */
  /* 1) Ordinarie datum aktiverat */
  .teacher-timeline-table th.teaching-day-default-header {
    background: var(--color-primary-50);
    color: var(--color-primary-500);
    cursor: var(--teaching-day-default-cursor);
    font-weight: var(--font-weight-bold);
    border: 1px solid var(--color-primary-200);
    box-shadow: none;
    position: relative;
    border-radius: 0;
    padding: var(--space-2) var(--space-2);
  }

  .teacher-timeline-table th.teaching-day-default-header:hover {
    border-color: var(--color-primary-300);
    transform: none;
  }

  /* Add a subtle check icon on active default header */
  .teacher-timeline-table th.teaching-day-default-header::before {
    content: "✓";
    position: absolute;
    right: 8px;
    top: 8px;
    font-size: 0.7rem;
    color: var(--color-white);
    background: var(--color-primary-500);
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    box-shadow: none;
  }

  /* 2) Ordinarie datum avmarkerat */
  .teacher-timeline-table th.teaching-day-default-dimmed-header {
    background: var(--color-gray-50);
    color: var(--color-text-secondary);
    cursor: var(--teaching-day-default-dimmed-cursor);
    font-weight: var(--font-weight-bold);
    opacity: var(--teaching-day-default-dimmed-opacity);
    border: 1px dashed var(--color-border);
    box-shadow: none;
  }

  .teacher-timeline-table th.teaching-day-default-dimmed-header:hover {
    opacity: var(--teaching-day-default-dimmed-hover-opacity);
    border-color: var(--color-border-hover);
  }

  /* small minus icon for dimmed default header */
  .teacher-timeline-table th.teaching-day-default-dimmed-header::before {
    content: "—";
    position: absolute;
    right: 8px;
    top: 8px;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    background: transparent;
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
  }

  /* Alternative teaching day - blue */
  .teacher-cell.teaching-day-alt:not(.unavailable) {
    background-color: var(--teaching-day-alt-bg);
    color: var(--teaching-day-alt-text);
    border-color: transparent;
  }

  /* 3) Tillagt icke-ordinarie datum */
  .teacher-timeline-table th.teaching-day-alt-header {
    position: relative;
    background: var(--color-background);
    color: var(--color-primary-600);
    border: 1px dashed var(--color-primary-300);
    font-weight: var(--font-weight-bold);
    box-shadow: none;
    cursor: pointer;
  }

  .teacher-timeline-table th.teaching-day-alt-header::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -7px;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    background: var(--color-primary-500);
    border-radius: 999px;
  }

  /* Use a plus icon instead of only dot for alt days */
  .teacher-timeline-table th.teaching-day-alt-header::before {
    content: "+";
    position: absolute;
    right: 8px;
    top: 8px;
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-white);
    background: var(--color-primary-500);
    border-radius: 999px;
    font-size: 0.7rem;
    box-shadow: none;
  }
  /* focus states for keyboard navigation */
  .teacher-timeline-table th.slot-header:focus-visible {
    outline: 3px solid var(--color-kth-blue-20);
    outline-offset: 2px;
  }

  .teacher-timeline-table th.teaching-day-alt-header:hover {
    border-color: var(--color-primary-400);
    box-shadow: none;
  }

  /* --- Neutralize date header visuals; use pills in weekday row instead --- */
  .teacher-timeline-table th.teaching-day-default-header,
  .teacher-timeline-table th.teaching-day-default-dimmed-header,
  .teacher-timeline-table th.teaching-day-alt-header {
    background: var(--color-gray-lighter) !important;
    color: var(--color-text-secondary) !important;
    border: none !important;
    border-bottom: 2px solid var(--color-border) !important;
    border-right: 1px solid var(--color-border) !important;
    box-shadow: none !important;
    opacity: 1 !important;
    filter: none !important;
    border-radius: 0 !important;
    position: static !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
  }
  .teacher-timeline-table th.teaching-day-default-header:hover,
  .teacher-timeline-table th.teaching-day-default-dimmed-header:hover,
  .teacher-timeline-table th.teaching-day-alt-header:hover {
    transform: none !important;
    background: var(--color-surface-hover) !important;
    color: var(--color-text-primary) !important;
  }
  .teacher-timeline-table th.teaching-day-default-header::before,
  .teacher-timeline-table th.teaching-day-default-dimmed-header::before,
  .teacher-timeline-table th.teaching-day-alt-header::before,
  .teacher-timeline-table th.teaching-day-alt-header::after {
    content: none !important;
  }

  /* Exam date - orange (locked) */
  .teacher-cell.exam-date-locked:not(.unavailable) {
    background-color: var(--exam-date-locked-bg);
    color: var(--exam-date-locked-text);
    border-color: transparent;
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
    color: var(--color-white);
    position: relative;
  }

  /* Keep teaching/exam selections focused on headers; body cells stay neutral unless unavailable or carrying course pills */
  .teacher-cell.teaching-day-default:not(.unavailable):not(.has-course):not(
      .assigned-course
    ),
  .teacher-cell.teaching-day-default-dimmed:not(.unavailable):not(
      .has-course
    ):not(.assigned-course),
  .teacher-cell.teaching-day-alt:not(.unavailable):not(.has-course):not(
      .assigned-course
    ),
  .teacher-cell.exam-date-locked:not(.unavailable):not(.has-course):not(
      .assigned-course
    ),
  .teacher-cell.exam-date-unlocked:not(.unavailable):not(.has-course):not(
      .assigned-course
    ),
  .teacher-cell.exam-date-new:not(.unavailable):not(.has-course):not(
      .assigned-course
    ) {
    background: transparent;
    color: var(--color-text-primary);
    border-color: transparent;
    box-shadow: none;
  }

  /* Detail view should show active course days in blue */
  .teacher-cell[data-is-detail="true"].teaching-day-alt:not(.unavailable) {
    background-color: var(--teaching-day-alt-bg);
    color: var(--teaching-day-alt-text);
    border-color: transparent;
  }

  .teacher-cell.locked {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .teacher-cell.locked::before {
    content: "🔒";
    position: absolute;
    top: 2px;
    left: 2px;
    font-size: 0.7rem;
    opacity: 0.6;
  }

  .teacher-cell .exam-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 2px 6px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
    background: var(--exam-date-locked-bg);
    color: var(--exam-date-locked-text);
    border: 1px solid var(--color-broken-black-8);
    box-shadow: var(--shadow-sm);
    pointer-events: none;
    z-index: 2;
  }

  .teacher-cell .course-segment .exam-badge {
    top: 2px;
    right: 2px;
    padding: 2px 5px;
    font-size: 9px;
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
