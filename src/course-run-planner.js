import { LitElement, html, css } from 'lit';
import { store } from './store.js';

export class CourseRunPlanner extends LitElement {
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

    input, select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
      box-sizing: border-box;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    button {
      background: #28a745;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.2s;
    }

    button:hover {
      background: #218838;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .alert.error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .alert.success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .alert.warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
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

    .status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: bold;
    }

    .status.planned {
      background: #cfe2ff;
      color: #084298;
    }

    .status.preliminary {
      background: #fff3cd;
      color: #856404;
    }

    .status.confirmed {
      background: #d1e7dd;
      color: #0f5132;
    }

    .slot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .slot-card {
      border: 2px solid #ddd;
      border-radius: 4px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .slot-card:hover {
      border-color: #007bff;
      box-shadow: 0 0 8px rgba(0, 123, 255, 0.15);
      background: #f9f9f9;
    }

    .slot-card.placeholder {
      background: #f0f0f0;
      border-style: dashed;
    }

    .slot-date {
      font-weight: bold;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .slot-pattern {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .slot-content {
      font-size: 0.85rem;
      color: #999;
      font-style: italic;
    }
  `;

  static properties = {
    selectedSlot: { type: Object },
    selectedCourse: { type: String },
    selectedTeacher: { type: String },
    selectedCohorts: { type: Array },
    messages: { type: Array }
  };

  constructor() {
    super();
    this.selectedSlot = null;
    this.selectedCourse = '';
    this.selectedTeacher = '';
    this.selectedCohorts = [];
    this.messages = [];
    
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      <div class="panel">
        <h3>Skapa Ny Kursomgång</h3>
        
        ${this.messages.map(msg => html`
          <div class="alert ${msg.type}">
            ${msg.text}
          </div>
        `)}

        <h4>1. Välj Tidslucka</h4>
        <div class="slot-grid">
          ${store.getSlots().map(slot => html`
            <div class="slot-card ${slot.is_placeholder ? 'placeholder' : ''}" 
                 @click="${() => this.selectSlot(slot)}"
                 style="${this.selectedSlot?.slot_id === slot.slot_id ? 'border-color: #007bff; background: #e7f3ff;' : ''}">
              <div class="slot-date">${slot.start_date} → ${slot.end_date}</div>
              ${slot.evening_pattern ? html`<div class="slot-pattern">Mönster: ${slot.evening_pattern}</div>` : ''}
              ${this.getSlotContentInfo(slot)}
            </div>
          `)}
        </div>

        ${this.selectedSlot ? html`
          <h4 style="margin-top: 2rem;">2. Välj Kurs</h4>
          <div class="form-group">
            <select id="courseSelect" @change="${(e) => this.selectedCourse = e.target.value}">
              <option value="">Välj kurs...</option>
              ${store.getCourses().map(course => html`
                <option value="${course.course_id}">${course.code} - ${course.name}</option>
              `)}
            </select>
          </div>

          <h4>3. Välj Lärare</h4>
          <div class="form-group">
            <select id="teacherSelect" @change="${(e) => this.selectedTeacher = e.target.value}">
              <option value="">Välj lärare...</option>
              ${store.getTeachers().map(teacher => html`
                <option value="${teacher.teacher_id}">${teacher.name}</option>
              `)}
            </select>
          </div>

          <h4>4. Välj Kullar</h4>
          <div class="form-group">
            ${store.getCohorts().map(cohort => html`
              <label>
                <input type="checkbox" @change="${(e) => this.toggleCohort(cohort.cohort_id, e.target.checked)}">
                ${cohort.name} (${cohort.planned_size} studenter)
              </label>
            `)}
          </div>

          ${this.selectedCourse && this.selectedTeacher && this.selectedCohorts.length > 0 ? html`
            <button @click="${this.createCourseRun}">Skapa Kursomgång</button>
          ` : ''}
        ` : ''}
      </div>

      <div class="panel">
        <h3>Befintliga Kursomgångar</h3>
        <table>
          <thead>
            <tr>
              <th>Kurs</th>
              <th>Tidslucka</th>
              <th>Lärare</th>
              <th>Kullar</th>
              <th>Studenter</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${store.getCourseRuns().map(run => this.renderCourseRun(run))}
          </tbody>
        </table>
      </div>
    `;
  }

  renderCourseRun(run) {
    const course = store.getCourse(run.course_id);
    const slot = store.getSlot(run.slot_id);
    const teacher = store.getTeacher(run.teacher_id);
    const cohortNames = run.cohorts
      .map(id => store.getCohort(id)?.name)
      .filter(Boolean)
      .join(', ');

    return html`
      <tr>
        <td>${course?.code} ${course?.name}</td>
        <td>${slot?.start_date} - ${slot?.end_date}</td>
        <td>${teacher?.name}</td>
        <td>${cohortNames}</td>
        <td>${run.planned_students}</td>
        <td><span class="status ${run.status}">${run.status}</span></td>
      </tr>
    `;
  }

  selectSlot(slot) {
    this.selectedSlot = slot;
    this.selectedCourse = '';
    this.selectedTeacher = '';
    this.selectedCohorts = [];
  }

  toggleCohort(cohortId, checked) {
    if (checked) {
      this.selectedCohorts = [...this.selectedCohorts, cohortId];
    } else {
      this.selectedCohorts = this.selectedCohorts.filter(id => id !== cohortId);
    }
  }

  getSlotContentInfo(slot) {
    const runs = store.getCourseRunsBySlot(slot.slot_id);
    if (runs.length === 0) {
      return html`<div class="slot-content">Tom slot</div>`;
    }
    const course = store.getCourse(runs[0].course_id);
    return html`<div class="slot-content">${course?.code}</div>`;
  }

  createCourseRun() {
    const course = store.getCourse(parseInt(this.selectedCourse));
    const totalStudents = this.selectedCohorts.reduce((sum, cohortId) => {
      const cohort = store.getCohort(cohortId);
      return sum + (cohort?.planned_size || 0);
    }, 0);

    // Validera kapacitet
    if (totalStudents > 130) {
      this.addMessage('error', `För många studenter (${totalStudents} > 130)`);
      return;
    }
    if (totalStudents > 100) {
      this.addMessage('warning', `Varning: Många studenter (${totalStudents} > 100)`);
    }

    // Skapa kursomgång
    const run = {
      course_id: parseInt(this.selectedCourse),
      slot_id: this.selectedSlot.slot_id,
      teacher_id: parseInt(this.selectedTeacher),
      cohorts: this.selectedCohorts,
      planned_students: totalStudents
    };

    store.addCourseRun(run);
    this.addMessage('success', 'Kursomgång skapad!');
    this.selectedSlot = null;
    this.selectedCourse = '';
    this.selectedTeacher = '';
    this.selectedCohorts = [];
  }

  addMessage(type, text) {
    this.messages = [...this.messages, { type, text }];
    setTimeout(() => {
      this.messages = this.messages.filter(m => m.text !== text);
    }, 4000);
  }
}

customElements.define('course-run-planner', CourseRunPlanner);
