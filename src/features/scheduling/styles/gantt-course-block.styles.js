import { css } from "lit";

export const ganttCourseBlockStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
  }

  .gantt-block {
    margin: 4px;
    padding: 6px 8px;
    border-radius: var(--radius-md);
    font-size: 0.7rem;
    color: white;
    font-weight: var(--font-weight-semibold);
    cursor: grab;
    overflow: hidden;
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    text-align: left;
    line-height: 1.15;
    position: relative;
    z-index: 2;
    box-shadow: var(--shadow-xs);
    border: 1px solid rgba(255, 255, 255, 0.22);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .gantt-block.second-block {
    opacity: 0.85;
  }

  .gantt-block .course-code {
    font-weight: var(--font-weight-bold);
    font-size: 0.7rem;
    position: relative;
    z-index: 2;
  }

  .gantt-block .course-name {
    font-size: 0.65rem;
    font-weight: normal;
    opacity: 0.9;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    z-index: 2;
  }

  .gantt-block .warning-icon {
    position: relative;
    z-index: 2;
  }

  .gantt-block:active {
    cursor: grabbing;
    transform: translateY(0);
  }

  .gantt-block.dragging {
    opacity: 0.5;
  }

  .gantt-block:hover {
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }

  .gantt-block.teacher-shortage {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.55), var(--shadow-sm);
  }

  .gantt-block.teacher-shortage.no-compatible-teachers {
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.55), var(--shadow-sm);
  }

  .gantt-block.teacher-shortage.no-available-compatible-teachers {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.55), var(--shadow-sm);
  }

  .gantt-block .teacher-warning-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 900;
    background: rgba(255, 255, 255, 0.92);
    color: var(--color-info-hover);
    box-shadow: var(--shadow-sm);
    pointer-events: none;
    z-index: 3;
  }

  .gantt-block.no-compatible-teachers .teacher-warning-badge {
    color: #7c3aed;
  }

  .gantt-block.missing-prerequisite {
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.6), var(--shadow-sm);
  }

  .gantt-block.missing-prerequisite::before {
    content: "";
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      rgba(239, 68, 68, 0.0),
      rgba(239, 68, 68, 0.0) 10px,
      rgba(239, 68, 68, 0.14) 10px,
      rgba(239, 68, 68, 0.14) 20px
    );
    pointer-events: none;
    z-index: 1;
  }

  .gantt-block.before-prerequisite {
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.55), var(--shadow-sm);
  }

  .gantt-block.before-prerequisite::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      rgba(245, 158, 11, 0.0),
      rgba(245, 158, 11, 0.0) 10px,
      rgba(245, 158, 11, 0.12) 10px,
      rgba(245, 158, 11, 0.12) 20px
    );
    pointer-events: none;
    z-index: 1;
  }

  .prerequisite-course {
    color: #fff;
  }

  .normal-course {
    background: var(--color-primary-600);
  }

  .two-block-course {
    border: 2px dashed rgba(255, 255, 255, 0.7);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  }
`;
