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

  /* List container with air between rows */
  .rule-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3); /* Air between rows */
    margin-top: var(--space-4);
  }

  /* Rule items styled with gray background (like Report filters) but sharp & separated */
  .rule {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--color-broken-white); /* Grayer background */
    border: 1px solid var(--color-border);
    border-radius: 0; /* No rounded corners */
    align-items: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .rule.dragging {
    opacity: 0.5;
    background: var(--color-white);
    border: 1px dashed var(--color-border);
  }

  .rule:hover {
    box-shadow: var(--shadow-sm); /* Subtle lift on hover */
  }

  /* Drag handle styling */
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    color: var(--color-text-secondary);
    padding: var(--space-2);
    border-radius: 0;
    transition: all 0.2s;
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
    gap: 2px;
  }

  .rule-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
  }

  .rule-desc {
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    line-height: var(--line-height-normal);
  }

  .rule-actions {
    display: flex;
    gap: var(--space-8);
    align-items: center;
    flex-wrap: wrap;
  }

  .rule-actions henry-input {
    margin-bottom: 0;
    /* Force smaller input size to match small buttons */
    --input-height-base: 32px;
    --font-size-base: var(--font-size-xs); /* Use xs font for input text */
    --font-size-sm: var(--font-size-xs);   /* Ensure label uses xs too if present */
  }

  .rule-actions henry-switch {
    /* Scale down switch label */
    --henry-switch-label-size: var(--font-size-xs);
  }

  /* Ensure buttons are aligned */
  .rule-actions henry-button {
    /* Buttons are already set to size="small" in markup */
  }

  .muted {
    opacity: 0.6;
    background: var(--color-gray-lighter); /* Slightly different gray if disabled */
  }
`;
