import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
import {
  DEFAULT_SLOT_LENGTH_DAYS,
  defaultSlotEndDate,
} from "../../../utils/date-utils.js";
import { createSlot, deleteSlot } from "../services/slot-tab.service.js";
import { FormService } from "../../../platform/services/form.service.js";
import "../../../components/ui/index.js";
import { slotsTabStyles } from "../styles/slots-tab.styles.js";

export class SlotsTab extends LitElement {
  static styles = slotsTabStyles;

  static properties = {
    slots: { type: Array },
    addModalOpen: { type: Boolean },
    message: { type: String },
    messageType: { type: String },
    startOptions: { type: Array },
    allowFreeDate: { type: Boolean },
    selectedInsertAfter: { type: String },
    formValid: { type: Boolean },
  };

  constructor() {
    super();
    initializeEditState(this, "editingSlotId");
    this.slots = store.getSlots() || [];
    this.startOptions = [];
    this.allowFreeDate = false;
    this.addModalOpen = false;
    this.formValid = false;
    subscribeToStore(this);
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this._updateFormValidity();
  }

  _handleInputChange() {
    this._updateFormValidity();
  }

  async _openAddModal() {
    this.addModalOpen = true;
    await this.updateComplete;
    this.selectedInsertAfter = null;
    this.startOptions = [];
    this.allowFreeDate = false;
    FormService.clearCustomForm(this.shadowRoot, ["insertAfter", "slotStart"]);
    this._updateFormValidity();
  }

  _closeAddModal() {
    this.addModalOpen = false;
    this.formValid = false;
    this.selectedInsertAfter = null;
    this.startOptions = [];
    this.allowFreeDate = false;
  }

  _updateFormValidity() {
    this.formValid = FormService.isFormValid(this.shadowRoot);
  }

