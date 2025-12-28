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
import { CohortService } from "../services/cohort.service.js";
import "./cohort-modal.component.js";
import "./cohort-info-modal.component.js";
import { cohortsTabStyles } from "../styles/cohorts-tab.styles.js";

export class CohortsTab extends LitElement {
  static styles = cohortsTabStyles;

  static properties = {
    editingCohortId: { type: Number },
    modalOpen: { type: Boolean },
    modalMode: { type: String }, // 'add' or 'edit'
    infoCohortId: { type: Number },
    infoModalOpen: { type: Boolean },
  };

  constructor() {
    super();
    this.editingCohortId = null;
    this.modalOpen = false;
    this.modalMode = "add";
    this.infoCohortId = null;
    this.infoModalOpen = false;
    initializeEditState(this, "editingCohortId");
    subscribeToStore(this);
  }

  _openAddModal() {
    this.modalMode = "add";
    this.editingCohortId = null;
    this.infoModalOpen = false;
    this.infoCohortId = null;
    this.modalOpen = true;
  }

  handleEditCohort(cohortId) {
    if (!store.editMode) return;
    this.modalMode = "edit";
    this.editingCohortId = cohortId;
    this.infoModalOpen = false;
    this.infoCohortId = null;
    this.modalOpen = true;
  }

  _closeModal() {
    this.modalOpen = false;
    this.editingCohortId = null;
  }

  _openInfoModal(cohortId) {
    this.modalOpen = false;
    this.editingCohortId = null;
    this.infoCohortId = cohortId;
    this.infoModalOpen = true;
  }

  _closeInfoModal() {
    this.infoModalOpen = false;
    this.infoCohortId = null;
  }

  render() {
    const canEdit = !!store.editMode;
    return html`
      <henry-panel full-height>
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
        <div class="tab-body">
          <div class="tab-scroll">
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
                  (cohortId) => this.handleDeleteCohort(cohortId),
                  (cohortId) => this._openInfoModal(cohortId)
                )}"
            ></henry-table>
          </div>
        </div>
      </henry-panel>

      <cohort-modal
        .open="${this.modalOpen}"
        .mode="${this.modalMode}"
        .cohortId="${this.editingCohortId}"
        @cohort-saved="${this._closeModal}"
        @modal-close="${this._closeModal}"
      ></cohort-modal>
      <cohort-info-modal
        .open="${this.infoModalOpen}"
        .cohortId="${this.infoCohortId}"
        @modal-close="${this._closeInfoModal}"
      ></cohort-info-modal>
    `;
  }

  async handleDeleteCohort(cohortId) {
    if (!store.editMode) return;
    const cohort = store.getCohort(cohortId);
    if (!cohort) return;

    const cohortName = cohort.name; // Note: Cohorts usually just have start_date, check if 'name' property exists or construct it

    if (
      !confirm(
        `Är du säker på att du vill ta bort kullen "${cohort.start_date}"?\n\nDetta kommer också ta bort alla schemalagda kurstillfällen för denna kull.`
      )
    ) {
      return;
    }

    try {
      const removed = await CohortService.deleteCohortById(cohortId);
      if (removed) {
        showSuccessMessage(this, `Kull borttagen!`);
      }
    } catch (error) {
      showErrorMessage(this, `Fel: ${error.message}`);
    }
  }

  updated() {
    if (store.editMode) return;
    // If edit mode is turned off externally, close modal if open
    if (this.modalOpen) {
        this.modalOpen = false;
        this.editingCohortId = null;
    }
  }
}

customElements.define("cohorts-tab", CohortsTab);
