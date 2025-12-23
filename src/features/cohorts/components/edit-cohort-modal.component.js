import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";

/**
 * Edit Cohort Modal Component
 * Handles the edit modal UI for cohorts
 */
export class EditCohortModal extends LitElement {
  static properties = {
    cohortId: { type: Number },
    open: { type: Boolean },
    formValid: { type: Boolean },
  };

  constructor() {
    super();
    this.cohortId = null;
    this.open = false;
    this.formValid = false;
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this._updateFormValidity();
  }

  updated(changedProperties) {
    if (changedProperties.has("open") || changedProperties.has("cohortId")) {
      if (this.open) {
        this._updateFormValidity();
      } else {
        this.formValid = false;
      }
    }
  }

  _handleInputChange() {
    this._updateFormValidity();
  }

  _updateFormValidity() {
    this.formValid = FormService.isFormValid(this.renderRoot);
  }

  _handleCancel() {
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSave() {
    if (!FormService.isFormValid(this.renderRoot)) {
      FormService.reportFormValidity(this.renderRoot);
      return;
    }

    const formData = FormService.extractFormData(this.renderRoot, {
      start_date: "edit-date",
      planned_size: {
        id: "edit-size",
        transform: (value) => Number(value),
      },
    });

    this.dispatchEvent(
      new CustomEvent("modal-save", {
        detail: { cohortId: this.cohortId, formData },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.open) return html``;

    const cohort = this.cohortId ? store.getCohort(this.cohortId) : null;

    return html`
      <henry-modal
        open
        title="${cohort ? "Redigera kohort" : "Ny kohort"}"
        @close="${this._handleCancel}"
      >
        <form
          @submit="${(e) => e.preventDefault()}"
          @input="${this._handleInputChange}"
          @change="${this._handleInputChange}"
          @input-change="${this._handleInputChange}"
          @select-change="${this._handleInputChange}"
          @radio-change="${this._handleInputChange}"
          @textarea-change="${this._handleInputChange}"
        >
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input
              id="edit-date"
              label="Startdatum"
              type="date"
              .value="${cohort?.start_date || ""}"
              required
            ></henry-input>

            <henry-input
              id="edit-size"
              label="Planerat antal studenter"
              type="number"
              .value="${cohort?.planned_size || 30}"
              required
              min="1"
            ></henry-input>
          </div>
        </form>

        <div slot="footer">
          <henry-button variant="secondary" @click="${this._handleCancel}">
            Avbryt
          </henry-button>
          <henry-button
            variant="success"
            @click="${this._handleSave}"
            ?disabled="${!this.formValid}"
          >
            Spara
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("edit-cohort-modal", EditCohortModal);
