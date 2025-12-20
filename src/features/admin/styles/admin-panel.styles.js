import { css } from "lit";

export const adminPanelStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
    padding: 0;
  }

  .tabs {
    display: inline-flex;
    gap: var(--space-2);
    margin: var(--space-2) 0 var(--space-5);
    flex-wrap: wrap;
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-gray-50);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
  }

  .tab-button {
    background: transparent;
    border: 1px solid transparent;
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    border-radius: var(--radius-sm);
    transition: var(--transition-all);
  }

  .tab-button.active {
    color: var(--color-primary-700);
    background: var(--color-primary-50);
    border-color: var(--color-primary-200);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .tab-button:hover {
    color: var(--color-text-primary);
    background: var(--color-gray-100);
    border-color: var(--color-border);
  }
`;
