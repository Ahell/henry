import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import {
  getInputValue,
  resetForm,
  showSuccessMessage,
  showErrorMessage,
  initializeEditState,
  subscribeToStore,
} from "../../utils/admin-helpers.js";
import "../ui/index.js";

export class SlotsTab extends LitElement {
  static styles = css`
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

    henry-table {
      margin-top: var(--space-4);
    }

    /* end date is always 28 days - not editable or shown in admin tab */
  `;

  static properties = {
    slots: { type: Array },
    message: { type: String },
    messageType: { type: String },
    startOptions: { type: Array },
    allowFreeDate: { type: Boolean },
    selectedInsertAfter: { type: String },
  };

  constructor() {
    super();
    initializeEditState(this, "editingSlotId");
    this.slots = store.getSlots() || [];
    this.startOptions = [];
    this.allowFreeDate = false;
    subscribeToStore(this);
  }

  render() {
    const sorted = (this.slots || []).slice().sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    return html`
      ${this.message ? html`<div class="${this.messageType}">${this.message}</div>` : ""}

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Lägg till Ny Slot</henry-text>
        </div>

        <form @submit="${this.handleAddSlot}">
          <div class="form-row">
            <henry-select id="insertAfter" label="Infoga efter" .options=${this._getInsertOptions(sorted)} @select-change="${(e) => this._onInsertAfterChange(e)}" required></henry-select>
            <henry-select id="slotStart" label="Startdatum" required .options=${this.startOptions} .placeholder=${this.selectedInsertAfter && (this.startOptions || []).length === 0 ? "Inga tillgängliga startdatum för vald position." : "Välj..."}></henry-select>
          </div>

          <div class="form-actions">
            <henry-button
              type="submit"
              variant="primary"
              ?disabled=${!this.allowFreeDate && this.selectedInsertAfter && (this.startOptions || []).length === 0}
            >Lägg till Slot</henry-button>
          </div>
        </form>
      </henry-panel>

      <henry-panel>
        <div slot="header"><henry-text variant="heading-3">Befintliga Slots</henry-text></div>
        <henry-table
          striped
          hoverable
          .columns="${this._getTableColumns()}"
          .data="${sorted}"
          .renderCell="${(row, col) => this._renderTableCell(row, col)}"
        ></henry-table>
      </henry-panel>
    `;
  }

  // no lifecycle work needed: end date and location are fixed/hidden

