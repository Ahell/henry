import { css } from "lit";

export const detailViewHeaderStyles = css`
  :host {
    display: block;
  }

  .detail-view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    margin-bottom: var(--space-4);
    background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.06),
        rgba(255, 255, 255, 0)
      ),
      var(--color-background);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary-700);
    margin-bottom: var(--space-1);
  }

  .title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .detail-view-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: var(--color-gray-100);
    color: var(--color-text-secondary);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    border: 1px solid var(--color-border);
  }

  .pill.warning {
    background: var(--color-warning-light);
    color: var(--color-warning-hover);
    border-color: var(--color-warning);
  }

  .pill.select-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .pill.select-pill select {
    border: none;
    background: transparent;
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    padding: 0;
    min-width: 140px;
    outline: none;
    font-weight: var(--font-weight-medium);
  }

  .title-block {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .detail-view-actions {
    display: flex;
    gap: var(--space-2);
    flex-shrink: 0;
    align-items: center;
  }
`;
