import { css } from "lit";

export const ganttDepotStyles = css`
  :host {
    display: block;
    min-height: 20px;
  }

  .cohort-depot-content {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    align-content: flex-start;
    min-height: 20px;
  }

  .depot-empty {
    color: #28a745;
    font-size: 0.75rem;
    font-weight: bold;
    padding: 4px;
  }

  .depot-block {
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.6rem;
    color: white;
    cursor: grab;
    user-select: none;
    text-align: left;
    min-width: 80px;
    max-width: 170px;
  }

  .depot-block:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .depot-block:active {
    cursor: grabbing;
  }

  .depot-block.dragging {
    opacity: 0.5;
  }

  .depot-block .course-code {
    font-weight: bold;
    display: inline;
    margin-right: 4px;
  }

  .depot-block .course-name {
    font-size: 0.55rem;
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .prerequisite-course {
    /* Color set via inline style */
  }

  .normal-course {
    background: #007bff;
  }

  .two-block-course {
    border: 2px dashed rgba(255, 255, 255, 0.7);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  }
`;
