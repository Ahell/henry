import { css } from "lit";

export const coursesTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  henry-panel {
    flex: 1;
    min-height: 0;
  }

  .tab-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .tab-scroll {
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: auto;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .form-row.two-cols {
    grid-template-columns: 1fr 1fr;
  }

  henry-table {
    margin-top: 0;
  }

  .edit-input {
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-sm);
  }

  .no-prerequisites {
    color: var(--color-text-disabled);
  }

  .compatible-teachers {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .course-code-button {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-primary-700);
    cursor: pointer;
    font: inherit;
    text-decoration: underline;
    text-decoration-color: rgba(15, 23, 42, 0.3);
    text-underline-offset: 2px;
  }

  .course-code-button:hover {
    color: var(--color-primary-800);
    text-decoration-color: rgba(15, 23, 42, 0.5);
  }

  .course-info-grid {
    display: grid;
    gap: var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }

  .course-info-row {
    display: grid;
    grid-template-columns: minmax(120px, 160px) 1fr;
    gap: var(--space-3);
    align-items: start;
    text-align: left;
  }

  .course-info-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .course-info-value {
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    white-space: normal;
    word-break: break-word;
    line-height: 1.3;
  }

  .course-info-section {
    margin-top: var(--space-5);
    display: grid;
    gap: var(--space-3);
  }

  .course-info-section-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .course-info-block {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    background: var(--color-gray-50);
    display: grid;
    gap: var(--space-2);
    text-align: left;
  }

  .course-info-block-title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .course-info-empty {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-align: left;
  }

  @media (max-width: 720px) {
    .course-info-row {
      grid-template-columns: 1fr;
    }
  }
`;
