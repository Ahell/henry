import { css } from "lit";

export const businessLogicTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
  }

  .row {
    display: flex;
    gap: var(--space-4);
    align-items: center;
    flex-wrap: wrap;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    min-height: var(--button-height-base);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .rule-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .rule {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-4);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    background: var(--color-background);
  }

  .rule-title {
    font-weight: 600;
    margin-bottom: var(--space-1);
  }

  .rule-desc {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
  }

  .rule-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    flex-wrap: wrap;
  }

  .rule-actions henry-input {
    margin-bottom: 0;
  }

  .muted {
    opacity: 0.7;
  }
`;
