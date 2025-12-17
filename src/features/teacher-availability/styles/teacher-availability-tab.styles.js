import { css } from "lit";

export const teacherAvailabilityTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    gap: var(--space-6);
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .header-text {
    flex: 1;
    min-width: 260px;
  }

  .description {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    margin: var(--space-2) 0 0;
    line-height: var(--line-height-normal);
  }

  .header-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    align-items: flex-end;
    min-width: 240px;
  }

  .paint-status {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-align: right;
    max-width: 320px;
  }

  .layout-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .legend-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .legend-chip {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-gray-50);
    border: 1px solid var(--color-border);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-full);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
  }

  .legend-left {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    align-items: center;
  }

  .legend-right {
    display: inline-flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    align-items: center;
  }
`;
