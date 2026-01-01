import { css } from "lit";

export const documentationTabStyles = css`
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

  .layout-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-height: 0;
  }

  .tabs-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .tab-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .section-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--space-4);
  }

  .section-card {
    background: var(--color-broken-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);
  }

  .section-title {
    margin-bottom: var(--space-3);
  }

  p {
    margin: 0 0 var(--space-3);
    color: var(--color-text-secondary);
    font-family: var(--font-family-base);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
  }

  ul,
  ol {
    margin: 0 0 var(--space-3);
    padding-left: var(--space-5);
    color: var(--color-text-secondary);
    font-family: var(--font-family-base);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
  }

  li {
    margin-bottom: var(--space-2);
  }

  .definition-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .definition-row {
    display: grid;
    grid-template-columns: minmax(140px, 200px) 1fr;
    gap: var(--space-3);
    align-items: start;
  }

  .definition-term {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .definition-desc {
    color: var(--color-text-secondary);
  }

  .callout {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-white);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
  }

  .callout strong {
    color: var(--color-text-primary);
  }

  @media (max-width: 720px) {
    .definition-row {
      grid-template-columns: 1fr;
    }
  }
`;
