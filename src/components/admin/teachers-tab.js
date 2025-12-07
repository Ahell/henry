import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";

export class TeachersTab extends LitElement {
  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    .panel {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    h3 {
      margin-top: 0;
      margin-bottom: var(--space-6);
      color: var(--color-text-primary);
      font-size: var(--font-size-xl);
      padding-bottom: var(--space-3);
      border-bottom: 2px solid var(--color-border);
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: var(--space-4);
    }

    th,
    td {
      padding: var(--space-3);
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    th {
      background: var(--color-gray-50);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    tr:hover {
      background: var(--color-gray-50);
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

      <div class="panel">
        <h3>Lägg till Ny Lärare</h3>
        <form @submit="${this.handleAddTeacher}">
          <div class="form-row">
            <henry-input
              id="teacherName"
              label="Namn"
              placeholder="Förnamn Efternamn"
              required
            ></henry-input>
            <henry-select
              id="teacherDepartment"
              label="Avdelning"
              placeholder="Välj avdelning..."
              required
              .options=${departments.map((dept) => ({
                value: dept,
                label: dept,
              }))}
            ></henry-select>
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
      </div>

      <div class="panel">
        <h3>Befintliga Lärare</h3>
        <div style="margin-bottom: 1rem;">
          <henry-button
            variant="secondary"
            @click="${this.handleRandomizeCourses}"
          >
            🎲 Slumpa kurser till alla lärare
          </henry-button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Namn</th>
              <th>Avdelning</th>
              <th>Kompatibla kurser</th>
              <th style="width: 180px;">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            ${store
              .getTeachers()
              .map((teacher) => this.renderTeacherRow(teacher))}
          </tbody>
        </table>
      </div>
    `;
  }

  renderTeacherRow(teacher) {
    const isEditing = this.editingTeacherId === teacher.teacher_id;
    const departments = ["AIJ", "AIE", "AF"];
    const courses = store.getCourses();
    const compatibleCourses = teacher.compatible_courses || [];

    if (isEditing) {
      return html`
        <tr class="editing">
          <td>
            <input
              type="text"
              class="edit-input"
              id="edit-teacher-name-${teacher.teacher_id}"
              .value="${teacher.name}"
            />
          </td>
          <td>
            <henry-select
              id="edit-teacher-dept-${teacher.teacher_id}"
              .options=${departments.map((dept) => ({
                value: dept,
                label: dept,
                selected: teacher.home_department === dept,
              }))}
            ></henry-select>
          </td>
          <td>
            <henry-select
              id="edit-teacher-courses-${teacher.teacher_id}"
              multiple
              size="4"
              .options=${courses.map((course) => ({
                value: course.course_id.toString(),
                label: `${course.code} - ${course.name}`,
                selected: compatibleCourses.includes(course.course_id),
              }))}
            ></henry-select>
          </td>
          <td>
            <henry-button
              size="small"
              variant="success"
              @click="${() => this.handleSaveTeacher(teacher.teacher_id)}"
            >
              Spara
            </henry-button>
            <henry-button
              size="small"
              variant="secondary"
              @click="${() => this.handleCancelTeacherEdit()}"
            >
              Avbryt
            </henry-button>
          </td>
        </tr>
      `;
    }

    const courseNames = compatibleCourses
      .map((courseId) => {
        const course = store.getCourse(courseId);
        return course ? course.code : null;
      })
      .filter(Boolean)
      .join(", ");

    return html`
      <tr>
        <td>${teacher.name}</td>
        <td>${teacher.home_department}</td>
        <td>${courseNames || "-"}</td>
        <td>
          <henry-button
            size="small"
            variant="secondary"
            @click="${() => this.handleEditTeacher(teacher.teacher_id)}"
          >
            Redigera
          </henry-button>
          <henry-button
            size="small"
            variant="danger"
            @click="${() =>
              this.handleDeleteTeacher(teacher.teacher_id, teacher.name)}"
          >
            Ta bort
          </henry-button>
        </td>
      </tr>
    `;
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
        .getSelect().value,
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
      .getSelect().value;
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
