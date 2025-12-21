import { css } from "lit";

export const reportTabStyles = css`
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

  .filters {
    padding: var(--space-4);
    background: var(--color-gray-50);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-xs);
    margin: var(--space-4) 0 var(--space-3);
  }

  .filters-bar {
    display: flex;
    align-items: end;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .filters-bar henry-input.search {
    flex: 1 1 360px;
    min-width: 260px;
  }

  .filters-bar henry-select {
    flex: 0 0 160px;
    min-width: 140px;
  }

  .filters-actions {
    display: flex;
    align-items: end;
    gap: var(--space-2);
    flex: 0 0 auto;
    padding-bottom: 2px;
  }

  .filters-advanced {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-3) var(--space-4);
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-light);
    align-items: end;
  }

  .filters henry-select,
  .filters henry-input {
    margin-bottom: 0;
  }

  henry-table {
    margin-top: var(--space-2);
  }
`;
