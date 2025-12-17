import { css } from "lit";

export const ganttSummaryRowStyles = css`
  :host {
    display: table-row;
  }

  .summary-label {
    font-weight: bold;
    font-size: 0.75rem;
    text-align: right;
    padding-right: 8px;
    background: #e9ecef;
    border-top: 2px solid #dee2e6;
  }

  .summary-cell {
    background: #e9ecef;
    vertical-align: top;
    padding: 4px;
    border-top: 2px solid #dee2e6;
  }

  .summary-course {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 0.6rem;
    color: white;
    margin-bottom: 4px;
  }

  .summary-course .course-header {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .summary-course .course-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: bold;
  }

  .summary-course .participant-count {
    font-weight: bold;
    background: rgba(255, 255, 255, 0.3);
    padding: 1px 4px;
    border-radius: 2px;
  }

  .summary-course .summary-teacher-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 3px;
    padding: 4px;
  }

  .summary-course .summary-teacher-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.55rem;
    color: #333;
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .summary-course .summary-teacher-row:hover {
    background: #e0e0e0;
  }

  .summary-course .summary-teacher-row input {
    width: 12px;
    height: 12px;
    margin: 0;
    accent-color: #4caf50;
    cursor: pointer;
  }

  .summary-course .summary-teacher-row label {
    cursor: pointer;
    flex: 1;
  }

  .summary-course .summary-teacher-row.assigned {
    background: #c8e6c9;
    font-weight: 600;
    color: #2e7d32;
  }

  .summary-course .summary-teacher-row.assigned:hover {
    background: #a5d6a7;
  }
`;
