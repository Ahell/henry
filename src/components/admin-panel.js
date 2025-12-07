import { LitElement, html, css } from "lit";
import { store } from "../utils/store.js";
import "./report-viewer.js";
import "./ui/index.js";
import {
  validateLawPrerequisites,
  checkTeacherAvailability,
  calculatePlannedStudents,
  validateCapacity,
} from "../utils/businessRules.js";

export class AdminPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .panel {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: #333;
      font-size: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e9ecef;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-row.two-cols {
      grid-template-columns: 1fr 1fr;
    }

    .form-row.three-cols {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .form-group {
      margin-bottom: 0;
    }

    .form-group.checkbox-group {
      display: flex;
      align-items: center;
      padding-top: 1.75rem;
    }

    .form-group.checkbox-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;
      cursor: pointer;
    }

    .form-group.checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #495057;
      font-size: 0.9rem;
    }

    label .required {
      color: #dc3545;
      margin-left: 2px;
    }

    label .hint {
      font-weight: normal;
      color: #6c757d;
      font-size: 0.8rem;
    }

    input,
    select,
    textarea {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 0.95rem;
      font-family: inherit;
      box-sizing: border-box;
      background-color: #fff;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }

    input::placeholder {
      color: #adb5bd;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: #80bdff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
    }

    input[type="number"] {
      -moz-appearance: textfield;
    }

    select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 16px 12px;
      padding-right: 2.5rem;
    }

    .form-actions {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 0.75rem;
    }

    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    button:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }

    button:active {
      transform: translateY(0);
    }

    button.secondary {
      background: #6c757d;
    }

    button.secondary:hover {
      background: #5a6268;
    }

    button.btn-submit {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    button.btn-submit:hover {
      background: linear-gradient(135deg, #0056b3 0%, #004094 100%);
    }

    .prerequisites-select {
      min-height: 100px;
      padding: 0.5rem;
    }

    .prerequisites-select option {
      padding: 0.25rem 0.5rem;
    }

    .prerequisites-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }

    .prereq-tag {
      background: #e9ecef;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .prereq-tag.transitive {
      background: #f8f9fa;
      color: #6c757d;
      font-style: italic;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .error {
      color: #dc3545;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .success {
      color: #28a745;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    th,
    td {
      border: 1px solid #ddd;
      padding: 0.75rem;
      text-align: left;
    }

    th {
      background: #f5f5f5;
      font-weight: bold;
    }

    tr:hover {
      background: #f9f9f9;
    }

    tr.editing {
      background: #fff3cd;
    }

    .btn-edit {
      background: #28a745;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      margin-right: 0.25rem;
    }

    .btn-edit:hover {
      background: #218838;
    }

    .btn-cancel {
      background: #dc3545;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }

    .btn-cancel:hover {
      background: #c82333;
    }

    .btn-delete {
      background: #dc3545;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }

    .btn-delete:hover {
      background: #c82333;
    }

    .btn-save {
      background: #007bff;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      margin-right: 0.25rem;
    }

    .btn-save:hover {
      background: #0056b3;
    }

    .edit-input {
      width: 100%;
      padding: 0.3rem;
      font-size: 0.9rem;
      box-sizing: border-box;
    }

    .edit-checkbox {
      width: auto;
    }

    .tabs {
      display: flex;
      border-bottom: 2px solid #ddd;
      margin-bottom: 1.5rem;
    }

    .tab-button {
      background: none;
      border: none;
      padding: 1rem;
      cursor: pointer;
      color: #666;
      font-size: 1rem;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }

    .tab-button.active {
      color: #007bff;
      border-bottom-color: #007bff;
      background: #f9f9f9;
    }

    .tab-button:hover {
      color: #007bff;
    }
  `;

  static properties = {
    activeTab: { type: String },
    message: { type: String },
    messageType: { type: String },
    editingCourseId: { type: Number },
    editingCohortId: { type: Number },
    editingTeacherId: { type: Number },
  };

  constructor() {
    super();
    this.activeTab = "courses";
    this.message = "";
    this.messageType = "";
    this.editingCourseId = null;
    this.editingCohortId = null;
    this.editingTeacherId = null;

    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      <div class="tabs">
        <button
          class="tab-button ${this.activeTab === "courses" ? "active" : ""}"
          @click="${() => (this.activeTab = "courses")}"
        >
          📚 Kurser
        </button>
        <button
          class="tab-button ${this.activeTab === "cohorts" ? "active" : ""}"
          @click="${() => (this.activeTab = "cohorts")}"
        >
          👥 Kullar
        </button>
        <button
          class="tab-button ${this.activeTab === "teachers" ? "active" : ""}"
          @click="${() => (this.activeTab = "teachers")}"
        >
          👨‍🏫 Lärare
        </button>
        <button
          class="tab-button ${this.activeTab === "teacherView" ? "active" : ""}"
          @click="${() => (this.activeTab = "teacherView")}"
        >
          📅 Lärartillgänglighet
        </button>
        <button
          class="tab-button ${this.activeTab === "gantt" ? "active" : ""}"
          @click="${() => (this.activeTab = "gantt")}"
        >
          📊 Schemaläggning
        </button>
      </div>

      ${this.message
        ? html` <div class="${this.messageType}">${this.message}</div> `
        : ""}
      ${this.activeTab === "courses" ? this.renderCourses() : ""}
      ${this.activeTab === "cohorts" ? this.renderCohorts() : ""}
      ${this.activeTab === "teachers" ? this.renderTeachers() : ""}
      ${this.activeTab === "teacherView"
        ? html`<report-viewer
            .activeTab=${"teacher"}
            .hideTabs=${true}
          ></report-viewer>`
        : ""}
      ${this.activeTab === "gantt"
        ? html`<report-viewer
            .activeTab=${"gantt"}
            .hideTabs=${true}
          ></report-viewer>`
        : ""}
    `;
  }

  renderCourses() {
    return html`
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
            <button type="submit" class="btn-submit">➕ Lägg till kurs</button>
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
    // Find all teachers that have this course in their compatible_courses
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
              style="min-height: 60px;"
            >
              ${store
                .getCourses()
                .filter((c) => c.course_id !== course.course_id)
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
            <button
              type="button"
              class="btn-save"
              @click="${() => this.handleSaveCourse(course.course_id)}"
            >
              Spara
            </button>
            <button
              type="button"
              class="btn-cancel"
              @click="${() => this.handleCancelEdit()}"
            >
              Avbryt
            </button>
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
          <button
            type="button"
            class="btn-edit"
            @click="${() => this.handleEditCourse(course.course_id)}"
          >
            Redigera
          </button>
          <button
            type="button"
            class="btn-delete"
            @click="${() =>
              this.handleDeleteCourse(course.course_id, course.name)}"
          >
            Ta bort
          </button>
        </td>
      </tr>
    `;
  }

  renderCohorts() {
    return html`
      <div class="panel">
        <h3>Lägg till Ny Kull</h3>
        <form @submit="${this.handleAddCohort}">
          <div class="form-row">
            <div class="form-group">
              <label>Startdatum</label>
              <input type="date" id="cohortStartDate" required />
            </div>
            <div class="form-group">
              <label>Planerat antal studenter</label>
              <input
                type="number"
                id="cohortSize"
                min="1"
                placeholder="30"
                required
              />
            </div>
          </div>
          <button type="submit">Lägg till Kull</button>
        </form>
      </div>

      <div class="panel">
        <h3>Befintliga Kullar</h3>
        <table>
          <thead>
            <tr>
              <th>Namn</th>
              <th>Startdatum</th>
              <th>Antal Studenter</th>
              <th style="width: 180px;">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            ${store
              .getCohorts()
              .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
              .map((cohort) => this.renderCohortRow(cohort))}
          </tbody>
        </table>
      </div>
    `;
  }

  renderCohortRow(cohort) {
    const isEditing = this.editingCohortId === cohort.cohort_id;

    if (isEditing) {
      return html`
        <tr class="editing">
          <td>
            <input
              type="text"
              class="edit-input"
              id="edit-cohort-name-${cohort.cohort_id}"
              .value="${cohort.name}"
              readonly
              disabled
              style="background-color: #e9ecef; cursor: not-allowed;"
            />
          </td>
          <td>
            <input
              type="date"
              class="edit-input"
              id="edit-cohort-date-${cohort.cohort_id}"
              .value="${cohort.start_date}"
            />
          </td>
          <td>
            <input
              type="number"
              class="edit-input"
              id="edit-cohort-size-${cohort.cohort_id}"
              min="1"
              .value="${cohort.planned_size}"
            />
          </td>
          <td>
            <button
              type="button"
              class="btn-save"
              @click="${() => this.handleSaveCohort(cohort.cohort_id)}"
            >
              Spara
            </button>
            <button
              type="button"
              class="btn-cancel"
              @click="${() => this.handleCancelCohortEdit()}"
            >
              Avbryt
            </button>
          </td>
        </tr>
      `;
    }

    return html`
      <tr>
        <td>${cohort.name}</td>
        <td>${cohort.start_date}</td>
        <td>${cohort.planned_size}</td>
        <td>
          <button
            type="button"
            class="btn-edit"
            @click="${() => this.handleEditCohort(cohort.cohort_id)}"
          >
            Redigera
          </button>
          <button
            type="button"
            class="btn-delete"
            @click="${() =>
              this.handleDeleteCohort(cohort.cohort_id, cohort.name)}"
          >
            Ta bort
          </button>
        </td>
      </tr>
    `;
  }

  renderTeachers() {
    const departments = ["AIJ", "AIE", "AF"];
    const courses = store.getCourses();

    return html`
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
            <label
              >Kompatibla kurser
              <span class="hint">(Ctrl/Cmd+klick för flera)</span></label
            >
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

    // Get course names for display
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

  renderSlots() {
    return html`
      <div class="panel">
        <h3>Lägg till Ny Tidslucka</h3>
        <form @submit="${this.handleAddSlot}">
          <div class="grid">
            <div class="form-group">
              <label>Startdatum</label>
              <input type="date" id="slotStart" required />
            </div>
            <div class="form-group">
              <label>Slutdatum</label>
              <input type="date" id="slotEnd" required />
            </div>
            <div class="form-group">
              <label>Kvällsmönster (ex: tis/tor)</label>
              <input type="text" id="slotPattern" />
            </div>
            <div class="form-group">
              <label>Plats</label>
              <input type="text" id="slotLocation" />
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="isPlaceholder" />
                Är platshållare (tom slot)
              </label>
            </div>
          </div>
          <button type="submit">Lägg till Tidslucka</button>
        </form>
      </div>

      <div class="panel">
        <h3>Befintliga Tidsluckor</h3>
        <table>
          <thead>
            <tr>
              <th>Start</th>
              <th>Slut</th>
              <th>Mönster</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${store.getSlots().map(
              (slot) => html`
                <tr>
                  <td>${slot.start_date}</td>
                  <td>${slot.end_date}</td>
                  <td>${slot.evening_pattern}</td>
                  <td>
                    ${slot.is_placeholder ? "Platshållare" : "Reserverad"}
                  </td>
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  renderAvailability() {
    return html`
      <div class="panel">
        <h3>Lägg till Lärartillgänglighet</h3>
        <form @submit="${this.handleAddAvailability}">
          <div class="grid">
            <div class="form-group">
              <label>Lärare</label>
              <select id="availabilityTeacher" required>
                <option value="">Välj lärare</option>
                ${store
                  .getTeachers()
                  .map(
                    (t) => html`
                      <option value="${t.teacher_id}">${t.name}</option>
                    `
                  )}
              </select>
            </div>
            <div class="form-group">
              <label>Från datum</label>
              <input type="date" id="availabilityFrom" required />
            </div>
            <div class="form-group">
              <label>Till datum</label>
              <input type="date" id="availabilityTo" required />
            </div>
            <div class="form-group">
              <label>Typ</label>
              <select id="availabilityType" required>
                <option value="busy">Upptagenperiod (KTH)</option>
                <option value="free">Ledig</option>
              </select>
            </div>
          </div>
          <button type="submit">Lägg till Tillgänglighet</button>
        </form>
      </div>
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

    // Add this course to selected teachers' compatible_courses
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
    const prerequisitesSelect = this.shadowRoot.querySelector(
      `#edit-prerequisites-${courseId}`
    );
    const prerequisites = Array.from(prerequisitesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );
    const blockLength = parseInt(
      this.shadowRoot.querySelector(`#edit-blockLength-${courseId}`).value
    );

    store.updateCourse(courseId, {
      code,
      name,
      hp: blockLength * 7.5,
      default_block_length: blockLength,
      prerequisites: prerequisites,
    });

    this.editingCourseId = null;
    this.message = "Kurs uppdaterad!";
    this.messageType = "success";
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }

  handleDeleteCourse(courseId, courseName) {
    if (
      confirm(
        `Är du säker på att du vill ta bort kursen "${courseName}"?\n\nDetta kommer även ta bort alla kurstillfällen för denna kurs.`
      )
    ) {
      store.deleteCourse(courseId);
      this.message = "Kurs borttagen!";
      this.messageType = "success";
      setTimeout(() => {
        this.message = "";
      }, 3000);
    }
  }

  async handleAddCohort(e) {
    e.preventDefault();
    const cohort = {
      start_date: this.shadowRoot.querySelector("#cohortStartDate").value,
      planned_size: parseInt(
        this.shadowRoot.querySelector("#cohortSize").value
      ),
    };
    await store.addCohort(cohort);
    this.message = "Kull tillagd!";
    this.messageType = "success";
    this.shadowRoot.querySelector("form").reset();
    this.requestUpdate();
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }

  handleEditCohort(cohortId) {
    this.editingCohortId = cohortId;
  }

  handleCancelCohortEdit() {
    this.editingCohortId = null;
  }

  handleSaveCohort(cohortId) {
    const start_date = this.shadowRoot.querySelector(
      `#edit-cohort-date-${cohortId}`
    ).value;
    const planned_size = parseInt(
      this.shadowRoot.querySelector(`#edit-cohort-size-${cohortId}`).value
    );

    store.updateCohort(cohortId, {
      start_date,
      planned_size,
    });

    this.editingCohortId = null;
    this.message = "Kull uppdaterad!";
    this.messageType = "success";
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }

  async handleDeleteCohort(cohortId, cohortName) {
    if (
      confirm(
        `Är du säker på att du vill ta bort kullen "${cohortName}"?\n\nDetta kommer även ta bort kullen från alla kurstillfällen.`
      )
    ) {
      await store.deleteCohort(cohortId);
      this.message = "Kull borttagen!";
      this.messageType = "success";
      this.requestUpdate();
      setTimeout(() => {
        this.message = "";
      }, 3000);
    }
  }

  handleAddTeacher(e) {
    e.preventDefault();
    const coursesSelect = this.shadowRoot.querySelector("#teacherCourses");
    const selectedCourses = Array.from(coursesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );
    const teacher = {
      name: this.shadowRoot.querySelector("#teacherName").value,
      home_department:
        this.shadowRoot.querySelector("#teacherDepartment").value,
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
    const home_department = this.shadowRoot.querySelector(
      `#edit-teacher-dept-${teacherId}`
    ).value;
    const coursesSelect = this.shadowRoot.querySelector(
      `#edit-teacher-courses-${teacherId}`
    );
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
      confirm(
        `Är du säker på att du vill ta bort läraren "${teacherName}"?\n\nDetta kommer även ta bort läraren från alla kurstillfällen.`
      )
    ) {
      store.deleteTeacher(teacherId);
      this.message = "Lärare borttagen!";
      this.messageType = "success";
      setTimeout(() => {
        this.message = "";
      }, 3000);
    }
  }

  handleAddSlot(e) {
    e.preventDefault();
    const slot = {
      start_date: this.shadowRoot.querySelector("#slotStart").value,
      end_date: this.shadowRoot.querySelector("#slotEnd").value,
      evening_pattern: this.shadowRoot.querySelector("#slotPattern").value,
      location: this.shadowRoot.querySelector("#slotLocation").value,
      is_placeholder: this.shadowRoot.querySelector("#isPlaceholder").checked,
    };
    store.addSlot(slot);
    this.message = "Tidslucka tillagd!";
    this.messageType = "success";
    this.shadowRoot.querySelector("form").reset();
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }

  handleAddAvailability(e) {
    e.preventDefault();
    const availability = {
      teacher_id: parseInt(
        this.shadowRoot.querySelector("#availabilityTeacher").value
      ),
      from_date: this.shadowRoot.querySelector("#availabilityFrom").value,
      to_date: this.shadowRoot.querySelector("#availabilityTo").value,
      type: this.shadowRoot.querySelector("#availabilityType").value,
    };
    store.addTeacherAvailability(availability);
    this.message = "Tillgänglighet tillagd!";
    this.messageType = "success";
    this.shadowRoot.querySelector("form").reset();
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }
}

customElements.define("admin-panel", AdminPanel);
