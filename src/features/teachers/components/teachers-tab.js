import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { showErrorMessage } from "../../../utils/message-helpers.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
import { TeacherTableService } from "../services/teacher-table.service.js";
import { TeacherService } from "../services/teacher.service.js";
import "./teacher-modal.component.js";
import "./teacher-info-modal.component.js";
import { teachersTabStyles } from "../styles/teachers-tab.styles.js";

export class TeachersTab extends LitElement {
  static styles = teachersTabStyles;

  static properties = {
    editingTeacherId: { type: Number },
    modalOpen: { type: Boolean },
    modalMode: { type: String }, // 'add' or 'edit'
    infoTeacherId: { type: Number },
    infoModalOpen: { type: Boolean },
    message: { type: String },
    messageType: { type: String },
    isSaving: { type: Boolean },
  };

  constructor() {
    super();
    this.editingTeacherId = null;
    this.modalOpen = false;
    this.modalMode = "add";
    this.infoTeacherId = null;
    this.infoModalOpen = false;
    this.isSaving = false;
    initializeEditState(this, "editingTeacherId");
    subscribeToStore(this);
  }

  _openAddModal() {
    this.modalMode = "add";
    this.editingTeacherId = null;
    this.infoModalOpen = false;
    this.infoTeacherId = null;
    this.modalOpen = true;
  }

  handleEditTeacher(teacherId) {
    if (!store.editMode || this.isSaving) return;
    this.modalMode = "edit";
    this.editingTeacherId = teacherId;
    this.infoModalOpen = false;
    this.infoTeacherId = null;
    this.modalOpen = true;
  }

  _closeModal() {
    this.modalOpen = false;
    this.editingTeacherId = null;
  }

  _openInfoModal(teacherId) {
    this.modalOpen = false;
    this.editingTeacherId = null;
    this.infoTeacherId = teacherId;
    this.infoModalOpen = true;
  }

  _closeInfoModal() {
    this.infoModalOpen = false;
    this.infoTeacherId = null;
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
    const { action, teacherId, formData } = e.detail;
    const isUpdate = action === "update";

    this.modalOpen = false;
    if (isUpdate) {
      this.editingTeacherId = null;
    }

    try {
      await this._runSave(async () => {
        if (action === "add") {
          await TeacherService.saveNewTeacher(formData);
        } else if (action === "update") {
          await TeacherService.saveUpdatedTeacher(teacherId, formData);
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
          <henry-text variant="heading-3">Lärare</henry-text>
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
              Lägg till lärare
            </henry-button>
          </div>
        </div>
        <div class="tab-body">
          <div class="tab-scroll">
            <henry-table
              striped
              hoverable
              .columns="${TeacherTableService.getColumns()}"
              .data="${store.getTeachers()}"
              .renderCell="${(row, col) =>
                TeacherTableService.renderCell(
                  row,
                  col,
                  (teacherId) => this.handleEditTeacher(teacherId),
                  (teacherId) => this.handleDeleteTeacher(teacherId),
                  (teacherId) => this._openInfoModal(teacherId),
                  this.isSaving
                )}"
            ></henry-table>
          </div>
        </div>
      </henry-panel>

      <teacher-modal
        .open="${this.modalOpen}"
        .mode="${this.modalMode}"
        .teacherId="${this.editingTeacherId}"
        @modal-save="${this._handleModalSave}"
        @modal-close="${this._closeModal}"
      ></teacher-modal>
      <teacher-info-modal
        .open="${this.infoModalOpen}"
        .teacherId="${this.infoTeacherId}"
        @modal-close="${this._closeInfoModal}"
      ></teacher-info-modal>
    `;
  }

  async handleDeleteTeacher(teacherId) {
    if (!store.editMode || this.isSaving) return;
    const teacher = store.getTeacher(teacherId);
    if (!teacher) return;

    if (
      !confirm(
        `Är du säker på att du vill ta bort läraren "${teacher.name}"?`
      )
    ) {
      return;
    }

    try {
      await this._runSave(async () => {
        await TeacherService.deleteTeacherById(teacherId);
      });
    } catch (error) {
      showErrorMessage(this, `Fel: ${error.message}`);
    }
  }

  updated() {
    if (store.editMode) return;
    if (this.modalOpen) {
      this.modalOpen = false;
      this.editingTeacherId = null;
    }
  }
}

customElements.define("teachers-tab", TeachersTab);