  render() {
    const sorted = (this.slots || [])
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

      <henry-panel>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Befintliga Slots</henry-text>
          <henry-button variant="primary" @click="${this._openAddModal}">
            Lägg till slot
          </henry-button>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${this._getTableColumns()}"
          .data="${sorted}"
          .renderCell="${(row, col) => this._renderTableCell(row, col)}"
        ></henry-table>
      </henry-panel>

      ${this.addModalOpen
        ? html`
            <henry-modal
              open
              title="Lägg till Slot"
              @close="${this._closeAddModal}"
            >
              <form
                id="add-slot-form"
                @submit="${this.handleAddSlot}"
                @input="${this._handleInputChange}"
                @change="${this._handleInputChange}"
                @input-change="${this._handleInputChange}"
                @select-change="${this._handleInputChange}"
                @radio-change="${this._handleInputChange}"
                @textarea-change="${this._handleInputChange}"
              >
                <henry-select
                  id="insertAfter"
                  label="Infoga efter"
                  .options=${this._getInsertOptions(sorted)}
                  @select-change="${(e) => this._onInsertAfterChange(e)}"
                  required
                ></henry-select>
                <henry-select
                  id="slotStart"
                  label="Startdatum"
                  required
                  .options=${this.startOptions}
                  .placeholder=${this.selectedInsertAfter &&
                  (this.startOptions || []).length === 0
                    ? "Inga tillgängliga startdatum för vald position."
                    : "Välj..."}
                ></henry-select>
              </form>

              <div slot="footer">
                <henry-button
                  variant="secondary"
                  @click="${this._closeAddModal}"
                >
                  Avbryt
                </henry-button>
                <henry-button
                  variant="primary"
                  ?disabled=${!this.formValid ||
                  (!this.allowFreeDate &&
                    this.selectedInsertAfter &&
                    (this.startOptions || []).length === 0)}
                  @click="${() => {
                    const form = this.renderRoot?.querySelector("#add-slot-form");
                    if (form?.requestSubmit) form.requestSubmit();
                    else
                      form?.dispatchEvent(
                        new Event("submit", { bubbles: true, cancelable: true })
                      );
                  }}"
                >
                  Lägg till slot
                </henry-button>
              </div>
            </henry-modal>
          `
        : ""}
    `;
  }

  // no lifecycle work needed: end date and location are fixed/hidden

  _getInsertOptions(sorted) {
    const opts = [];
    // User cannot insert before first slot; options are after slot 1..N and after last
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      opts.push({
        value: String(s.slot_id),
        label: `Efter slot ${i + 1} — ${s.start_date}`,
      });
    }
    return opts;
  }

  _onInsertAfterChange() {
    const root = this.shadowRoot;
    const insertAfterEl = root.querySelector("#insertAfter");
    const insertVal = insertAfterEl ? insertAfterEl.getSelect().value : null;
    this.selectedInsertAfter = insertVal;
    this._computeStartOptions(insertVal);
    this._updateFormValidity();
  }

  _formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  _computeStartOptions(insertVal) {
    const slots = (this.slots || [])
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    const idx = slots.findIndex((s) => String(s.slot_id) === String(insertVal));

    if (!insertVal || idx === -1) {
      // When nothing is selected, keep the UI empty/disabled
      this.startOptions = [];
      this.allowFreeDate = false;
      this.requestUpdate();
      return;
    }

    const prev = slots[idx];
    const next = slots[idx + 1] || null;

    // Allowed range: the day after prev ends through the latest day that keeps a 28-day slot before next starts
    const min = new Date(defaultSlotEndDate(prev.start_date));
    min.setDate(min.getDate() + 1);

    const max = next
      ? (() => {
          const nextStart = new Date(next.start_date);
          const latest = new Date(nextStart);
          latest.setDate(latest.getDate() - (DEFAULT_SLOT_LENGTH_DAYS - 1));
          return latest;
        })()
      : (() => {
          const latest = new Date(min);
          latest.setFullYear(latest.getFullYear() + 1);
          return latest;
        })();

    if (max < min) {
      this.startOptions = [];
      this.allowFreeDate = false;
      this.requestUpdate();
      return;
    }

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
        const sorted = (this.slots || [])
          .slice()
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        const idx = sorted.findIndex((s) => s.slot_id === slot.slot_id);
        return html`${idx + 1}`;

      case "start_date":
        return html`${slot.start_date}`;

      // end_date and location intentionally hidden from admin slot list

      case "actions":
        return html`
          <div style="display:flex;gap:var(--space-2);">
            <henry-button
              variant="danger"
              size="small"
              @click="${() => this.handleDeleteSlot(slot.slot_id)}"
              >Ta bort</henry-button
            >
          </div>
        `;

      default:
        return html`${slot[column.key] || ""}`;
    }
  }

  async handleAddSlot(e) {
    e.preventDefault();
    const root = this.shadowRoot;
    if (!FormService.isFormValid(root)) {
      FormService.reportFormValidity(root);
      return;
    }

    const sel = root.querySelector("#slotStart");
    const start = sel ? sel.getSelect().value : null;
    try {
      await createSlot({ start_date: start });
      FormService.clearCustomForm(root, ["insertAfter", "slotStart"]);
      this._updateFormValidity();
      this._closeAddModal();
      showSuccessMessage(this, "Slot tillagd!");
    } catch (err) {
      showErrorMessage(this, err.message || "Kunde inte lägga till slot.");
    }
  }

  async handleDeleteSlot(slotId) {
    const runs = store.getCourseRunsBySlot(slotId);
    if (runs && runs.length > 0) {
      showErrorMessage(
        this,
        "Kan inte ta bort slot som har tilldelade kurskörningar."
      );
      return;
    }
    if (!confirm("Är du säker på att du vill ta bort denna slot?")) {
      return;
    }

    try {
      const removed = await deleteSlot(slotId);
      if (removed) {
        showSuccessMessage(this, "Slot borttagen.");
      }
    } catch (err) {
      showErrorMessage(this, err.message || "Kunde inte ta bort slot.");
    }
  }
}

customElements.define("slots-tab", SlotsTab);
