import { LitElement, html, css } from "lit";

/**
 * Henry Table Component
 * Standardized table styling with design tokens
 */
export class HenryTable extends LitElement {
  static properties = {
    striped: { type: Boolean },
    hoverable: { type: Boolean },
    bordered: { type: Boolean },
    compact: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }

    :host([compact]) table {
      font-size: var(--font-size-xs);
    }

    thead {
      background: var(--color-gray-100);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    th {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      border-bottom: 2px solid var(--color-border);
    }

    :host([compact]) th {
      padding: var(--space-2) var(--space-3);
    }

    td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border-light);
    }

    :host([compact]) td {
      padding: var(--space-2) var(--space-3);
    }

    :host([bordered]) th,
    :host([bordered]) td {
      border: 1px solid var(--color-border);
    }

    :host([striped]) tbody tr:nth-child(even) {
      background: var(--color-gray-50);
    }

    :host([hoverable]) tbody tr {
      transition: var(--transition-fast);
      cursor: pointer;
    }

    :host([hoverable]) tbody tr:hover {
      background: var(--color-info-light);
    }

    ::slotted([slot="actions"]) {
      display: flex;
      gap: var(--space-2);
      justify-content: flex-end;
    }
  `;

  constructor() {
    super();
    this.striped = false;
    this.hoverable = false;
    this.bordered = false;
    this.compact = false;
  }

  render() {
    return html`
      <table>
        <slot></slot>
      </table>
    `;
  }
}

customElements.define("henry-table", HenryTable);
