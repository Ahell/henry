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

    .computed-end {
      padding: var(--space-1) var(--space-2);
      background: var(--color-gray-50);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }
  `;

  static properties = {
    slots: { type: Array },
    message: { type: String },
    messageType: { type: String },
  };

  constructor() {
    super();
    initializeEditState(this, "editingSlotId");
    this.slots = store.getSlots() || [];
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
            <henry-input id="slotStart" type="date" label="Startdatum" required></henry-input>
            <div>
              <label>Slutdatum (beräknat 28 dagar)</label>
              <div id="computedEnd" class="computed-end">-</div>
            </div>
          </div>

          <div class="form-row">
            <henry-select id="insertAfter" label="Infoga efter" .options=${this._getInsertOptions(sorted)}></henry-select>
            <henry-input id="location" label="Plats" placeholder="T.ex. FEI Campus"></henry-input>
          </div>

          <div class="form-actions">
            <henry-button type="submit" variant="primary">Lägg till Slot</henry-button>
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

  firstUpdated() {
    const startInput = this.shadowRoot.querySelector("#slotStart");
    if (startInput) {
      startInput.addEventListener("change", () => this._updateComputedEnd());
    }
    this._updateComputedEnd();
  }

  _getInsertOptions(sorted) {
    const opts = [];
    // User cannot insert before first slot; options are after slot 1..N and after last
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      opts.push({ value: String(s.slot_id), label: `Efter slot ${i + 1} — ${s.start_date}` });
    }
    opts.push({ value: "last", label: "Efter sista slot" });
    return opts;
  }

  _updateComputedEnd() {
    const root = this.shadowRoot;
    const startVal = getInputValue(root, "slotStart");
    const endEl = root.querySelector("#computedEnd");
    if (!startVal) {
      endEl.textContent = "-";
      return;
    }
    const endDate = store._defaultSlotEndDate(startVal);
    const endStr = store._normalizeDateOnly(endDate);
    endEl.textContent = endStr || "-";
  }

  _getTableColumns() {
    return [
      { key: "number", label: "#", width: "60px" },
      { key: "start_date", label: "Startdatum", width: "150px" },
      { key: "end_date", label: "Slutdatum", width: "150px" },
      { key: "location", label: "Plats", width: "200px" },
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

      case "end_date":
        return html`${slot.end_date}`;

      case "location":
        return html`${slot.location || "-"}`;

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
    const start = getInputValue(root, "slotStart");
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
      const location = getInputValue(root, "location");
      const newSlot = store.addSlot({ start_date: start, end_date: endStr, location });
      resetForm(root);
      this._updateComputedEnd();
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
