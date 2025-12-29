import { css } from "lit";

export const teachersTabStyles = css`
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

  henry-table {
    margin-top: 0;
  }

  .edit-input {
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-sm);
  }

  .teacher-name-button {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-primary-700);
    cursor: pointer;
    font: inherit;
    text-decoration: underline;
    text-decoration-color: var(--color-broken-black-30);
    text-underline-offset: 2px;
  }

  .teacher-name-button:hover {
    color: var(--color-primary-800);
    text-decoration-color: var(--color-broken-black-50);
  }

  .teacher-info-grid {
    display: grid;
    gap: var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }

  .teacher-info-row {
    display: grid;
    grid-template-columns: minmax(120px, 160px) 1fr;
    gap: var(--space-3);
    align-items: start;
    text-align: left;
  }

  .teacher-info-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .teacher-info-value {
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    white-space: normal;
    word-break: break-word;
    line-height: 1.3;
  }

  .teacher-info-section {
    margin-top: var(--space-5);
    display: grid;
    gap: var(--space-3);
  }

  .teacher-info-section-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .teacher-info-block {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    background: var(--color-gray-50);
    display: grid;
    gap: var(--space-2);
    text-align: left;
  }

  .teacher-info-block-title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .teacher-info-empty {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-align: left;
  }

  @media (max-width: 720px) {
    .teacher-info-row {
      grid-template-columns: 1fr;
    }
  }
`;
