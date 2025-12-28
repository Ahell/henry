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
    margin-top: var(--space-4);
  }

  .rule {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: var(--space-4);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    background: var(--color-surface); /* Updated to surface */
    align-items: center;
    border-radius: var(--radius-base);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .rule.dragging {
    opacity: 0.5;
    background: var(--color-broken-white);
    border: 1px dashed var(--color-border);
  }

  /* Drag handle styling */
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    color: var(--color-text-secondary);
    padding: var(--space-1);
    border-radius: var(--radius-sm);
  }

  .drag-handle:hover {
    color: var(--color-text-primary);
    background: var(--color-gray-lighter);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .drag-handle[disabled] {
    cursor: default;
    opacity: 0.3;
    pointer-events: none;
  }

  .rule-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .rule-title {
    font-weight: 600;
    margin-bottom: var(--space-1);
    color: var(--color-text-primary);
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