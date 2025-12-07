import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";

export class TeachersTab extends LitElement {
  static styles = css`
    @import url('/src/styles/tokens.css');

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

    .form-group {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--space-2);
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
    }

    label .hint {
      font-weight: var(--font-weight-normal);
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs);
    }

    input, select {
      width: 100%;
      padding: var(--input-padding-y) var(--input-padding-x);
      border: var(--input-border-width) solid var(--color-border);
      border-radius: var(--radius-base);
      font-size: var(--font-size-sm);
      transition: var(--transition-all);
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: var(--input-focus-ring);
    }

    button {
      background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 100%);
      color: white;
      border: none;
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-base);
      cursor: pointer;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      transition: var(--transition-all);
      box-shadow: var(--shadow-primary);
    }

    button:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-primary-hover);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: var(--space-4);
    }

    th, td {
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

    .btn-edit, .btn-delete, .btn-save, .btn-cancel {
      padding: var(--space-2) var(--space-3);
      margin-right: var(--space-2);
      font-size: var(--font-size-xs);
    }

    .btn-edit {
      background: var(--color-info);
    }

    .btn-delete {
      background: var(--color-danger);
    }

    .btn-save {
      background: var(--color-success);
    }

    .btn-cancel {
      background: var(--color-gray-500);
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
            <div class="form-group">
              <label>Namn</label>
              <input
                type="text"
                id="teacherName"
                placeholder="Förnamn Efternamn"
                required
              />
            </div>
            <div class="form-group">
              <label>Avdelning</label>
              <select id="teacherDepartment" required>
                <option value="">Välj avdelning...</option>
                ${departments.map(
                  (dept) => html`<option value="${dept}">${dept}</option>`
                )}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Kompatibla kurser <span class="hint">(Ctrl/Cmd+klick för flera)</span></label>
            <select id="teacherCourses" multiple size="6" style="height: auto;">
              ${courses.map(
                (course) => html`
                  <option value="${course.course_id}">
                    ${course.code} - ${course.name}
                  </option>
                `
              )}
            </select>
          </div>
          <button type="submit">Lägg till Lärare</button>
        </form>
      </div>

      <div class="panel">
        <h3>Befintliga Lärare</h3>
        <div style="margin-bottom: 1rem;">
          <button type="button" @click="${this.handleRandomizeCourses}">
            🎲 Slumpa kurser till alla lärare
          </button>
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
            ${store.getTeachers().map((teacher) => this.renderTeacherRow(teacher))}
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
            <select
              class="edit-input"
              id="edit-teacher-dept-${teacher.teacher_id}"
            >
              ${departments.map(
                (dept) => html`
                  <option
                    value="${dept}"
                    ?selected="${teacher.home_department === dept}"
                  >
                    ${dept}
                  </option>
                `
              )}
            </select>
          </td>
          <td>
            <select
              class="edit-input"
              id="edit-teacher-courses-${teacher.teacher_id}"
              multiple
              size="4"
              style="height: auto; min-width: 200px;"
            >
              ${courses.map(
                (course) => html`
                  <option
                    value="${course.course_id}"
                    ?selected="${compatibleCourses.includes(course.course_id)}"
                  >
                    ${course.code} - ${course.name}
                  </option>
                `
              )}
            </select>
          </td>
          <td>
            <button
              type="button"
              class="btn-save"
              @click="${() => this.handleSaveTeacher(teacher.teacher_id)}"
            >
              Spara
            </button>
            <button
              type="button"
              class="btn-cancel"
              @click="${() => this.handleCancelTeacherEdit()}"
            >
              Avbryt
            </button>
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
          <button
            type="button"
            class="btn-edit"
            @click="${() => this.handleEditTeacher(teacher.teacher_id)}"
          >
            Redigera
          </button>
          <button
            type="button"
            class="btn-delete"
            @click="${() =>
              this.handleDeleteTeacher(teacher.teacher_id, teacher.name)}"
          >
            Ta bort
          </button>
        </td>
      </tr>
    `;
  }

  handleAddTeacher(e) {
    e.preventDefault();
    const coursesSelect = this.shadowRoot.querySelector("#teacherCourses");
    const selectedCourses = Array.from(coursesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );
    const teacher = {
      name: this.shadowRoot.querySelector("#teacherName").value,
      home_department: this.shadowRoot.querySelector("#teacherDepartment").value,
      compatible_courses: selectedCourses,
    };
    store.addTeacher(teacher);
    this.message = "Lärare tillagd!";
    this.messageType = "success";
    this.shadowRoot.querySelector("form").reset();
    setTimeout(() => { this.message = ""; }, 3000);
  }

  handleEditTeacher(teacherId) {
    this.editingTeacherId = teacherId;
  }

  handleCancelTeacherEdit() {
    this.editingTeacherId = null;
  }

  handleSaveTeacher(teacherId) {
    const name = this.shadowRoot.querySelector(`#edit-teacher-name-${teacherId}`).value;
    const home_department = this.shadowRoot.querySelector(`#edit-teacher-dept-${teacherId}`).value;
    const coursesSelect = this.shadowRoot.querySelector(`#edit-teacher-courses-${teacherId}`);
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
    setTimeout(() => { this.message = ""; }, 3000);
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
      setTimeout(() => { this.message = ""; }, 3000);
    }
  }

  handleDeleteTeacher(teacherId, teacherName) {
    if (confirm(`Är du säker på att du vill ta bort läraren "${teacherName}"?`)) {
      store.deleteTeacher(teacherId);
      this.message = `Lärare "${teacherName}" borttagen!`;
      this.messageType = "success";
      setTimeout(() => { this.message = ""; }, 3000);
    }
  }
}

customElements.define("teachers-tab", TeachersTab);