  _getInsertOptions(sorted) {
    const opts = [];
    // User cannot insert before first slot; options are after slot 1..N and after last
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      opts.push({ value: String(s.slot_id), label: `Efter slot ${i + 1} — ${s.start_date}` });
    }
    return opts;
  }

  _onInsertAfterChange() {
    const root = this.shadowRoot;
    const insertAfterEl = root.querySelector("#insertAfter");
    const insertVal = insertAfterEl ? insertAfterEl.getSelect().value : null;
    this.selectedInsertAfter = insertVal;
    this._computeStartOptions(insertVal);
  }

  _formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  _computeStartOptions(insertVal) {
    const slots = (this.slots || []).slice().sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    if (!insertVal) {
      this.startOptions = [];
      this.allowFreeDate = false;
      this.requestUpdate();
      return;
    }

    const idx = slots.findIndex((s) => String(s.slot_id) === String(insertVal));
    if (idx === -1) {
      this.startOptions = [];
      this.requestUpdate();
      return;
    }

    // If the selected insert position is the last slot, show 90 possible start dates
    if (idx === slots.length - 1) {
      let min;
      if (slots.length === 0) {
        min = new Date();
      } else {
        const last = slots[slots.length - 1];
        const lastEnd = new Date(store._defaultSlotEndDate(last.start_date));
        min = new Date(lastEnd);
        min.setDate(min.getDate() + 1);
      }
      const opts = [];
      for (let k = 0; k < 90; k++) {
        const d = new Date(min);
        d.setDate(d.getDate() + k);
        const dateStr = this._formatDate(d);
        opts.push({ value: dateStr, label: dateStr });
      }
      this.startOptions = opts;
      this.requestUpdate();
      return;
    }

    // inserting after a specific slot - compute allowed start date range
    const prev = slots[idx];
    const next = slots[idx + 1];

    const min = new Date(store._defaultSlotEndDate(prev.start_date));
    min.setDate(min.getDate() + 1);

    let max;
    if (next) {
      // latest allowed start such that end (start +27) < next.start_date
      const nextStart = new Date(next.start_date);
      max = new Date(nextStart);
      max.setDate(max.getDate() - (28 - 1));
    } else {
      // shouldn't happen since insertVal !== last, but fallback
      max = new Date(min);
      max.setFullYear(max.getFullYear() + 2);
    }

    if (max < min) {
      this.startOptions = [];
      this.allowFreeDate = false;
      this.requestUpdate();
      return;
    }

    // build options for each day between min and max inclusive
    const opts = [];
    for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) {
      const dateStr = this._formatDate(new Date(d));
      opts.push({ value: dateStr, label: dateStr });
    }

    this.startOptions = opts;
    this.allowFreeDate = false;
    this.requestUpdate();
  }

  // end date is derived by the store and not shown here

  _getTableColumns() {
    return [
      { key: "number", label: "#", width: "60px" },
      { key: "start_date", label: "Startdatum", width: "150px" },
      { key: "actions", label: "Åtgärder", width: "180px" },
    ];
  }

  _renderTableCell(slot, column) {
    switch (column.key) {
      case "number":
        // derive numbering by start_date ordering
        const sorted = (this.slots || []).slice().sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        const idx = sorted.findIndex((s) => s.slot_id === slot.slot_id);
        return html`${idx + 1}`;

      case "start_date":
        return html`${slot.start_date}`;

      // end_date and location intentionally hidden from admin slot list

      case "actions":
        return html`
          <div style="display:flex;gap:var(--space-2);">
            <henry-button variant="danger" size="small" @click="${() => this.handleDeleteSlot(slot.slot_id)}">Ta bort</henry-button>
          </div>
        `;

      default:
        return html`${slot[column.key] || ""}`;
    }
  }

  handleAddSlot(e) {
    e.preventDefault();
    const root = this.shadowRoot;
    const sel = root.querySelector("#slotStart");
    const start = sel ? sel.getSelect().value : null;
    if (!start) {
      showErrorMessage(this, "Fyll i startdatum för slot.");
      return;
    }

    const endDate = store._defaultSlotEndDate(start);
    const endStr = store._normalizeDateOnly(endDate);

    // Basic validation: can't add before first slot
    const current = (store.getSlots() || []).slice().sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    if (current.length > 0) {
      const firstStart = current[0].start_date;
      if (new Date(start) < new Date(firstStart)) {
        showErrorMessage(this, "Slot får inte läggas före den första befintliga slotten.");
        return;
      }
    }

    // Check for overlap
    const overlapping = store._findOverlappingSlot(start, endStr);
    if (overlapping) {
      showErrorMessage(this, `Slot ${start}–${endStr} överlappar med befintlig slot ${overlapping.start_date}–${overlapping.end_date || store._normalizeDateOnly(store._defaultSlotEndDate(overlapping.start_date))}`);
      return;
    }

    try {
      const newSlot = store.addSlot({ start_date: start });
      resetForm(root);
      showSuccessMessage(this, "Slot tillagd!");
    } catch (err) {
      showErrorMessage(this, err.message || "Kunde inte lägga till slot.");
    }
  }

  handleDeleteSlot(slotId) {
    const runs = store.getCourseRunsBySlot(slotId);
    if (runs && runs.length > 0) {
      showErrorMessage(this, "Kan inte ta bort slot som har tilldelade kurskörningar.");
      return;
    }
    if (confirm("Är du säker på att du vill ta bort denna slot?")) {
      store.deleteSlot(slotId);
      showSuccessMessage(this, "Slot borttagen.");
    }
  }
}

customElements.define("slots-tab", SlotsTab);
