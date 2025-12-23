/**
 * Add Cohort Modal Component
 * Handles the add modal UI for cohorts
 */
import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import {
  createCohortFromForm,
  resetCohortForm,
} from "../services/cohort-tab.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";

export class AddCohortModal extends LitElement {
  static properties = {
    open: { type: Boolean },
    formValid: { type: Boolean },
  };

  constructor() {
    super();
    this.open = false;
    this.formValid = false;
  }

  updated(changedProperties) {
    if (changedProperties.has("open") && this.open) {
      this._resetForm();
    }
  }

  _resetForm() {
    resetCohortForm(this.renderRoot);
    this._updateFormValidity();
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
    try {
      const newCohort = await createCohortFromForm(this.renderRoot);
      this._resetForm();
      this.dispatchEvent(
        new CustomEvent("cohort-added", { detail: newCohort })
      );
      showSuccessMessage(this, "Kull tillagd!");
      this.open = false;
    } catch (err) {
      showErrorMessage(this, `Kunde inte lägga till kull: ${err.message}`);
    }
  }

  _handleClose() {
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.open) return html``;
    return html`
      <henry-modal
        open
        title="Lägg till Kull"
        @close="${this._handleClose}"
      >
        <form
          @submit="${this._handleSubmit}"
          @input="${this._updateFormValidity}"
          @change="${this._updateFormValidity}"
        >
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input
              id="cohortStartDate"
              label="Startdatum"
              type="date"
              required
            ></henry-input>
            <henry-input
              id="cohortSize"
              label="Planerat antal studenter"
              type="number"
              min="1"
              placeholder="30"
              required
            ></henry-input>
          </div>
        </form>
        <div slot="footer">
          <henry-button
            variant="secondary"
            @click="${this._handleClose}"
          >
            Avbryt
          </henry-button>
          <henry-button
            variant="primary"
            ?disabled="${!this.formValid}"
            @click="${() =>
              this.renderRoot.querySelector("form").requestSubmit()}"
          >
            Lägg till kull
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("add-cohort-modal", AddCohortModal);