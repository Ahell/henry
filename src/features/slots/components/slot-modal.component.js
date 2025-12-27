/**
 * Slot Modal Component
 * Unified modal for adding and editing slots
 */
import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { SlotFormService } from "../services/slot-form.service.js";
import { SlotService } from "../services/slot.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";

export class SlotModal extends LitElement {
  static properties = {
    open: { type: Boolean },
    mode: { type: String }, // 'add' or 'edit'
    slotId: { type: Number },
    selectedInsertAfter: { type: String },
    startOptions: { type: Array },
    formValid: { type: Boolean },
  };

  constructor() {
    super();
    this.open = false;
    this.mode = "add";
    this.slotId = null;
    this.selectedInsertAfter = null;
    this.startOptions = [];
    this.formValid = false;
  }

  updated(changedProperties) {
    if (changedProperties.has("open") && this.open) {
      this._initializeForm();
    }
  }

  async _initializeForm() {
    await this.updateComplete;

    // Reset state
    const initialState =
      this.mode === "add"
        ? SlotFormService.getInitialStateForAdd()
        : SlotFormService.getInitialStateForEdit(this.slotId);

    this.selectedInsertAfter = initialState.selectedInsertAfter;
    this.startOptions = initialState.startOptions;
    this.formValid = initialState.formValid;

    // Get data if editing
    let slot = null;
    if (this.mode === "edit" && this.slotId) {
      slot = store.getSlot(this.slotId);
    }

    // Populate form
    SlotFormService.populateForm(this.renderRoot, slot, this.mode);

    this._updateFormValidity();
  }

  _onInsertAfterChange(e) {
    const insertVal = e.detail.value;
    this.selectedInsertAfter = insertVal;

    if (insertVal) {
      const dates = SlotService.getAvailableStartDates(insertVal);
      this.startOptions = dates.map((d) => ({ value: d, label: d }));
    } else {
      this.startOptions = [];
    }

    this._updateFormValidity();
  }

  _handleInputChange() {
    this._updateFormValidity();
  }

  _updateFormValidity() {
    this.formValid = SlotFormService.isFormValid(
      this.renderRoot,
      this.mode,
      this.slotId
    );
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (!SlotFormService.isFormValid(this.renderRoot, this.mode, this.slotId)) {
      return;
    }

    try {
      const formData = SlotFormService.extractFormData(
        this.renderRoot,
        this.mode
      );
      let result;

      if (this.mode === "add") {
        result = await SlotService.saveNewSlot(formData);
        showSuccessMessage(this, "Kursperiod tillagd!");
      } else {
        // Edit not yet fully supported by service, but structure is here
        // result = await SlotService.saveUpdatedSlot(this.slotId, formData);
        throw new Error("Edit mode not implemented yet");
      }

      this.dispatchEvent(new CustomEvent("slot-saved", { detail: result }));
      this._handleClose();
    } catch (err) {
      showErrorMessage(this, `Kunde inte spara kursperiod: ${err.message}`);
    }
  }

  _handleClose() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.open) return html``;

    const title =
      this.mode === "add" ? "Lägg till kursperiod" : "Redigera kursperiod";
    const submitLabel = this.mode === "add" ? "Spara" : "Spara ändringar";

    return html`
      <henry-modal open title="${title}" @close="${this._handleClose}">
        <form
          @submit="${this._handleSubmit}"
          @input="${this._handleInputChange}"
          @change="${this._handleInputChange}"
          @select-change="${this._handleInputChange}"
        >
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            ${this.mode === "add"
              ? html`
                  <henry-select
                    id="insertAfter"
                    label="Infoga efter kursperiod"
                    size="6"
                    placeholder=""
                    ?hidePlaceholder=${true}
                    .options=${SlotService.getInsertAfterOptions()}
                    @select-change="${this._onInsertAfterChange}"
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
                `
              : html`
                  <!-- Edit fields would go here -->
                  <p>Redigering av kursperioder är inte implementerat än.</p>
                `}
          </div>
        </form>

        <div slot="footer">
          <henry-button variant="secondary" @click="${this._handleClose}">
            Avbryt
          </henry-button>
          <henry-button
            variant="primary"
            ?disabled=${!this.formValid ||
            (this.mode === "add" &&
              this.selectedInsertAfter &&
              this.startOptions.length === 0)}
            @click="${() =>
              this.renderRoot.querySelector("form").requestSubmit()}"
          >
            ${submitLabel}
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("slot-modal", SlotModal);
