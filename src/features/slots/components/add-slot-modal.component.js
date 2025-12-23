/**
 * Add Slot Modal Component
 * Handles the add modal UI for slots
 */
import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { createSlot } from "../services/slot-tab.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";

export class AddSlotModal extends LitElement {
  static properties = {
    open: { type: Boolean },
    formValid: { type: Boolean },
    startOptions: { type: Array, attribute: false },
    allowFreeDate: { type: Boolean },
    selectedInsertAfter: { type: String, attribute: false },
  };

  constructor() {
    super();
    this.open = false;
    this.formValid = false;
    this.startOptions = [];
    this.allowFreeDate = false;
    this.selectedInsertAfter = null;
  }

  updated(changedProperties) {
    if (changedProperties.has("open") && this.open) {
      this._resetForm();
    }
  }

  _resetForm() {
    this.selectedInsertAfter = null;
    this.startOptions = [];
    this.allowFreeDate = false;
    FormService.clearCustomForm(this.renderRoot, ["insertAfter", "slotStart"]);
    this._updateFormValidity();
  }

  _getInsertOptions() {
    const sorted = (store.getSlots() || [])
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    const opts = [];
    // User cannot insert before first slot; options are after slot 1..N and after last
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      opts.push({
        value: String(s.slot_id),
        label: `Efter kursperiod ${i + 1} — ${s.start_date}`,
      });
    }
    return opts;
  }

  _onInsertAfterChange(e) {
    const insertVal = e?.detail?.value || null;
    this.selectedInsertAfter = insertVal;
    this._computeStartOptions(insertVal);
    this._updateFormValidity();
  }

  _computeStartOptions(insertAfterId) {
    // Logic for computing start options based on insertAfterId
    // This would need to be implemented based on the existing logic in slots-tab.js
    this.startOptions = []; // Placeholder - needs proper implementation
    this.allowFreeDate = false; // Placeholder - needs proper implementation
  }

  _updateFormValidity() {
    this.formValid = FormService.isFormValid(this.renderRoot);
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (!FormService.isFormValid(this.renderRoot)) {
      FormService.reportFormValidity(this.renderRoot);
      return;
    }

    const sel = this.renderRoot.querySelector("#slotStart");
    const start = sel ? sel.getSelect().value : null;

    try {
      await createSlot({ start_date: start });
      this._resetForm();
      this.dispatchEvent(new CustomEvent("slot-added", { detail: {} }));
      showSuccessMessage(this, "Kursperiod tillagd!");
      this.open = false;
    } catch (err) {
      showErrorMessage(
        this,
        `Kunde inte lägga till kursperiod: ${err.message}`
      );
    }
  }

  render() {
    if (!this.open) return html``;

    return html`
      <henry-modal
        open
        title="Lägg till kursperiod"
        @close="${() => (this.open = false)}"
      >
        <form
          @submit="${this._handleSubmit}"
          @select-change="${this._onInsertAfterChange}"
        >
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-select
              id="insertAfter"
              label="Infoga efter kursperiod"
              size="6"
              placeholder=""
              ?hidePlaceholder=${true}
              .options=${this._getInsertOptions()}
              required
            ></henry-select>

            <henry-select
              id="slotStart"
              label="Startdatum"
              size="6"
              required
              .options=${this.startOptions}
              placeholder=""
              ?hidePlaceholder=${true}
            ></henry-select>
          </div>
        </form>

        <div slot="footer">
          <henry-button
            variant="secondary"
            @click="${() => (this.open = false)}"
            >Avbryt</henry-button
          >
          <henry-button
            variant="primary"
            ?disabled="${!this.formValid ||
            (!this.allowFreeDate &&
              this.selectedInsertAfter &&
              (this.startOptions || []).length === 0)}"
            @click="${() =>
              this.renderRoot.querySelector("form").requestSubmit()}"
          >
            Lägg till kursperiod
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("add-slot-modal", AddSlotModal);
