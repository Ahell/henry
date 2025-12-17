import { css } from "lit";

export const coursesTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .form-row.two-cols {
    grid-template-columns: 1fr 1fr;
  }

  henry-table {
    margin-top: var(--space-4);
  }

  .edit-input {
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-sm);
  }

  .no-prerequisites {
    color: var(--color-text-disabled);
  }

  .compatible-teachers {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
`;
