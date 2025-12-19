import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";

/**
 * Cohort Modal Component
 * Handles cohort creation and editing
 */
export class CohortModal extends LitElement {
  static properties = {
    cohortId: { type: Number },
    open: { type: Boolean },
  };

  constructor() {
    super();
    this.cohortId = null;
    this.open = false;
  }

  _handleCancel() {
    const form = this.shadowRoot.querySelector('form');

    // Check if form is valid before allowing close
    if (form && !form.checkValidity()) {
      // Trigger HTML5 validation messages to show which fields are invalid
      form.reportValidity();
      // Prevent close
      return;
    }

    // Safe to close - form is valid or doesn't exist
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSave() {
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
        <form @submit="${(e) => e.preventDefault()}">
          <div style="display: flex; flex-direction: column; gap: var(--space-4);">
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
          <henry-button variant="success" @click="${this._handleSave}">
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

customElements.define("cohort-modal", CohortModal);
