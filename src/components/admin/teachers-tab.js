import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import {
  getInputValue,
  getSelectValues,
  getRadioValue,
  resetForm,
  showSuccessMessage,
  initializeEditState,
  subscribeToStore,
} from "../../utils/admin-helpers.js";
import "../ui/index.js";

export class TeachersTab extends LitElement {
  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    henry-table {
      margin-top: var(--space-4);
    }

    .edit-input {
      padding: var(--space-1) var(--space-2);
      font-size: var(--font-size-sm);
    }
  `;

  static properties = {
    editingTeacherId: { type: Number },
    message: { type: String },
    messageType: { type: String },
  };

  constructor() {
    super();
    initializeEditState(this, "editingTeacherId");
    subscribeToStore(this);
  }

  render() {
    const departments = ["AIJ", "AIE", "AF"];
    const courses = store.getCourses();

    return html`
      ${
        this.message
          ? html`<div class="${this.messageType}">${this.message}</div>`
          : ""
      }

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Lägg till Ny Lärare</henry-text>
        </div>
        <form @submit="${this.handleAddTeacher}">
          <div class="form-row">
            <henry-input
              id="teacherName"
              label="Namn"
              placeholder="Förnamn Efternamn"
              required
            ></henry-input>
            <henry-radio-group
              id="teacherDepartment"
              name="teacherDepartment"
              label="Avdelning"
              value="AIJ"
              required
              .options=${departments.map((dept) => ({
                value: dept,
                label: dept,
              }))}
            ></henry-radio-group>
          </div>
          <henry-select
            id="teacherCourses"
            label="Kompatibla kurser (Ctrl/Cmd+klick för flera)"
            multiple
            size="6"
            .options=${courses.map((course) => ({
              value: course.course_id.toString(),
              label: `${course.code} - ${course.name}`,
            }))}
          ></henry-select>
          <henry-button type="submit" variant="primary">
            Lägg till Lärare
          </henry-button>
        </form>
      </henry-panel>

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Befintliga Lärare</henry-text>
        </div>
        <div style="margin-bottom: 1rem;">
          <henry-button
            variant="secondary"
            @click="${this.handleRandomizeCourses}"
          >
            🎲 Slumpa kurser till alla lärare
          </henry-button>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${this._getTeacherTableColumns()}"
          .data="${store.getTeachers()}"
          .renderCell="${(row, col) => this._renderTeacherTableCell(row, col)}"
        </henry-table>
      </henry-panel>

      ${this._renderEditModal()}
    `;
  }

  _renderEditModal() {
    if (!this.editingTeacherId) return html``;

    const teacher = store.getTeacher(this.editingTeacherId);
    if (!teacher) return html``;

    const departments = ["AIJ", "AIE", "AF"];

    return html`
      <henry-modal
        open
        title="Redigera Lärare"
        @close="${this.handleCancelTeacherEdit}"
      >
        <form @submit="${(e) => this._handleSaveFromModal(e)}">
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input
              id="edit-name"
              label="Namn"
              .value="${teacher.name}"
              required
            ></henry-input>

            <henry-radio-group
              id="edit-department"
              label="Avdelning"
              name="edit-department"
              value="${teacher.home_department}"
              .options=${departments.map((dept) => ({
                value: dept,
                label: dept,
              }))}
            ></henry-radio-group>

            <henry-select
              id="edit-courses"
              label="Kompatibla kurser"
              multiple
              size="8"
              .options=${store.getCourses().map((c) => ({
                value: c.course_id.toString(),
                label: `${c.code} - ${c.name}`,
                selected: teacher.compatible_courses?.includes(c.course_id),
              }))}
            ></henry-select>
          </div>
        </form>

        <div slot="footer">
          <henry-button variant="secondary" @click="${this.handleCancelTeacherEdit}">
            Avbryt
          </henry-button>
          <henry-button
            variant="success"
            @click="${() => this.handleSaveTeacher(teacher.teacher_id)}"
          >
            💾 Spara
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  _handleSaveFromModal(e) {
    e.preventDefault();
    if (this.editingTeacherId) {
      this.handleSaveTeacher(this.editingTeacherId);
    }
  }

  _getTeacherTableColumns() {
    return [
      { key: "name", label: "Namn", width: "200px" },
      { key: "department", label: "Avdelning", width: "120px" },
      { key: "compatible_courses", label: "Kompatibla kurser", width: "300px" },
      { key: "actions", label: "Åtgärder", width: "180px" },
    ];
  }

  _renderTeacherTableCell(teacher, column) {
    const courses = store.getCourses();
    const compatibleCourses = teacher.compatible_courses || [];

    switch (column.key) {
      case "name":
        return html`${teacher.name}`;

      case "department":
        return html`${teacher.home_department}`;

      case "compatible_courses":
        if (compatibleCourses.length === 0) {
          return html`<span style="color: var(--color-text-disabled);"
            >-</span
          >`;
        }
        const courseNames = compatibleCourses
          .map((cid) => {
            const course = courses.find((c) => c.course_id === cid);
            return course ? course.code : null;
          })
          .filter(Boolean)
          .join(", ");
        return html`${courseNames}`;

      case "actions":
        return html`
          <div style="display: flex; gap: var(--space-2);">
            <henry-button
              variant="secondary"
              size="small"
              @click="${() => this.handleEditTeacher(teacher.teacher_id)}"
            >
              ✏️ Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              @click="${() => this.handleDeleteTeacher(teacher.teacher_id)}"
            >
              🗑️ Ta bort
            </henry-button>
          </div>
        `;

      default:
        return html`${teacher[column.key] ?? ""}`;
    }
  }

  handleAddTeacher(e) {
    e.preventDefault();
    const root = this.shadowRoot;
    const selectedCourses = getSelectValues(root, "teacherCourses");

    const teacher = {
      name: getInputValue(root, "teacherName"),
      home_department: getRadioValue(root, "teacherDepartment"),
      compatible_courses: selectedCourses,
    };
    store.addTeacher(teacher);
    resetForm(root);
    showSuccessMessage(this, "Lärare tillagd!");
  }

  handleEditTeacher(teacherId) {
    this.editingTeacherId = teacherId;
  }

  handleCancelTeacherEdit() {
    this.editingTeacherId = null;
  }

  handleSaveTeacher(teacherId) {
    const root = this.shadowRoot;
    const name = getInputValue(root, "edit-name");
    const home_department = getRadioValue(root, "edit-department");
    const compatible_courses = getSelectValues(root, "edit-courses");

    store.updateTeacher(teacherId, {
      name,
      home_department,
      compatible_courses,
    });

    this.editingTeacherId = null;
    showSuccessMessage(this, "Lärare uppdaterad!");
  }

  handleRandomizeCourses() {
    if (
      confirm(
        "Detta kommer att ersätta alla lärares nuvarande kurser med slumpade kurser. Fortsätta?"
      )
    ) {
      store.randomizeTeacherCourses(2, 5);
      this.message = "Kurser slumpade till alla lärare!";
      this.messageType = "success";
      setTimeout(() => {
        this.message = "";
      }, 3000);
    }
  }

  handleDeleteTeacher(teacherId, teacherName) {
    if (
      confirm(`Är du säker på att du vill ta bort läraren "${teacherName}"?`)
    ) {
      store.deleteTeacher(teacherId);
      showSuccessMessage(this, `Lärare "${teacherName}" borttagen!`);
    }
  }
}

customElements.define("teachers-tab", TeachersTab);
