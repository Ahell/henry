import { css } from "lit";

export const ganttCellStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
    position: relative;
  }

  .cell-content {
    min-height: 44px;
    max-height: var(--gantt-row-height);
    position: relative;
    padding: var(--space-2) var(--space-1);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    overflow: auto;
  }

  .cohort-start-marker {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    background: rgba(58, 116, 246, 0.92);
    color: #fff;
    font-size: 0.6rem;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-semibold);
    z-index: 1;
    box-shadow: var(--shadow-xs);
    pointer-events: none;
  }

  /* available-teachers overlay moved to column headers */
`;
