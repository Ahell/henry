/**
 * Cohort Modal Component
 * Unified modal for adding and editing cohorts
 */
import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { CohortFormService } from "../services/cohort-form.service.js";
import { CohortService } from "../services/cohort.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";

export class CohortModal extends LitElement {
  static properties = {
    open: { type: Boolean },
    mode: { type: String }, // 'add' or 'edit'
    cohortId: { type: Number },
    formValid: { type: Boolean },
  };

  constructor() {
    super();
    this.open = false;
    this.mode = "add";
    this.cohortId = null;
    this.formValid = false;
  }

  updated(changedProperties) {
    if (changedProperties.has("open") && this.open) {
      this._initializeForm();
    }
  }

  async _initializeForm() {
    // Wait for render to ensure elements exist
    await this.updateComplete;

    // Reset validity state
    this.formValid = false;

    // Get initial data
    let cohort = null;
    if (this.mode === "edit" && this.cohortId) {
      cohort = store.getCohort(this.cohortId);
    }

    // Populate form
    CohortFormService.populateForm(this.renderRoot, cohort, this.mode);

    // Check initial validity
    this._updateFormValidity();
  }

  _updateFormValidity() {
    this.formValid = CohortFormService.isFormValid(
      this.renderRoot,
      this.mode,
      this.cohortId
    );
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (
      !CohortFormService.isFormValid(this.renderRoot, this.mode, this.cohortId)
    ) {
      // Force validation UI feedback if needed
      return;
    }

    try {
      const formData = CohortFormService.extractFormData(
        this.renderRoot,
        this.mode
      );
      let result;

      if (this.mode === "add") {
        result = await CohortService.saveNewCohort(formData);
        showSuccessMessage(this, "Kull tillagd!");
      } else {
        result = await CohortService.saveUpdatedCohort(this.cohortId, formData);
        showSuccessMessage(this, "Kull uppdaterad!");
      }

      this.dispatchEvent(new CustomEvent("cohort-saved", { detail: result }));
      this._handleClose();
    } catch (err) {
      showErrorMessage(this, `Kunde inte spara kull: ${err.message}`);
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

    const title = this.mode === "add" ? "Lägg till Kull" : "Redigera Kull";
    const submitLabel = this.mode === "add" ? "Spara" : "Spara ändringar";
    const prefix = this.mode === "edit" ? "editCohort" : "cohort";

    return html`
      <henry-modal open title="${title}" @close="${this._handleClose}">
        <form
          @submit="${this._handleSubmit}"
          @input="${this._updateFormValidity}"
          @change="${this._updateFormValidity}"
        >
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input
              id="${prefix}StartDate"
              label="Startdatum"
              type="date"
              required
            ></henry-input>
            <henry-input
              id="${prefix}Size"
              label="Planerat antal studenter"
              type="number"
              min="1"
              placeholder="30"
              required
            ></henry-input>
          </div>
        </form>
        <div slot="footer">
          <henry-button variant="secondary" @click="${this._handleClose}">
            Avbryt
          </henry-button>
          <henry-button
            variant="primary"
            ?disabled="${!this.formValid}"
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

customElements.define("cohort-modal", CohortModal);
