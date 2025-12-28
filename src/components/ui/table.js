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
 * @property {Boolean} sortable - Enable header click sorting (opt-in)
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
    sortable: { type: Boolean },
    sortKey: { type: String },
    sortDir: { type: String },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
      min-width: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-family-base);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
    }

    :host([compact]) table {
      font-size: var(--font-size-xs);
    }

    thead {
      background: var(--color-gray-lighter);
    }

    th {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      background: var(--color-gray-lighter);
      position: sticky;
      top: 0;
      z-index: 2;
      border-bottom: 0;
      box-shadow: inset 0 -1px 0 var(--color-border);
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: var(--font-size-xs);
    }

    :host([compact]) th {
      padding: var(--space-2) var(--space-3);
    }

    th.sortable {
      cursor: pointer;
      user-select: none;
    }

    th.sortable:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: -2px;
    }

    .th-content {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .sort-indicator {
      font-size: 10px;
      line-height: 1;
      opacity: 0.65;
      margin-right: var(--henry-table-sort-indicator-gap, 0px);
    }

    td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    :host([compact]) td {
      padding: var(--space-2) var(--space-3);
    }

    :host([bordered]) th,
    :host([bordered]) td {
      border: 1px solid var(--color-border);
    }

    :host([bordered]) th {
      box-shadow: none;
    }

    :host([striped]) tbody tr:nth-child(even) {
      background: var(--color-broken-white);
    }

    :host([hoverable]) tbody tr {
      transition: var(--transition-fast);
      cursor: pointer;
    }

    :host([hoverable]) tbody tr:hover {
      background: var(--color-surface-hover);
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
    this.sortable = false;
    this.sortKey = "";
    this.sortDir = "asc";
    this._collator = new Intl.Collator("sv-SE", {
      numeric: true,
      sensitivity: "base",
    });
  }

  render() {
    if (!this.columns || this.columns.length === 0) {
      return html`<p>No columns defined</p>`;
    }

    const sortedRows = this._sortedRows();

    return html`
      <table>
        <thead>
          <tr>
            ${this.columns.map(
              (col) => {
                const isSortable = this._isColumnSortable(col);
                const isActive = Boolean(this.sortKey) && this.sortKey === col.key;
                const ariaSort = isActive
                  ? this.sortDir === "desc"
                    ? "descending"
                    : "ascending"
                  : "none";
                const indicator = isActive
                  ? this.sortDir === "desc"
                    ? "▼"
                    : "▲"
                  : "";
                return html`
                <th
                  class="text-${col.align || "left"} ${isSortable
                    ? "sortable"
                    : ""}"
                  style="${col.width ? `width: ${col.width};` : ""}"
                  aria-sort="${ariaSort}"
                  role="${isSortable ? "button" : "columnheader"}"
                  tabindex="${isSortable ? "0" : "-1"}"
                  @click=${isSortable ? () => this._handleHeaderClick(col) : null}
                  @keydown=${isSortable
                    ? (e) => this._handleHeaderKeydown(e, col)
                    : null}
                >
                  <span class="th-content">
                    <span>${col.label}</span>
                    ${indicator
                      ? html`<span class="sort-indicator">${indicator}</span>`
                      : null}
                  </span>
                </th>
              `;
              }
            )}
          </tr>
        </thead>
        <tbody>
          ${sortedRows && sortedRows.length > 0
            ? sortedRows.map((row) => this._renderRow(row))
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

  _isColumnSortable(col) {
    if (!this.sortable) return false;
    if (!col || !col.key) return false;
    return col.sortable !== false;
  }

  _handleHeaderKeydown(event, col) {
    const key = event?.key;
    if (key !== "Enter" && key !== " ") return;
    event.preventDefault();
    this._handleHeaderClick(col);
  }

  _handleHeaderClick(col) {
    if (!this._isColumnSortable(col)) return;
    if (this.sortKey === col.key) {
      this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
      return;
    }
    this.sortKey = col.key;
    this.sortDir = "asc";
  }

  _sortedRows() {
    if (!this.sortable || !this.sortKey) return this.data || [];
    const col = (this.columns || []).find((c) => c?.key === this.sortKey);
    if (!this._isColumnSortable(col)) return this.data || [];

    const rows = Array.isArray(this.data) ? this.data : [];
    const decorated = rows.map((row, index) => ({
      row,
      index,
      value: this._sortValue(row, col),
    }));

    const dir = this.sortDir === "desc" ? "desc" : "asc";
    decorated.sort((a, b) => {
      const cmp = this._compare(a.value, b.value, dir);
      return cmp !== 0 ? cmp : a.index - b.index;
    });
    return decorated.map((d) => d.row);
  }

  _sortValue(row, col) {
    if (typeof col?.sortValue === "function") return col.sortValue(row);
    return row?.[col?.key];
  }

  _toFiniteNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }

  _compare(a, b, dir) {
    const direction = dir === "desc" ? -1 : 1;
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    const numA = this._toFiniteNumber(a);
    const numB = this._toFiniteNumber(b);
    if (numA != null && numB != null) {
      if (numA === numB) return 0;
      return numA < numB ? -1 * direction : 1 * direction;
    }

    const strA = String(a);
    const strB = String(b);
    const res = this._collator.compare(strA, strB);
    return res * direction;
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
      content = row[column.key] ?? "";
    }

    return html` <td class="text-${column.align || "left"}">${content}</td> `;
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
