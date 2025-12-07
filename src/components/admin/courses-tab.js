import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";

export class CoursesTab extends LitElement {
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

    .form-row.two-cols {
      grid-template-columns: 1fr 1fr;
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

    label .required {
      color: var(--color-danger);
      margin-left: 2px;
    }

    label .hint {
      font-weight: var(--font-weight-normal);
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs);
    }

    input,
    select,
    textarea {
      width: 100%;
      padding: var(--input-padding-y) var(--input-padding-x);
      border: var(--input-border-width) solid var(--color-border);
      border-radius: var(--radius-base);
      font-size: var(--font-size-sm);
      transition: var(--transition-all);
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: var(--input-focus-ring);
    }

    .prerequisites-select {
      min-height: 100px;
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

    .no-prerequisites {
      color: var(--color-text-disabled);
    }

    .compatible-teachers {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }
  `;

  static properties = {
    editingCourseId: { type: Number },
    message: { type: String },
    messageType: { type: String },
  };

  constructor() {
    super();
    this.editingCourseId = null;
    this.message = "";
    this.messageType = "";
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

      <div class="panel">
        <h3>➕ Lägg till Ny Kurs</h3>
        <form @submit="${this.handleAddCourse}">
          <div class="form-row two-cols">
            <div class="form-group">
              <label>Kurskod <span class="required">*</span></label>
              <input
                type="text"
                id="courseCode"
                placeholder="T.ex. AI180U"
                required
              />
            </div>
            <div class="form-group">
              <label>Kursnamn <span class="required">*</span></label>
              <input
                type="text"
                id="courseName"
                placeholder="T.ex. Juridisk översiktskurs"
                required
              />
            </div>
          </div>

          <div class="form-row two-cols">
            <div class="form-group">
              <label>Blocklängd</label>
              <select id="blockLength">
                <option value="1">1 block (7.5 hp)</option>
                <option value="2">2 block (15 hp)</option>
              </select>
            </div>
            <div class="form-group">
              <label
                >Spärrkurser
                <span class="hint">(kurser som måste läsas före)</span></label
              >
              <select id="prerequisites" class="prerequisites-select" multiple>
                ${store
                  .getCourses()
                  .map(
                    (c) => html`
                      <option value="${c.course_id}">
                        ${c.code} - ${c.name}
                      </option>
                    `
                  )}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label
              >Kompatibla lärare
              <span class="hint">(Ctrl/Cmd+klick för flera)</span></label
            >
            <select id="courseTeachers" multiple size="5" style="height: auto;">
              ${store
                .getTeachers()
                .map(
                  (teacher) => html`
                    <option value="${teacher.teacher_id}">
                      ${teacher.name}
                    </option>
                  `
                )}
            </select>
          </div>

          <div class="form-actions">
            <henry-button type="submit" variant="primary">
              ➕ Lägg till kurs
            </henry-button>
          </div>
        </form>
      </div>

      <div class="panel">
        <h3>📚 Befintliga Kurser</h3>
        <table>
          <thead>
            <tr>
              <th>Kod</th>
              <th>Namn</th>
              <th>Spärrkurser</th>
              <th>Kompatibla lärare</th>
              <th>Blocklängd</th>
              <th>Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            ${store.getCourses().map((course) => this.renderCourseRow(course))}
          </tbody>
        </table>
      </div>
    `;
  }

  renderPrerequisitesList(course) {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return html`<span class="no-prerequisites">-</span>`;
    }

    const courses = store.getCourses();
    const prereqNames = course.prerequisites
      .map((prereqId) => {
        const prereqCourse = courses.find((c) => c.course_id === prereqId);
        return prereqCourse ? prereqCourse.code : null;
      })
      .filter(Boolean);

