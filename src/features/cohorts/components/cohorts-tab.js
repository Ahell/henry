import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { showErrorMessage } from "../../../utils/message-helpers.js";
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
    message: { type: String },
    messageType: { type: String },
    isSaving: { type: Boolean },
  };

  constructor() {
    super();
    this.editingCohortId = null;
    this.modalOpen = false;
    this.modalMode = "add";
    this.infoCohortId = null;
    this.infoModalOpen = false;
    this.isSaving = false;
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
    if (!store.editMode || this.isSaving) return;
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
    const { action, cohortId, formData } = e.detail;
    const isUpdate = action === "update";

    this.modalOpen = false;
    if (isUpdate) {
      this.editingCohortId = null;
    }

    try {
      await this._runSave(async () => {
        if (action === "add") {
          await CohortService.saveNewCohort(formData);
        } else if (action === "update") {
          await CohortService.saveUpdatedCohort(cohortId, formData);
        }
      });
    } catch (error) {
      showErrorMessage(this, `Fel: ${error.message}`);
    }
  }

  render() {
    const canEdit = !!store.editMode;
    return html`
      ${this.message
        ? html`<div class="message ${this.messageType}">${this.message}</div>`
        : ""}
      <henry-panel full-height>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Kullar</henry-text>
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
              Lägg till kull
            </henry-button>
          </div>
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
                  (cohortId) => this._openInfoModal(cohortId),
                  this.isSaving
                )}"
            ></henry-table>
          </div>
        </div>
      </henry-panel>

      <cohort-modal
        .open="${this.modalOpen}"
        .mode="${this.modalMode}"
        .cohortId="${this.editingCohortId}"
        @modal-save="${this._handleModalSave}"
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
    if (!store.editMode || this.isSaving) return;
    const cohort = store.getCohort(cohortId);
    if (!cohort) return;

    if (
      !confirm(
        `Är du säker på att du vill ta bort kullen "${cohort.start_date}"?\n\nDetta kommer också ta bort alla schemalagda kurstillfällen för denna kull.`
      )
    ) {
      return;
    }

    try {
      await this._runSave(async () => {
        await CohortService.deleteCohortById(cohortId);
      });
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
