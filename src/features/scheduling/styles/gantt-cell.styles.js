import { css } from "lit";

export const ganttCellStyles = css`
  :host {
    display: block;
    position: relative;
  }

  .cell-content {
    min-height: 44px;
    position: relative;
  }

  .cohort-start-marker {
    position: absolute;
    top: 2px;
    left: 2px;
    background: #2196f3;
    color: white;
    font-size: 0.5rem;
    padding: 1px 3px;
    border-radius: 2px;
    font-weight: bold;
    z-index: 1;
  }

  .available-teachers-overlay {
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    background: rgba(76, 175, 80, 0.9);
    color: white;
    font-size: 0.45rem;
    padding: 2px 3px;
    border-radius: 3px;
    z-index: 10;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 1px;
    line-height: 1.2;
  }
`;
