import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { showErrorMessage } from "../../../utils/message-helpers.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
import { SlotService } from "../services/slot.service.js";
import "./slot-modal.component.js";
import "./slot-info-modal.component.js";
import "../../../components/ui/index.js";
import { slotsTabStyles } from "../styles/slots-tab.styles.js";

export class SlotsTab extends LitElement {
  static styles = slotsTabStyles;

  static properties = {
    addModalOpen: { type: Boolean },
    editModalOpen: { type: Boolean },
    editingSlotId: { type: Number },
    message: { type: String },
    messageType: { type: String },
    infoSlotId: { type: Number },
    infoModalOpen: { type: Boolean },
    isSaving: { type: Boolean },
  };

  constructor() {
    super();
    initializeEditState(this, "editingSlotId");
    this.addModalOpen = false;
    this.editModalOpen = false;
    this.editingSlotId = null;
    this.infoSlotId = null;
    this.infoModalOpen = false;
    this.isSaving = false;
    subscribeToStore(this);
  }

  _openAddModal() {
    if (this.isSaving) return;
    this.infoModalOpen = false;
    this.infoSlotId = null;
    this.editModalOpen = false;
    this.editingSlotId = null;
    this.addModalOpen = true;
  }

  _closeAddModal() {
    this.addModalOpen = false;
  }

  _openEditModal(slotId) {
    if (!store.editMode || this.isSaving) return;
    this.addModalOpen = false;
    this.infoModalOpen = false;
    this.infoSlotId = null;
    this.editingSlotId = slotId;
    this.editModalOpen = true;
  }

  _closeEditModal() {
    this.editModalOpen = false;
    this.editingSlotId = null;
  }

  _openInfoModal(slotId) {
    this.addModalOpen = false;
    this.editModalOpen = false;
    this.editingSlotId = null;
    this.infoSlotId = slotId;
    this.infoModalOpen = true;
  }

  _closeInfoModal() {
    this.infoModalOpen = false;
    this.infoSlotId = null;
  }

  async _runSave(task) {
    this.isSaving = true;
    store.beginAutoSaveSuspension();
    store.beginEditLock();

    try {
      return await task();
    } finally {
      store.endEditLock();
      store.endAutoSaveSuspension();
      this.isSaving = false;
    }
  }

  async _handleModalSave(e) {
    if (this.isSaving) return;
    const { action, slotId, formData } = e.detail;
    const isUpdate = action === "update";

    if (action === "add") {
      this.addModalOpen = false;
    }
    if (isUpdate) {
      this.editModalOpen = false;
      this.editingSlotId = null;
    }

    try {
      await this._runSave(async () => {
        if (action === "add") {
          await SlotService.saveNewSlot(formData);
        } else if (action === "update") {
          await SlotService.saveUpdatedSlot(slotId, formData);
        }
      });
    } catch (error) {
      showErrorMessage(this, `Fel: ${error.message}`);
    }
  }

  render() {
    const canEdit = !!store.editMode;
    // Always get fresh slots from store to avoid stale data
    const slots = SlotService.getSlots();
    const sorted = slots
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    return html`
      ${this.message
        ? html`<div class="message ${this.messageType}">${this.message}</div>`
        : ""}

      <henry-panel full-height>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Befintliga kursperioder</henry-text>
          <div class="header-actions">
            <span
              class="save-spinner"
              title="Sparar"
              ?hidden="${!this.isSaving}"
              aria-hidden="true"
            ></span>
            <henry-button
              variant="primary"
              ?disabled=${!canEdit || this.isSaving}
              @click="${this._openAddModal}"
            >
              Lägg till kursperiod
            </henry-button>
          </div>
        </div>
        <div class="tab-body">
          <div class="tab-scroll">
            <henry-table
              striped
              hoverable
              .columns="${this._getTableColumns()}"
              .data="${sorted}"
              .renderCell="${(row, col) => this._renderTableCell(row, col)}"
            ></henry-table>
          </div>
        </div>
      </henry-panel>

        <slot-modal
          .open="${this.addModalOpen}"
          mode="add"
          @modal-save="${this._handleModalSave}"
          @modal-close="${this._closeAddModal}"
        ></slot-modal>
        <slot-modal
          .open="${this.editModalOpen}"
          .slotId="${this.editingSlotId}"
          mode="edit"
          @modal-save="${this._handleModalSave}"
          @modal-close="${this._closeEditModal}"
        ></slot-modal>
        <slot-info-modal
          .open="${this.infoModalOpen}"
          .slotId="${this.infoSlotId}"
          @modal-close="${this._closeInfoModal}"
        ></slot-info-modal>
    `;
  }

  _getTableColumns() {
    // Delegate to service if we want to share columns, or keep here if view-specific
    // SlotTableService has slightly different columns (includes duration/actions), 
    // let's adapt to match previous view or use service fully.
    // The previous implementation had specific columns for this view.
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
        const slots = SlotService.getSlots();
        const sorted = slots
          .slice()
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        const idx = sorted.findIndex((s) => s.slot_id === slot.slot_id);
        return html`
          <button
            class="slot-period-button"
            type="button"
            @click="${() => this._openInfoModal(slot.slot_id)}"
          >
            ${idx + 1}
          </button>
        `;

      case "start_date":
        return html`${this._formatDateYYMMDD(slot.start_date)}`;

      case "actions":
        return html`
          <div style="display:flex;gap:var(--space-2);">
            <henry-button
              variant="secondary"
              size="small"
              ?disabled=${!store.editMode || this.isSaving}
              @click="${() => this._openEditModal(slot.slot_id)}"
              >Redigera</henry-button
            >
            <henry-button
              variant="danger"
              size="small"
              ?disabled=${!store.editMode || this.isSaving}
              @click="${() => this.handleDeleteSlot(slot.slot_id)}"
              >Ta bort</henry-button
            >
          </div>
        `;

      default:
        return html`${slot[column.key] || ""}`;
    }
  }

  async handleDeleteSlot(slotId) {
    if (!store.editMode || this.isSaving) return;
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
      await this._runSave(async () => {
        await SlotService.deleteSlotById(slotId);
      });
    } catch (err) {
      showErrorMessage(this, err.message || "Kunde inte ta bort slot.");
    }
  }

  updated() {
    if (store.editMode) return;
    if (this.addModalOpen) this.addModalOpen = false;
    if (this.editModalOpen) {
      this.editModalOpen = false;
      this.editingSlotId = null;
    }
    if (this.infoModalOpen) {
      this.infoModalOpen = false;
      this.infoSlotId = null;
    }
  }

  _formatDateYYMMDD(value) {
    if (!value) return "-";
    const [datePart] = String(value).split("T");
    const parts = datePart.split("-");
    if (parts.length !== 3) return datePart;
    const [yyyy, mm, dd] = parts;
    if (!yyyy || !mm || !dd) return datePart;
    return `${yyyy.slice(-2)}${mm}${dd}`;
  }
}

customElements.define("slots-tab", SlotsTab);
