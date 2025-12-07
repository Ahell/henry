import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
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
    this.editingTeacherId = null;
    this.message = "";
    this.messageType = "";
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    const departments = ["AIJ", "AIE", "AF"];
    const courses = store.getCourses();

    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

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
        ></henry-table>
      </henry-panel>
    `;
  }

  _getTeacherTableColumns() {
    return [
      { key: 'name', label: 'Namn', width: '200px' },
      { key: 'department', label: 'Avdelning', width: '120px' },
      { key: 'compatible_courses', label: 'Kompatibla kurser', width: '300px' },
      { key: 'actions', label: 'Åtgärder', width: '180px' },
    ];
  }

  _renderTeacherTableCell(teacher, column) {
    const isEditing = this.editingTeacherId === teacher.teacher_id;
    const departments = ["AIJ", "AIE", "AF"];
    const courses = store.getCourses();
    const compatibleCourses = teacher.compatible_courses || [];

    switch (column.key) {
      case 'name':
        if (isEditing) {
          return html`
            <input
              type="text"
              class="edit-input"
              id="edit-teacher-name-${teacher.teacher_id}"
              .value="${teacher.name}"
            />
          `;
        }
        return html`${teacher.name}`;

      case 'department':
        if (isEditing) {
          return html`
            <henry-select
              id="edit-teacher-department-${teacher.teacher_id}"
              .options=${departments.map((dept) => ({
                value: dept,
                label: dept,
                selected: teacher.department === dept,
              }))}
            ></henry-select>
          `;
        }
        return html`${teacher.department}`;

      case 'compatible_courses':
        if (isEditing) {
          return html`
            <henry-select
              id="edit-teacher-courses-${teacher.teacher_id}"
              multiple
              size="5"
              .options=${courses.map((c) => ({
                value: c.course_id.toString(),
                label: c.code,
                selected: compatibleCourses.includes(c.course_id),
              }))}
            ></henry-select>
          `;
        }
        if (compatibleCourses.length === 0) {
          return html`<span style="color: var(--color-text-disabled);">-</span>`;
        }
        const courseNames = compatibleCourses
          .map((cid) => {
            const course = courses.find((c) => c.course_id === cid);
            return course ? course.code : null;
          })
          .filter(Boolean)
          .join(", ");
        return html`${courseNames}`;

      case 'actions':
        if (isEditing) {
          return html`
            <div style="display: flex; gap: var(--space-2);">
              <henry-button
                variant="success"
                size="small"
                @click="${() => this.handleSaveTeacher(teacher.teacher_id)}"
              >
                💾 Spara
              </henry-button>
              <henry-button
                variant="secondary"
                size="small"
                @click="${() => this.handleCancelEdit()}"
              >
                ❌ Avbryt
              </henry-button>
            </div>
          `;
        }
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
        return html`${teacher[column.key] ?? ''}`;
    }
  }

  handleAddTeacher(e) {
    e.preventDefault();
    const coursesSelect = this.shadowRoot
      .querySelector("#teacherCourses")
      .getSelect();
    const selectedCourses = Array.from(coursesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );
    const teacher = {
      name: this.shadowRoot.querySelector("#teacherName").getInput().value,
      home_department: this.shadowRoot
        .querySelector("#teacherDepartment")
        .getValue(),
      compatible_courses: selectedCourses,
    };
    store.addTeacher(teacher);
    this.message = "Lärare tillagd!";
    this.messageType = "success";
    this.shadowRoot.querySelector("form").reset();
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }

  handleEditTeacher(teacherId) {
    this.editingTeacherId = teacherId;
  }

  handleCancelTeacherEdit() {
    this.editingTeacherId = null;
  }

  handleSaveTeacher(teacherId) {
    const name = this.shadowRoot.querySelector(
      `#edit-teacher-name-${teacherId}`
    ).value;
    const home_department = this.shadowRoot
      .querySelector(`#edit-teacher-dept-${teacherId}`)
      .getValue();
    const coursesSelect = this.shadowRoot
      .querySelector(`#edit-teacher-courses-${teacherId}`)
      .getSelect();
    const compatible_courses = Array.from(coursesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );

    store.updateTeacher(teacherId, {
      name,
      home_department,
      compatible_courses,
    });

    this.editingTeacherId = null;
    this.message = "Lärare uppdaterad!";
    this.messageType = "success";
    setTimeout(() => {
      this.message = "";
    }, 3000);
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
      this.message = `Lärare "${teacherName}" borttagen!`;
      this.messageType = "success";
      setTimeout(() => {
        this.message = "";
      }, 3000);
    }
  }
}

customElements.define("teachers-tab", TeachersTab);
