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
    padding: var(--space-2) var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .depot-empty {
    color: var(--color-success-hover);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    padding: var(--space-2) var(--space-3);
    text-align: left;
  }

  .depot-block {
    padding: var(--space-2) var(--space-2);
    border-radius: 0;
    font-size: 0.7rem;
    color: white;
    cursor: grab;
    user-select: none;
    text-align: left;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.22);
    transition: none;
  }

  .depot-block:hover {
    box-shadow: none;
    transform: none;
  }

  .depot-block:active {
    cursor: grabbing;
    transform: translateY(0);
  }

  .depot-block.dragging {
    opacity: 0.5;
  }

  .depot-block .course-code {
    font-weight: bold;
    display: inline;
    margin-right: 6px;
  }

  .depot-block .course-name {
    font-size: 0.65rem;
    opacity: 0.88;
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
