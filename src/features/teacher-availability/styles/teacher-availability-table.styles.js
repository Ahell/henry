import { css } from "lit";

export const teacherAvailabilityTableStyles = css`
  :host {
    display: block;
    --teaching-day-default-bg: var(--color-primary-600);
    --teaching-day-default-text: var(--color-background);
    --teaching-day-default-cursor: pointer;
    --teaching-day-default-hover-bg: color-mix(
      in srgb,
      var(--teaching-day-default-bg),
      black 15%
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
      black 10%
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
    position: relative;
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

  /* No-course partial unavailability in slot view (some days unavailable): stripe only, no solid fill */
  .teacher-cell.partial-unavailable {
    background: transparent;
    border-color: rgba(15, 23, 42, 0.18);
  }

  .teacher-cell.partial-unavailable::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(15, 23, 42, 0.16) 0px,
      rgba(15, 23, 42, 0.16) 8px,
      transparent 8px,
      transparent 16px
    );
    opacity: 0.95;
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

  .teacher-cell .course-stack {
    position: absolute;
    inset: 4px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .teacher-cell .course-segment {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 0 6px;
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: var(--radius-sm);
  }

  .teacher-cell .course-segment-text {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: var(--font-weight-semibold);
    font-size: clamp(10px, 0.95rem, var(--font-size-sm));
    position: relative;
    z-index: 1;
  }

  .teacher-cell.unavailable .cell-content,
  .teacher-cell.partially-unavailable .cell-content,
  .teacher-cell.partial-availability .cell-content {
    background: transparent;
    color: white;
    box-shadow: none;
    position: relative;
    z-index: 1;
  }

  .teacher-cell.partial-conflict .cell-content {
    background: transparent;
    color: white;
    box-shadow: none;
    position: relative;
    z-index: 1;
  }

  .teacher-cell.course-unavailable .cell-content {
    background: transparent;
    color: white;
    box-shadow: none;
    position: relative;
    z-index: 1;
  }

  /* Partial availability stripes (slot view) */
  .teacher-cell.partial-availability::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
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

  .teacher-cell .course-segment.partial-availability::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
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

  /* Partial conflict (overlaps active course days): red base + stripes */
  .teacher-cell.partial-conflict {
    background: var(--color-danger) !important;
    color: white;
    border-color: transparent;
    box-shadow: var(--shadow-danger);
  }

  .teacher-cell.partial-conflict::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
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

  .teacher-cell .course-segment.partial-conflict {
    background: var(--color-danger);
    color: white;
  }

  .teacher-cell .course-segment.partial-conflict .course-segment-text {
    color: white;
  }

  .teacher-cell.course-unavailable {
    background: var(--color-danger) !important;
    color: white;
    border-color: transparent;
    box-shadow: var(--shadow-danger);
  }

  .teacher-cell .course-segment.course-unavailable {
    background: var(--color-danger);
    color: white;
  }

  .teacher-cell .course-segment.course-unavailable .course-segment-text {
    color: white;
  }

  /* === Assigned course + availability warnings ===
     Keep "assigned" (green) base and overlay colored stripes instead of
     switching to a full red background. */

  /* 1) Tilldelad + Otillgänglig (hela kursen): green + strong red stripes */
  .teacher-cell.assigned-course.course-unavailable {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    ) !important;
    box-shadow: var(--shadow-success);
  }

  .teacher-cell.assigned-course.course-unavailable::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.55) 0px,
      rgba(239, 68, 68, 0.55) 8px,
      rgba(239, 68, 68, 0) 8px,
      rgba(239, 68, 68, 0) 16px
    );
    opacity: 0.95;
  }

  /* 2) Tilldelad + Krock (delvis): green + light red stripes */
  .teacher-cell.assigned-course.partial-conflict {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    ) !important;
    box-shadow: var(--shadow-success);
  }

  .teacher-cell.assigned-course.partial-conflict::after {
    background: repeating-linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.28) 0px,
      rgba(239, 68, 68, 0.28) 8px,
      rgba(239, 68, 68, 0) 8px,
      rgba(239, 68, 68, 0) 16px
    );
    opacity: 0.95;
  }

  /* 3) Tilldelad + Info (utanför kursdagar): green + light blue stripes */
  .teacher-cell.assigned-course.partial-availability::after {
    background: repeating-linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.28) 0px,
      rgba(59, 130, 246, 0.28) 8px,
      rgba(59, 130, 246, 0) 8px,
      rgba(59, 130, 246, 0) 16px
    );
    opacity: 0.9;
  }

  /* Course stack segments inside an assigned cell */
  .teacher-cell.assigned-course .course-segment.course-unavailable {
    background: transparent;
  }

  .teacher-cell.assigned-course .course-segment.course-unavailable::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: repeating-linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.55) 0px,
      rgba(239, 68, 68, 0.55) 8px,
      rgba(239, 68, 68, 0) 8px,
      rgba(239, 68, 68, 0) 16px
    );
    opacity: 0.95;
  }

  .teacher-cell.assigned-course .course-segment.partial-conflict {
    background: transparent;
    color: white;
  }

  .teacher-cell.assigned-course .course-segment.partial-conflict::after {
    background: repeating-linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.28) 0px,
      rgba(239, 68, 68, 0.28) 8px,
      rgba(239, 68, 68, 0) 8px,
      rgba(239, 68, 68, 0) 16px
    );
    opacity: 0.95;
  }

  .teacher-cell.assigned-course .course-segment.partial-availability::after {
    background: repeating-linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.28) 0px,
      rgba(59, 130, 246, 0.28) 8px,
      rgba(59, 130, 246, 0) 8px,
      rgba(59, 130, 246, 0) 16px
    );
    opacity: 0.9;
  }

  .teacher-cell .course-segment.partial-conflict::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
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
    border-bottom: 3px solid var(--color-primary-500, #3b82f6);
    box-shadow: none;
  }

  .teacher-timeline-table th.teaching-day-default-header:hover {
    border-bottom-color: var(--color-primary-600, #2563eb);
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
    background: linear-gradient(180deg, #f4f9ff 0%, #eef5ff 100%);
    color: #1d4ed8;
    cursor: var(--teaching-day-default-cursor);
    font-weight: var(--font-weight-bold);
    border: 1px solid #d5e6ff;
    box-shadow: inset 0 -4px 0 #3b82f6;
    position: relative;
    border-radius: 8px 8px 0 0;
    padding: calc(var(--space-2) + 6px) var(--space-2);
  }

  .teacher-timeline-table th.teaching-day-default-header:hover {
    border-color: #c3d8ff;
    box-shadow: inset 0 -4px 0 #2563eb;
    transform: translateY(-2px);
  }

  /* Add a subtle check icon on active default header */
  .teacher-timeline-table th.teaching-day-default-header::before {
    content: "✓";
    position: absolute;
    right: 8px;
    top: 8px;
    font-size: 0.7rem;
    color: #ffffff;
    background: #3b82f6;
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  /* 2) Ordinarie datum avmarkerat */
  .teacher-timeline-table th.teaching-day-default-dimmed-header {
    background: linear-gradient(180deg, #fbfbfd 0%, #f7f8fb 100%);
    color: #6b7280;
    cursor: var(--teaching-day-default-dimmed-cursor);
    font-weight: var(--font-weight-bold);
    opacity: var(--teaching-day-default-dimmed-opacity);
    border: 1px dashed #e5e7eb;
    box-shadow: inset 0 -2px 0 #d1d5db;
  }

  .teacher-timeline-table th.teaching-day-default-dimmed-header:hover {
    opacity: var(--teaching-day-default-dimmed-hover-opacity);
    border-color: #cbd5e1;
  }

  /* small minus icon for dimmed default header */
  .teacher-timeline-table th.teaching-day-default-dimmed-header::before {
    content: "—";
    position: absolute;
    right: 8px;
    top: 8px;
    font-size: 0.8rem;
    color: #6b7280;
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
    background: #ffffff;
    color: #6d28d9;
    border: 1px dashed #c4b5fd;
    font-weight: var(--font-weight-bold);
    box-shadow: inset 0 -4px 0 #7c3aed;
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
    background: #7c3aed;
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
    color: #ffffff;
    background: #7c3aed;
    border-radius: 999px;
    font-size: 0.7rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  /* focus states for keyboard navigation */
  .teacher-timeline-table th.slot-header:focus-visible {
    outline: 3px solid rgba(59, 130, 246, 0.2);
    outline-offset: 2px;
  }

  .teacher-timeline-table th.teaching-day-alt-header:hover {
    border-color: #a78bfa;
    box-shadow: inset 0 -3px 0 #6d28d9;
  }

  /* --- Neutralize date header visuals; use pills in weekday row instead --- */
  .teacher-timeline-table th.teaching-day-default-header,
  .teacher-timeline-table th.teaching-day-default-dimmed-header,
  .teacher-timeline-table th.teaching-day-alt-header {
    background: var(--color-gray-100) !important;
    color: #0f172a !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: none !important;
    opacity: 1 !important;
    filter: none !important;
    border-radius: 0 !important;
    position: static !important;
  }
  .teacher-timeline-table th.teaching-day-default-header:hover,
  .teacher-timeline-table th.teaching-day-default-dimmed-header:hover,
  .teacher-timeline-table th.teaching-day-alt-header:hover {
    transform: none !important;
    background: var(--color-gray-100) !important;
    color: #0f172a !important;
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
    color: white;
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
    border: 1px solid rgba(0, 0, 0, 0.08);
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
