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
import { coursesTabStyles } from "../styles/courses-tab.styles.js";

export class CoursesTab extends LitElement {
  static styles = coursesTabStyles;
  static properties = {
    editingCourseId: { type: Number },
    modalOpen: { type: Boolean },
  };

  constructor() {
    super();
    this.editingCourseId = null;
    this.modalOpen = false;
    initializeEditState(this, "editingCourseId");
    subscribeToStore(this);
  }

  _openModal() {
    this.modalOpen = true;
  }

  _closeModal() {
    this.modalOpen = false;
    this.editingCourseId = null;
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
          .columns="${CourseTableService.getColumns()}"
          .data="${CourseService.getCourses()}"
          .renderCell="${(row, col) =>
            CourseTableService.renderCell(row, col, (courseId) => {
              this.editingCourseId = courseId;
              this.modalOpen = true;
            })}"
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
    `;
  }
}

customElements.define("courses-tab", CoursesTab);
