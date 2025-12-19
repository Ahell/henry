import { css } from "lit";

export const ganttDepotStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
    height: 100%;
    min-height: 20px;
  }

  .cohort-depot-content {
    height: 100%;
    min-height: 20px;
    overflow: auto;
    padding: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .depot-empty {
    color: var(--color-success-hover);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    padding: var(--space-2);
  }

  .depot-block {
    padding: var(--space-2) var(--space-2);
    border-radius: var(--radius-md);
    font-size: 0.7rem;
    color: white;
    cursor: grab;
    user-select: none;
    text-align: left;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    box-shadow: var(--shadow-xs);
    border: 1px solid rgba(255, 255, 255, 0.22);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .depot-block:hover {
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
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
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  }
`;
