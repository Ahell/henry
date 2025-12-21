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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-3) var(--space-4);
    margin: var(--space-4) 0 var(--space-3);
    align-items: end;
    padding: var(--space-4);
    background: var(--color-gray-50);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-xs);
  }

  .filters henry-select,
  .filters henry-input {
    margin-bottom: 0;
  }

  .filters henry-input.search {
    grid-column: 1 / -1;
  }

  henry-table {
    margin-top: var(--space-2);
  }
`;
