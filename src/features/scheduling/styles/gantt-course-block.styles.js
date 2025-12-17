import { css } from "lit";

export const ganttCourseBlockStyles = css`
  :host {
    display: block;
  }

  .gantt-block {
    margin: 1px;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.6rem;
    color: white;
    font-weight: bold;
    cursor: grab;
    overflow: hidden;
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1.1;
    position: relative;
    z-index: 2;
  }

  .gantt-block.second-block {
    opacity: 0.85;
  }

  .gantt-block .course-code {
    font-weight: bold;
    font-size: 0.6rem;
    position: relative;
    z-index: 2;
  }

  .gantt-block .course-name {
    font-size: 0.55rem;
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
  }

  .gantt-block.dragging {
    opacity: 0.5;
  }

  .gantt-block:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .gantt-block.missing-prerequisite {
    border: 4px solid #f44336 !important;
    animation: pulse-warning-red 1s infinite;
    box-shadow: 0 0 12px rgba(244, 67, 54, 0.7);
    outline: 3px solid rgba(244, 67, 54, 0.3);
    outline-offset: 2px;
  }

  @keyframes pulse-warning-red {
    0%,
    100% {
      box-shadow: 0 0 12px rgba(244, 67, 54, 0.7);
      border-color: #f44336;
    }
    50% {
      box-shadow: 0 0 24px rgba(244, 67, 54, 1);
      border-color: #d32f2f;
    }
  }

  .gantt-block.before-prerequisite {
    border: 4px dashed #ff9800 !important;
    animation: pulse-warning-orange 1.5s infinite;
    box-shadow: inset 0 0 0 2px rgba(255, 152, 0, 0.3);
    position: relative;
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
      transparent,
      transparent 8px,
      rgba(255, 152, 0, 0.15) 8px,
      rgba(255, 152, 0, 0.15) 16px
    );
    pointer-events: none;
    z-index: 1;
  }

  @keyframes pulse-warning-orange {
    0%,
    100% {
      border-color: #ff9800;
    }
    50% {
      border-color: #f57c00;
    }
  }

  .prerequisite-course {
    color: #fff;
  }

  .normal-course {
    background: #007bff;
  }

  .two-block-course {
    border: 2px dashed rgba(255, 255, 255, 0.7);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  }
`;