    return html`<span class="prerequisites-list"
      >${prereqNames.join(", ")}</span
    >`;
  }

  renderCompatibleTeachersForCourse(course) {
    const compatibleTeachers = store
      .getTeachers()
      .filter((teacher) =>
        teacher.compatible_courses?.includes(course.course_id)
      );

    if (compatibleTeachers.length === 0) {
      return html`<span class="no-prerequisites">-</span>`;
    }

    const teacherNames = compatibleTeachers.map((t) => t.name).join(", ");
    return html`<span class="compatible-teachers">${teacherNames}</span>`;
  }

  renderCourseRow(course) {
    const isEditing = this.editingCourseId === course.course_id;

    if (isEditing) {
      return html`
        <tr class="editing">
          <td>
            <input
              type="text"
              class="edit-input"
              id="edit-code-${course.course_id}"
              .value="${course.code}"
            />
          </td>
          <td>
            <input
              type="text"
              class="edit-input"
              id="edit-name-${course.course_id}"
              .value="${course.name}"
            />
          </td>
          <td>
            <select
              class="edit-input prerequisites-select"
              id="edit-prerequisites-${course.course_id}"
              multiple
            >
              ${store
                .getCourses()
                .map(
                  (c) => html`
                    <option
                      value="${c.course_id}"
                      ?selected="${course.prerequisites?.includes(c.course_id)}"
                    >
                      ${c.code}
                    </option>
                  `
                )}
            </select>
          </td>
          <td>${this.renderCompatibleTeachersForCourse(course)}</td>
          <td>
            <select
              class="edit-input"
              id="edit-blockLength-${course.course_id}"
            >
              <option
                value="1"
                ?selected="${course.default_block_length === 1}"
              >
                1
              </option>
              <option
                value="2"
                ?selected="${course.default_block_length === 2}"
              >
                2
              </option>
            </select>
          </td>
          <td>
            <henry-button
              size="small"
              variant="success"
              @click="${() => this.handleSaveCourse(course.course_id)}"
            >
              Spara
            </henry-button>
            <henry-button
              size="small"
              variant="secondary"
              @click="${() => this.handleCancelEdit()}"
            >
              Avbryt
            </henry-button>
          </td>
        </tr>
      `;
    }

    return html`
      <tr>
        <td>${course.code}</td>
        <td>${course.name}</td>
        <td>${this.renderPrerequisitesList(course)}</td>
        <td>${this.renderCompatibleTeachersForCourse(course)}</td>
        <td>${course.default_block_length} block</td>
        <td>
          <henry-button
            size="small"
            variant="secondary"
            @click="${() => this.handleEditCourse(course.course_id)}"
          >
            Redigera
          </henry-button>
          <henry-button
            size="small"
            variant="danger"
            @click="${() =>
              this.handleDeleteCourse(course.course_id, course.name)}"
          >
            Ta bort
          </henry-button>
        </td>
      </tr>
    `;
  }

  handleAddCourse(e) {
    e.preventDefault();
    const blockLength = parseInt(
      this.shadowRoot.querySelector("#blockLength").value
    );
    const prerequisitesSelect = this.shadowRoot.querySelector("#prerequisites");
    const prerequisites = Array.from(prerequisitesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );
    const teachersSelect = this.shadowRoot.querySelector("#courseTeachers");
    const selectedTeacherIds = Array.from(teachersSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );

    const course = {
      code: this.shadowRoot.querySelector("#courseCode").value,
      name: this.shadowRoot.querySelector("#courseName").value,
      hp: blockLength * 7.5,
      default_block_length: blockLength,
      prerequisites: prerequisites,
    };
    const newCourse = store.addCourse(course);

    selectedTeacherIds.forEach((teacherId) => {
      const teacher = store.getTeacher(teacherId);
      if (teacher) {
        const compatibleCourses = teacher.compatible_courses || [];
        if (!compatibleCourses.includes(newCourse.course_id)) {
          store.updateTeacher(teacherId, {
            compatible_courses: [...compatibleCourses, newCourse.course_id],
          });
        }
      }
    });

    this.message = "Kurs tillagd!";
    this.messageType = "success";
    this.shadowRoot.querySelector("form").reset();
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }

  handleEditCourse(courseId) {
    this.editingCourseId = courseId;
  }

  handleCancelEdit() {
    this.editingCourseId = null;
  }

  handleSaveCourse(courseId) {
    const code = this.shadowRoot.querySelector(`#edit-code-${courseId}`).value;
    const name = this.shadowRoot.querySelector(`#edit-name-${courseId}`).value;
    const blockLength = parseInt(
      this.shadowRoot.querySelector(`#edit-blockLength-${courseId}`).value
    );
    const prerequisitesSelect = this.shadowRoot.querySelector(
      `#edit-prerequisites-${courseId}`
    );
    const prerequisites = Array.from(prerequisitesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );

    store.updateCourse(courseId, {
      code,
      name,
      hp: blockLength * 7.5,
      default_block_length: blockLength,
      prerequisites,
    });

    this.editingCourseId = null;
    this.message = "Kurs uppdaterad!";
    this.messageType = "success";
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }

  handleDeleteCourse(courseId, courseName) {
    if (confirm(`Är du säker på att du vill ta bort kursen "${courseName}"?`)) {
      store.deleteCourse(courseId);
      this.message = `Kurs "${courseName}" borttagen!`;
      this.messageType = "success";
      setTimeout(() => {
        this.message = "";
      }, 3000);
    }
  }
}

customElements.define("courses-tab", CoursesTab);
