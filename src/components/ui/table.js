import { LitElement, html, css } from "lit";

/**
 * Henry Table Component
 * Data-driven table with standardized styling
 * 
 * @property {Array} columns - Column definitions [{ key: 'name', label: 'Name', width: '200px', align: 'left' }]
 * @property {Array} data - Row data objects
 * @property {Function} renderCell - Optional custom cell renderer (row, column) => html
 * @property {Boolean} striped - Alternating row colors
 * @property {Boolean} hoverable - Hover effect on rows
 * @property {Boolean} bordered - Add borders to cells
 * @property {Boolean} compact - Smaller padding
 */
export class HenryTable extends LitElement {
  static properties = {
    columns: { type: Array },
    data: { type: Array },
    renderCell: { type: Function },
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

    .text-left {
      text-align: left;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }
  `;

  constructor() {
    super();
    this.columns = [];
    this.data = [];
    this.renderCell = null;
    this.striped = false;
    this.hoverable = false;
    this.bordered = false;
    this.compact = false;
  }

  render() {
    if (!this.columns || this.columns.length === 0) {
      return html`<p>No columns defined</p>`;
    }

    return html`
      <table>
        <thead>
          <tr>
            ${this.columns.map(
              (col) => html`
                <th
                  class="text-${col.align || 'left'}"
                  style="${col.width ? `width: ${col.width};` : ''}"
                >
                  ${col.label}
                </th>
              `
            )}
          </tr>
        </thead>
        <tbody>
          ${this.data && this.data.length > 0
            ? this.data.map((row) => this._renderRow(row))
            : html`
                <tr>
                  <td colspan="${this.columns.length}" class="text-center">
                    No data available
                  </td>
                </tr>
              `}
        </tbody>
      </table>
    `;
  }

  _renderRow(row) {
    return html`
      <tr @click="${() => this._handleRowClick(row)}">
        ${this.columns.map((col) => this._renderCell(row, col))}
      </tr>
    `;
  }

  _renderCell(row, column) {
    let content;

    if (this.renderCell) {
      content = this.renderCell(row, column);
    } else if (column.render) {
      content = column.render(row);
    } else {
      content = row[column.key] ?? '';
    }

    return html`
      <td class="text-${column.align || 'left'}">
        ${content}
      </td>
    `;
  }

  _handleRowClick(row) {
    if (this.hoverable) {
      this.dispatchEvent(
        new CustomEvent("row-click", {
          detail: { row },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
}

customElements.define("henry-table", HenryTable);
