import { css } from "lit";

export const slotsTabStyles = css`
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

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  henry-table {
    margin-top: var(--space-4);
  }
`;
