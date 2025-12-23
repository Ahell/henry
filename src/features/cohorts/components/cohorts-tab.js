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
import { CohortTableService } from "../services/cohort-table.service.js";
import {
  deleteCohortById,
  updateCohortFromForm,
} from "../services/cohort-tab.service.js";
import "./add-cohort-modal.component.js";
import "./edit-cohort-modal.component.js";
import { cohortsTabStyles } from "../styles/cohorts-tab.styles.js";

export class CohortsTab extends LitElement {
  static styles = cohortsTabStyles;

  static properties = {
    editingCohortId: { type: Number },
    addModalOpen: { type: Boolean },
  };

  constructor() {
    super();
    this.editingCohortId = null;
    this.addModalOpen = false;
    initializeEditState(this, "editingCohortId");
    subscribeToStore(this);
  }

  _openAddModal() {
    this.addModalOpen = true;
  }

  _closeAddModal() {
    this.addModalOpen = false;
  }

  render() {
    const canEdit = !!store.editMode;
    return html`
      <henry-panel>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Befintliga kullar</henry-text>
          <henry-button
            variant="primary"
            ?disabled=${!canEdit}
            @click="${this._openAddModal}"
          >
            Lägg till kull
          </henry-button>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${CohortTableService.getColumns()}"
          .data="${store
            .getCohorts()
            .slice()
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))}"
          .renderCell="${(row, col) =>
            CohortTableService.renderCell(
              row,
              col,
              (cohortId) => this.handleEditCohort(cohortId),
              (cohortId) => this.handleDeleteCohort(cohortId)
            )}"
        ></henry-table>
      </henry-panel>

      <add-cohort-modal
        .open="${this.addModalOpen}"
        @cohort-added="${this._closeAddModal}"
        @modal-close="${this._closeAddModal}"
      ></add-cohort-modal>

      <edit-cohort-modal
        .cohortId="${this.editingCohortId}"
        .open="${!!this.editingCohortId}"
        @modal-close="${this.handleCancelEdit}"
        @modal-save="${this._handleModalSave}"
      ></edit-cohort-modal>
    `;
  }

  handleEditCohort(cohortId) {
    if (!store.editMode) return;
    this.editingCohortId = cohortId;
  }

  handleCancelEdit() {
    this.editingCohortId = null;
  }

  async _handleModalSave(e) {
    if (!store.editMode) return;
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
    if (!store.editMode) return;
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

  updated() {
    if (store.editMode) return;
    if (this.addModalOpen) this.addModalOpen = false;
    if (this.editingCohortId != null) this.editingCohortId = null;
  }
}

customElements.define("cohorts-tab", CohortsTab);
