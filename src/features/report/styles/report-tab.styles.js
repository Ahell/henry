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
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-3);
    margin: var(--space-4) 0;
    align-items: end;
  }

  henry-table {
    margin-top: var(--space-2);
  }
`;

