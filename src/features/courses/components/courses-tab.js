import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
import { CourseTableService } from "../services/course-table.service.js";
import { CourseService } from "../services/course.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";
import "./course-modal.component.js";
import "./course-info-modal.component.js";
import { coursesTabStyles } from "../styles/courses-tab.styles.js";

export class CoursesTab extends LitElement {
  static styles = coursesTabStyles;
  static properties = {
    editingCourseId: { type: Number },
    modalOpen: { type: Boolean },
    infoCourseId: { type: Number },
    infoModalOpen: { type: Boolean },
  };

  constructor() {
    super();
    this.editingCourseId = null;
    this.modalOpen = false;
    this.infoCourseId = null;
    this.infoModalOpen = false;
    initializeEditState(this, "editingCourseId");
    subscribeToStore(this);
  }

  _openModal() {
    this.infoModalOpen = false;
    this.infoCourseId = null;
    this.modalOpen = true;
  }

  _closeModal() {
    this.modalOpen = false;
    this.editingCourseId = null;
  }

  _openInfoModal(courseId) {
    this.editingCourseId = null;
    this.modalOpen = false;
    this.infoCourseId = courseId;
    this.infoModalOpen = true;
  }

  _closeInfoModal() {
    this.infoModalOpen = false;
    this.infoCourseId = null;
  }

  async _handleModalSave(e) {
    const { action, courseId, formData } = e.detail;

    try {
      if (action === "add") {
        await CourseService.saveNewCourse(formData);
        this.modalOpen = false;
        showSuccessMessage(this, "Kurs tillagd!");
      } else if (action === "update") {
        await CourseService.saveUpdatedCourse(courseId, formData);
        this.modalOpen = false;
        this.editingCourseId = null;
        showSuccessMessage(this, "Kurs uppdaterad!");
      }
    } catch (err) {
      const actionText = action === "add" ? "lägga till" : "uppdatera";
      showErrorMessage(this, `Kunde inte ${actionText} kurs: ${err.message}`);
    }
  }

  async _handleDeleteCourse(courseId) {
    if (!store.editMode) return;
    const course = store.getCourse(courseId);
    if (!course) return;
    if (
      !confirm(
        `Är du säker på att du vill ta bort kursen "${course.code || course.name}"?`
      )
    ) {
      return;
    }
    try {
      const removed = await CourseService.deleteCourseById(courseId);
      if (removed) {
        showSuccessMessage(this, "Kurs borttagen.");
      }
    } catch (err) {
      showErrorMessage(this, err.message || "Kunde inte ta bort kurs.");
    }
  }

  render() {
    return html`
      <henry-panel>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Befintliga kurser</henry-text>
          <henry-button
            variant="primary"
            ?disabled="${!store.editMode}"
            @click="${this._openModal}"
            >Lägg till kurs</henry-button
          >
        </div>
        <henry-table
          striped
          hoverable
          .columns="${CourseTableService.getColumns()}"
          .data="${CourseService.getCourses()}"
          .renderCell="${(row, col) =>
            CourseTableService.renderCell(
              row,
              col,
              (courseId) => {
                this.infoModalOpen = false;
                this.infoCourseId = null;
                this.editingCourseId = courseId;
                this.modalOpen = true;
              },
              (courseId) => this._openInfoModal(courseId),
              (courseId) => this._handleDeleteCourse(courseId)
            )}"
        ></henry-table>
      </henry-panel>
      <course-modal
        mode="add"
        .open="${this.modalOpen}"
        @modal-save="${this._handleModalSave}"
        @modal-close="${this._closeModal}"
      ></course-modal>
      <course-modal
        mode="edit"
        .courseId="${this.editingCourseId}"
        .open="${this.modalOpen}"
        @modal-save="${this._handleModalSave}"
        @modal-close="${this._closeModal}"
      ></course-modal>
      <course-info-modal
        .courseId="${this.infoCourseId}"
        .open="${this.infoModalOpen}"
        @modal-close="${this._closeInfoModal}"
      ></course-info-modal>
    `;
  }
}

customElements.define("courses-tab", CoursesTab);
