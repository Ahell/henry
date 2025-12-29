import { css } from "lit";

export const ganttCourseBlockStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
  }

  .gantt-block {
    margin: 4px; /* Slight spacing within the cell */
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    font-family: var(--font-family-base);
    font-size: 0.8rem;
    color: var(--course-text-color, var(--color-white));
    font-weight: var(--font-weight-medium);
    cursor: grab;
    overflow: hidden;
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    text-align: left;
    line-height: 1.25;
    position: relative;
    z-index: 2;
    box-shadow: var(--shadow-sm); /* Subtle depth */
    border: 1px solid var(--color-white-15); /* Soft highlight border */
    transition: transform 0.1s, box-shadow 0.1s;
  }

  .gantt-block:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
    z-index: 10;
  }

  .gantt-block:active {
    cursor: grabbing;
    transform: scale(0.98);
    box-shadow: var(--shadow-sm);
  }

  .gantt-block.second-block {
    opacity: 0.95;
  }

  .gantt-block .course-code {
    font-weight: var(--font-weight-bold);
    font-size: 0.8rem;
    letter-spacing: 0.02em;
    margin-bottom: 2px;
  }

  .gantt-block .course-name {
    font-size: 0.72rem;
    font-weight: var(--font-weight-medium);
    opacity: 0.95;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Warning Badges & Borders */
  .gantt-block.teacher-shortage {
    box-shadow: 0 0 0 2px var(--color-info), var(--shadow-sm);
  }

  .gantt-block.missing-prerequisite {
    box-shadow: 0 0 0 2px var(--color-danger), var(--shadow-sm);
  }

  .gantt-block.before-prerequisite {
    box-shadow: 0 0 0 2px var(--color-warning), var(--shadow-sm);
  }

  /* Badge in top right */
  .gantt-block .teacher-warning-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 16px;
    height: 16px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 900;
    background: var(--color-white);
    color: var(--color-info-text);
    box-shadow: 0 1px 2px var(--color-broken-black-20);
  }

  .gantt-block.no-compatible-teachers .teacher-warning-badge {
    color: var(--color-danger);
  }

  .normal-course {
    background: var(--color-primary-500);
  }

  .two-block-course {
    border: 2px dashed var(--color-white-50);
  }
`;
