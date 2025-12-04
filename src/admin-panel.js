import { LitElement, html, css } from 'lit';
import { store } from './store.js';
import { validateLawPrerequisites, checkTeacherAvailability, calculatePlannedStudents, validateCapacity } from './businessRules.js';

export class AdminPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .panel {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    h3 {
      margin-top: 0;
      color: #333;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: #555;
    }

    input, select, textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
      box-sizing: border-box;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.2s;
    }

    button:hover {
      background: #0056b3;
    }

    button.secondary {
      background: #6c757d;
    }

    button.secondary:hover {
      background: #5a6268;
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

    th, td {
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
    messageType: { type: String }
  };

  constructor() {
    super();
    this.activeTab = 'courses';
    this.message = '';
    this.messageType = '';
    
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      <div class="tabs">
        <button class="tab-button ${this.activeTab === 'courses' ? 'active' : ''}" @click="${() => this.activeTab = 'courses'}">Kurser</button>
        <button class="tab-button ${this.activeTab === 'cohorts' ? 'active' : ''}" @click="${() => this.activeTab = 'cohorts'}">Kullar</button>
        <button class="tab-button ${this.activeTab === 'teachers' ? 'active' : ''}" @click="${() => this.activeTab = 'teachers'}">Lärare</button>
        <button class="tab-button ${this.activeTab === 'slots' ? 'active' : ''}" @click="${() => this.activeTab = 'slots'}">Tidsluckor</button>
        <button class="tab-button ${this.activeTab === 'availability' ? 'active' : ''}" @click="${() => this.activeTab = 'availability'}">Lärartillgänglighet</button>
      </div>

      ${this.message ? html`
        <div class="${this.messageType}">
          ${this.message}
        </div>
      ` : ''}

      ${this.activeTab === 'courses' ? this.renderCourses() : ''}
      ${this.activeTab === 'cohorts' ? this.renderCohorts() : ''}
      ${this.activeTab === 'teachers' ? this.renderTeachers() : ''}
      ${this.activeTab === 'slots' ? this.renderSlots() : ''}
      ${this.activeTab === 'availability' ? this.renderAvailability() : ''}
    `;
  }

  renderCourses() {
    return html`
      <div class="panel">
        <h3>Lägg till Ny Kurs</h3>
        <form @submit="${this.handleAddCourse}">
          <div class="grid">
            <div class="form-group">
              <label>Kurskod</label>
              <input type="text" id="courseCode" required>
            </div>
            <div class="form-group">
              <label>Kursnamn</label>
              <input type="text" id="courseName" required>
            </div>
            <div class="form-group">
              <label>HP</label>
              <input type="number" id="courseHp" step="0.5" value="7.5" required>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="isLawCourse">
                Juridikkurs
              </label>
            </div>
            <div class="form-group">
              <label>Juridiktyp</label>
              <select id="lawType">
                <option value="">Ingen</option>
                <option value="overview">Översikt</option>
                <option value="general">Allmän</option>
                <option value="special">Speciell</option>
                <option value="bostadsratt">Bostadsrätt</option>
                <option value="beskattning">Beskattning</option>
                <option value="qualified">Kvalificerad</option>
              </select>
            </div>
            <div class="form-group">
              <label>Blockängd (antal 7.5hp-block)</label>
              <input type="number" id="blockLength" min="1" max="2" value="1" required>
            </div>
          </div>
          <button type="submit">Lägg till Kurs</button>
        </form>
      </div>

      <div class="panel">
        <h3>Befintliga Kurser</h3>
        <table>
          <thead>
            <tr>
              <th>Kod</th>
              <th>Namn</th>
              <th>HP</th>
              <th>Juridik</th>
              <th>Blockängd</th>
            </tr>
          </thead>
          <tbody>
            ${store.getCourses().map(course => html`
              <tr>
                <td>${course.code}</td>
                <td>${course.name}</td>
                <td>${course.hp}</td>
                <td>${course.is_law_course ? course.law_type || 'Ja' : 'Nej'}</td>
                <td>${course.default_block_length}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

  renderCohorts() {
    return html`
      <div class="panel">
        <h3>Lägg till Ny Kull</h3>
        <form @submit="${this.handleAddCohort}">
          <div class="grid">
            <div class="form-group">
              <label>Kullnamn</label>
              <input type="text" id="cohortName" required>
            </div>
            <div class="form-group">
              <label>Startdatum</label>
              <input type="date" id="cohortStartDate" required>
            </div>
            <div class="form-group">
              <label>Planerat antal studenter</label>
              <input type="number" id="cohortSize" min="1" required>
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
            </tr>
          </thead>
          <tbody>
            ${store.getCohorts().map(cohort => html`
              <tr>
                <td>${cohort.name}</td>
                <td>${cohort.start_date}</td>
                <td>${cohort.planned_size}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

  renderTeachers() {
    return html`
      <div class="panel">
        <h3>Lägg till Ny Lärare</h3>
        <form @submit="${this.handleAddTeacher}">
          <div class="grid">
            <div class="form-group">
              <label>Namn</label>
              <input type="text" id="teacherName" required>
            </div>
            <div class="form-group">
              <label>Hemavdelning</label>
              <input type="text" id="teacherDepartment" required>
            </div>
          </div>
          <button type="submit">Lägg till Lärare</button>
        </form>
      </div>

      <div class="panel">
        <h3>Befintliga Lärare</h3>
        <table>
          <thead>
            <tr>
              <th>Namn</th>
              <th>Hemavdelning</th>
            </tr>
          </thead>
          <tbody>
            ${store.getTeachers().map(teacher => html`
              <tr>
                <td>${teacher.name}</td>
                <td>${teacher.home_department}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
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
              <input type="date" id="slotStart" required>
            </div>
            <div class="form-group">
              <label>Slutdatum</label>
              <input type="date" id="slotEnd" required>
            </div>
            <div class="form-group">
              <label>Kvällsmönster (ex: tis/tor)</label>
              <input type="text" id="slotPattern">
            </div>
            <div class="form-group">
              <label>Plats</label>
              <input type="text" id="slotLocation">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="isPlaceholder">
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
            ${store.getSlots().map(slot => html`
              <tr>
                <td>${slot.start_date}</td>
                <td>${slot.end_date}</td>
                <td>${slot.evening_pattern}</td>
                <td>${slot.is_placeholder ? 'Platshållare' : 'Reserverad'}</td>
              </tr>
            `)}
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
                ${store.getTeachers().map(t => html`
                  <option value="${t.teacher_id}">${t.name}</option>
                `)}
              </select>
            </div>
            <div class="form-group">
              <label>Från datum</label>
              <input type="date" id="availabilityFrom" required>
            </div>
            <div class="form-group">
              <label>Till datum</label>
              <input type="date" id="availabilityTo" required>
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
    const course = {
      code: this.shadowRoot.querySelector('#courseCode').value,
      name: this.shadowRoot.querySelector('#courseName').value,
      hp: parseFloat(this.shadowRoot.querySelector('#courseHp').value),
      is_law_course: this.shadowRoot.querySelector('#isLawCourse').checked,
      law_type: this.shadowRoot.querySelector('#lawType').value || null,
      default_block_length: parseInt(this.shadowRoot.querySelector('#blockLength').value)
    };
    store.addCourse(course);
    this.message = 'Kurs tillagd!';
    this.messageType = 'success';
    this.shadowRoot.querySelector('form').reset();
    setTimeout(() => { this.message = ''; }, 3000);
  }

  handleAddCohort(e) {
    e.preventDefault();
    const cohort = {
      name: this.shadowRoot.querySelector('#cohortName').value,
      start_date: this.shadowRoot.querySelector('#cohortStartDate').value,
      planned_size: parseInt(this.shadowRoot.querySelector('#cohortSize').value)
    };
    store.addCohort(cohort);
    this.message = 'Kull tillagd!';
    this.messageType = 'success';
    this.shadowRoot.querySelector('form').reset();
    setTimeout(() => { this.message = ''; }, 3000);
  }

  handleAddTeacher(e) {
    e.preventDefault();
    const teacher = {
      name: this.shadowRoot.querySelector('#teacherName').value,
      home_department: this.shadowRoot.querySelector('#teacherDepartment').value
    };
    store.addTeacher(teacher);
    this.message = 'Lärare tillagd!';
    this.messageType = 'success';
    this.shadowRoot.querySelector('form').reset();
    setTimeout(() => { this.message = ''; }, 3000);
  }

  handleAddSlot(e) {
    e.preventDefault();
    const slot = {
      start_date: this.shadowRoot.querySelector('#slotStart').value,
      end_date: this.shadowRoot.querySelector('#slotEnd').value,
      evening_pattern: this.shadowRoot.querySelector('#slotPattern').value,
      location: this.shadowRoot.querySelector('#slotLocation').value,
      is_placeholder: this.shadowRoot.querySelector('#isPlaceholder').checked
    };
    store.addSlot(slot);
    this.message = 'Tidslucka tillagd!';
    this.messageType = 'success';
    this.shadowRoot.querySelector('form').reset();
    setTimeout(() => { this.message = ''; }, 3000);
  }

  handleAddAvailability(e) {
    e.preventDefault();
    const availability = {
      teacher_id: parseInt(this.shadowRoot.querySelector('#availabilityTeacher').value),
      from_date: this.shadowRoot.querySelector('#availabilityFrom').value,
      to_date: this.shadowRoot.querySelector('#availabilityTo').value,
      type: this.shadowRoot.querySelector('#availabilityType').value
    };
    store.addTeacherAvailability(availability);
    this.message = 'Tillgänglighet tillagd!';
    this.messageType = 'success';
    this.shadowRoot.querySelector('form').reset();
    setTimeout(() => { this.message = ''; }, 3000);
  }
}

customElements.define('admin-panel', AdminPanel);
