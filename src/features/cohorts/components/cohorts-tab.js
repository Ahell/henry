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
import "../../../components/ui/index.js";
import { cohortsTabStyles } from "../styles/cohorts-tab.styles.js";
import {
  createCohortFromForm,
  deleteCohortById,
  resetCohortForm,
  updateCohortFromForm,
} from "../services/cohort-tab.service.js";
import { FormService } from "../../../platform/services/form.service.js";
import "./cohort-modal.component.js";

export class CohortsTab extends LitElement {
  static styles = cohortsTabStyles;

  static properties = {
    editingCohortId: { type: Number },
    message: { type: String },
    messageType: { type: String },
    formValid: { type: Boolean },
  };

  constructor() {
    super();
    this.formValid = false;
    initializeEditState(this, "editingCohortId");
    subscribeToStore(this);
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    resetCohortForm(this.shadowRoot);
    this._updateFormValidity();
  }

  _handleInputChange() {
    this._updateFormValidity();
  }

  _updateFormValidity() {
    this.formValid = FormService.isFormValid(this.shadowRoot);
  }

  render() {
    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Lägg till Ny Kull</henry-text>
        </div>
        <form
          @submit="${this.handleAddCohort}"
          @input="${this._handleInputChange}"
          @change="${this._handleInputChange}"
          @input-change="${this._handleInputChange}"
          @select-change="${this._handleInputChange}"
          @radio-change="${this._handleInputChange}"
          @textarea-change="${this._handleInputChange}"
        >
          <div class="form-row">
            <henry-input
              id="cohortStartDate"
              type="date"
              label="Startdatum"
              required
            ></henry-input>
            <henry-input
              id="cohortSize"
              type="number"
              label="Planerat antal studenter"
              min="1"
              placeholder="30"
              required
            ></henry-input>
          </div>
          <henry-button
            type="submit"
            variant="primary"
            ?disabled="${!this.formValid}"
          >
            Lägg till Kull
          </henry-button>
        </form>
      </henry-panel>

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Befintliga Kullar</henry-text>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${this._getCohortTableColumns()}"
          .data="${store.getCohorts()
            .slice()
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))}"
          .renderCell="${(row, col) => this._renderCohortTableCell(row, col)}"
        ></henry-table>
      </henry-panel>

      <cohort-modal
        .cohortId="${this.editingCohortId}"
        .open="${!!this.editingCohortId}"
        @modal-close="${this.handleCancelEdit}"
        @modal-save="${this._handleModalSave}"
      ></cohort-modal>
    `;
  }

  _getCohortTableColumns() {
    return [
      { key: "name", label: "Namn", width: "200px" },
      { key: "start_date", label: "Startdatum", width: "150px" },
      { key: "planned_size", label: "Antal Studenter", width: "150px" },
      { key: "actions", label: "Åtgärder", width: "180px" },
    ];
  }

  _renderCohortTableCell(cohort, column) {
    switch (column.key) {
      case "name":
        return html`${cohort.name}`;

      case "start_date":
        return html`${cohort.start_date}`;

      case "planned_size":
        return html`${cohort.planned_size}`;

      case "actions":
        return html`
          <div style="display: flex; gap: var(--space-2);">
            <henry-button
              variant="secondary"
              size="small"
              @click="${() => this.handleEditCohort(cohort.cohort_id)}"
            >
              Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              @click="${() => this.handleDeleteCohort(cohort.cohort_id)}"
            >
              Ta bort
            </henry-button>
          </div>
        `;

      default:
        return html`${cohort[column.key] ?? ""}`;
    }
  }

  async handleAddCohort(e) {
    e.preventDefault();
    const root = this.shadowRoot;
    try {
      if (!FormService.isFormValid(root)) {
        FormService.reportFormValidity(root);
        return;
      }

      await createCohortFromForm(root);
      resetCohortForm(root);
      this._updateFormValidity();
      showSuccessMessage(this, "Kull tillagd!");
    } catch (error) {
      showErrorMessage(this, `Fel: ${error.message}`);
    }
  }

  handleEditCohort(cohortId) {
    this.editingCohortId = cohortId;
  }

  handleCancelEdit() {
    this.editingCohortId = null;
  }

  async _handleModalSave(e) {
    const { cohortId } = e.detail;
    try {
      await updateCohortFromForm(e.currentTarget, cohortId);
      this.editingCohortId = null;
      showSuccessMessage(this, "Kull uppdaterad!");
    } catch (error) {
      showErrorMessage(this, `Fel: ${error.message}`);
    }
  }

  async handleDeleteCohort(cohortId) {
    const cohort = store.getCohort(cohortId);
    if (!cohort) return;

    const cohortName = cohort.name;

    if (
      !confirm(
        `Är du säker på att du vill ta bort kullen "${cohortName}"?\n\nDetta kommer också ta bort alla schemalagda kurstillfällen för denna kull.`
      )
    ) {
      return;
    }

    try {
      const removed = await deleteCohortById(cohortId);
      if (removed) {
        showSuccessMessage(this, `Kull "${cohortName}" borttagen!`);
      }
    } catch (error) {
      showErrorMessage(this, `Fel: ${error.message}`);
    }
  }
}

customElements.define("cohorts-tab", CohortsTab);
