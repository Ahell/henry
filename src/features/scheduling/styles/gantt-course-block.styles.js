import { css } from "lit";

export const ganttCourseBlockStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
  }

  .gantt-block {
    margin: 4px;
    padding: 6px 8px;
    border-radius: 0;
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
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.22);
    transition: none;
  }

  .gantt-block.second-block {
    opacity: 1;
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
    box-shadow: none;
    transform: none;
  }

  .gantt-block.teacher-shortage {
    outline: 2px solid var(--color-info);
    outline-offset: -2px;
  }

  .gantt-block.teacher-shortage.no-compatible-teachers {
    outline: 2px solid var(--color-secondary-500);
    outline-offset: -2px;
  }

  .gantt-block.teacher-shortage.no-available-compatible-teachers {
    outline: 2px solid var(--color-info);
    outline-offset: -2px;
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
    box-shadow: none;
    border: 1px solid rgba(0, 0, 0, 0.08);
    pointer-events: none;
    z-index: 3;
  }

  .gantt-block.no-compatible-teachers .teacher-warning-badge {
    color: #7c3aed;
  }

  .gantt-block.missing-prerequisite {
    outline: 2px solid var(--color-danger);
    outline-offset: -2px;
  }

  .gantt-block.missing-prerequisite::before {
    content: none;
  }

  .gantt-block.before-prerequisite {
    outline: 2px solid var(--color-warning);
    outline-offset: -2px;
  }

  .gantt-block.before-prerequisite::before {
    content: none;
  }

  .prerequisite-course {
    color: #fff;
  }

  .normal-course {
    background: var(--color-primary-600);
  }

  .two-block-course {
    border: 2px dashed rgba(255, 255, 255, 0.7);
    box-shadow: none;
  }
`;
