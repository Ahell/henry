import { css } from "lit";

export const ganttDepotStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
    min-height: 20px;
  }

  .cohort-depot-content {
    min-height: 20px;
    max-height: var(--gantt-row-height);
    overflow: auto;
    padding: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .depot-empty {
    color: var(--color-success-hover);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    padding: var(--space-2) var(--space-3);
    text-align: left;
  }

  .depot-block {
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    color: white;
    cursor: grab;
    user-select: none;
    text-align: left;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: transform 0.1s, box-shadow 0.1s;
    line-height: 1.2;
  }

  .depot-block:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .depot-block:active {
    cursor: grabbing;
    transform: scale(0.98);
  }

  .depot-block.dragging {
    opacity: 0.5;
  }

  .depot-block .course-code {
    font-weight: var(--font-weight-bold);
    display: inline;
    margin-right: 6px;
    letter-spacing: 0.02em;
  }

  .depot-block .course-name {
    font-size: 0.7rem;
    opacity: 0.95;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    margin-top: 2px;
  }

  .prerequisite-course {
    /* Color set via inline style */
  }

  .normal-course {
    background: var(--color-primary-600);
  }

  .two-block-course {
    border: 2px dashed rgba(255, 255, 255, 0.7);
    box-shadow: none;
  }
`;
