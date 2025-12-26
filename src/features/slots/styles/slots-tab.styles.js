import { css } from "lit";

export const slotsTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
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
    margin-top: var(--space-4);
  }

  .slot-period-button {
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

  .slot-period-button:hover {
    color: var(--color-primary-800);
    text-decoration-color: rgba(15, 23, 42, 0.5);
  }

  .slot-info-grid {
    display: grid;
    gap: var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }

  .slot-info-row {
    display: grid;
    grid-template-columns: minmax(120px, 160px) 1fr;
    gap: var(--space-3);
    align-items: start;
    text-align: left;
  }

  .slot-info-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .slot-info-value {
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    white-space: normal;
    word-break: break-word;
    line-height: 1.3;
  }

  .slot-info-section {
    margin-top: var(--space-5);
    display: grid;
    gap: var(--space-3);
  }

  .slot-info-section-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .slot-info-block {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    background: var(--color-gray-50);
    display: grid;
    gap: var(--space-2);
    text-align: left;
  }

  .slot-info-block-title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .slot-info-empty {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-align: left;
  }

  @media (max-width: 720px) {
    .slot-info-row {
      grid-template-columns: 1fr;
    }
  }
`;
