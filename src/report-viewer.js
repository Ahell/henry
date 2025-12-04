import { LitElement, html, css } from 'lit';
import { store } from './store.js';

export class ReportViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
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

    .panel {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1.5rem;
    }

    h3 {
      margin-top: 0;
      color: #333;
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

    .gantt {
      display: flex;
      gap: 0.5rem;
      margin: 1rem 0;
      align-items: center;
    }

    .gantt-label {
      width: 200px;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .gantt-timeline {
      display: flex;
      gap: 2px;
      flex: 1;
    }

    .gantt-block {
      height: 30px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }

    .gantt-block:hover {
      opacity: 0.8;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .law-course {
      background: #6f42c1;
    }

    .normal-course {
      background: #007bff;
    }

    .two-block-course {
      background: #28a745;
    }

    .filters {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .filter-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: #555;
      font-size: 0.9rem;
    }

    select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .legend {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .legend-box {
      width: 24px;
      height: 24px;
      border-radius: 2px;
    }
  `;

  static properties = {
    activeTab: { type: String },
    filterYear: { type: String },
    filterTeacher: { type: String },
    filterCohort: { type: String }
  };

  constructor() {
    super();
    this.activeTab = 'department';
    this.filterYear = '';
    this.filterTeacher = '';
    this.filterCohort = '';
    
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      <div class="tabs">
        <button class="tab-button ${this.activeTab === 'department' ? 'active' : ''}" @click="${() => this.activeTab = 'department'}">Avdelningschef-vy</button>
        <button class="tab-button ${this.activeTab === 'teacher' ? 'active' : ''}" @click="${() => this.activeTab = 'teacher'}">Lärar-vy</button>
        <button class="tab-button ${this.activeTab === 'cohort' ? 'active' : ''}" @click="${() => this.activeTab = 'cohort'}">Kull-vy</button>
        <button class="tab-button ${this.activeTab === 'gantt' ? 'active' : ''}" @click="${() => this.activeTab = 'gantt'}">Gantt (Planeringsöversikt)</button>
      </div>

      ${this.activeTab === 'department' ? this.renderDepartmentView() : ''}
      ${this.activeTab === 'teacher' ? this.renderTeacherView() : ''}
      ${this.activeTab === 'cohort' ? this.renderCohortView() : ''}
      ${this.activeTab === 'gantt' ? this.renderGanttView() : ''}
    `;
  }

  renderDepartmentView() {
    const runs = store.getCourseRuns().sort((a, b) => {
      const slotA = store.getSlot(a.slot_id);
      const slotB = store.getSlot(b.slot_id);
      return new Date(slotA.start_date) - new Date(slotB.start_date);
    });

    return html`
      <div class="panel">
        <h3>Bemanning per År/Termin</h3>
        <div class="filters">
          <div class="filter-row">
            <div>
              <label>År</label>
              <select @change="${(e) => this.filterYear = e.target.value}">
                <option value="">Alla år</option>
                ${this.getYears().map(year => html`
                  <option value="${year}">${year}</option>
                `)}
              </select>
            </div>
            <div>
              <label>Avdelning</label>
              <select>
                <option value="">Alla avdelningar</option>
                ${this.getDepartments().map(dept => html`
                  <option value="${dept}">${dept}</option>
                `)}
              </select>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Kod</th>
              <th>Namn</th>
              <th>Examinator</th>
              <th>Kursansvarig</th>
              <th>Start</th>
              <th>Slut</th>
              <th>Termin</th>
              <th>År</th>
              <th>Kullar</th>
              <th>Studenter</th>
            </tr>
          </thead>
          <tbody>
            ${runs.map(run => this.renderDepartmentRow(run))}
          </tbody>
        </table>
      </div>
    `;
  }

  renderDepartmentRow(run) {
    const course = store.getCourse(run.course_id);
    const teacher = store.getTeacher(run.teacher_id);
    const slot = store.getSlot(run.slot_id);
    const cohortNames = run.cohorts
      .map(id => store.getCohort(id)?.name)
      .filter(Boolean)
      .join(', ');

    const startDate = new Date(slot.start_date);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    const term = month < 7 ? 'VT' : 'HT';

    if (this.filterYear && year.toString() !== this.filterYear) {
      return '';
    }

    return html`
      <tr>
        <td>${course?.code}</td>
        <td>${course?.name}</td>
        <td>${teacher?.name}</td>
        <td>${teacher?.name}</td>
        <td>${slot.start_date}</td>
        <td>${slot.end_date}</td>
        <td>${term} ${month}</td>
        <td>${year}</td>
        <td>${cohortNames}</td>
        <td>${run.planned_students}</td>
      </tr>
    `;
  }

  renderTeacherView() {
    return html`
      <div class="panel">
        <h3>Lärar-vy: FEI-kursomgångar</h3>
        <div class="filters">
          <div class="filter-row">
            <div>
              <label>Lärare</label>
              <select @change="${(e) => this.filterTeacher = e.target.value}">
                <option value="">Alla lärare</option>
                ${store.getTeachers().map(t => html`
                  <option value="${t.teacher_id}">${t.name}</option>
                `)}
              </select>
            </div>
          </div>
        </div>

        ${store.getTeachers().map(teacher => this.renderTeacherDetail(teacher))}
      </div>
    `;
  }

  renderTeacherDetail(teacher) {
    if (this.filterTeacher && teacher.teacher_id.toString() !== this.filterTeacher) {
      return '';
    }

    const runs = store.getCourseRuns()
      .filter(r => r.teacher_id === teacher.teacher_id)
      .sort((a, b) => {
        const slotA = store.getSlot(a.slot_id);
        const slotB = store.getSlot(b.slot_id);
        return new Date(slotA.start_date) - new Date(slotB.start_date);
      });

    if (runs.length === 0) {
      return '';
    }

    return html`
      <div style="margin-top: 1.5rem; padding: 1rem; background: #f9f9f9; border-radius: 4px;">
        <h4>${teacher.name} (${teacher.home_department})</h4>
        <table>
          <thead>
            <tr>
              <th>Kurs</th>
              <th>Startdatum</th>
              <th>Slutdatum</th>
              <th>Kullar</th>
              <th>Studenter</th>
            </tr>
          </thead>
          <tbody>
            ${runs.map(run => html`
              <tr>
                <td>${store.getCourse(run.course_id)?.code} - ${store.getCourse(run.course_id)?.name}</td>
                <td>${store.getSlot(run.slot_id).start_date}</td>
                <td>${store.getSlot(run.slot_id).end_date}</td>
                <td>${run.cohorts.map(id => store.getCohort(id)?.name).filter(Boolean).join(', ')}</td>
                <td>${run.planned_students}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

  renderCohortView() {
    return html`
      <div class="panel">
        <h3>Kull-vy: 14-kurser per kull</h3>
        <div class="filters">
          <div class="filter-row">
            <div>
              <label>Kull</label>
              <select @change="${(e) => this.filterCohort = e.target.value}">
                <option value="">Välj kull</option>
                ${store.getCohorts().map(c => html`
                  <option value="${c.cohort_id}">${c.name}</option>
                `)}
              </select>
            </div>
          </div>
        </div>

        ${this.filterCohort ? this.renderCohortDetail() : ''}
      </div>
    `;
  }

  renderCohortDetail() {
    const cohort = store.getCohort(parseInt(this.filterCohort));
    if (!cohort) return '';

    const runs = store.getCourseRuns()
      .filter(r => r.cohorts.includes(cohort.cohort_id))
      .sort((a, b) => {
        const slotA = store.getSlot(a.slot_id);
        const slotB = store.getSlot(b.slot_id);
        return new Date(slotA.start_date) - new Date(slotB.start_date);
      });

    return html`
      <div style="margin-top: 1rem;">
        <h4>${cohort.name} (${cohort.planned_size} studenter)</h4>
        <p>Kurssekvens (${runs.length} av 14 kurser planerade):</p>
        <table>
          <thead>
            <tr>
              <th>Ordning</th>
              <th>Kurs</th>
              <th>Startdatum</th>
              <th>Slutdatum</th>
              <th>Lärare</th>
              <th>Juridikkurs</th>
            </tr>
          </thead>
          <tbody>
            ${runs.map((run, index) => html`
              <tr>
                <td>${index + 1}</td>
                <td>${store.getCourse(run.course_id)?.code} - ${store.getCourse(run.course_id)?.name}</td>
                <td>${store.getSlot(run.slot_id).start_date}</td>
                <td>${store.getSlot(run.slot_id).end_date}</td>
                <td>${store.getTeacher(run.teacher_id)?.name}</td>
                <td>${store.getCourse(run.course_id)?.is_law_course ? '✓ ' + (store.getCourse(run.course_id)?.law_type || '') : '-'}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

  renderGanttView() {
    const cohorts = store.getCohorts();
    const minDate = new Date(Math.min(...store.getSlots().map(s => new Date(s.start_date))));
    const maxDate = new Date(Math.max(...store.getSlots().map(s => new Date(s.end_date))));
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

    return html`
      <div class="panel">
        <h3>Gantt-vy: Planeringsöversikt</h3>
        
        <div class="legend">
          <div class="legend-item">
            <div class="legend-box law-course"></div>
            <span>Juridikkurs</span>
          </div>
          <div class="legend-item">
            <div class="legend-box normal-course"></div>
            <span>Vanlig kurs (7.5 hp)</span>
          </div>
          <div class="legend-item">
            <div class="legend-box two-block-course"></div>
            <span>2-block kurs (15 hp)</span>
          </div>
        </div>

        ${cohorts.map(cohort => this.renderGanttRow(cohort, minDate, totalDays))}
      </div>
    `;
  }

  renderGanttRow(cohort, minDate, totalDays) {
    const runs = store.getCourseRuns()
      .filter(r => r.cohorts.includes(cohort.cohort_id))
      .sort((a, b) => {
        const slotA = store.getSlot(a.slot_id);
        const slotB = store.getSlot(b.slot_id);
        return new Date(slotA.start_date) - new Date(slotB.start_date);
      });

    return html`
      <div class="gantt">
        <div class="gantt-label">${cohort.name}</div>
        <div class="gantt-timeline">
          ${runs.map(run => this.renderGanttBlock(run, minDate, totalDays))}
        </div>
      </div>
    `;
  }

  renderGanttBlock(run, minDate, totalDays) {
    const course = store.getCourse(run.course_id);
    const slot = store.getSlot(run.slot_id);
    const startDate = new Date(slot.start_date);
    const endDate = new Date(slot.end_date);
    
    const offsetDays = Math.ceil((startDate - minDate) / (1000 * 60 * 60 * 24));
    const blockDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const widthPercent = (blockDays / totalDays) * 100;

    let blockClass = 'normal-course';
    if (course?.is_law_course) blockClass = 'law-course';
    if (course?.default_block_length === 2) blockClass = 'two-block-course';

    return html`
      <div class="gantt-block ${blockClass}" 
           style="width: ${widthPercent}%; margin-left: ${(offsetDays / totalDays) * 100}%;"
           title="${course?.code}: ${slot.start_date} - ${slot.end_date}">
        ${course?.code}
      </div>
    `;
  }

  getYears() {
    const years = new Set();
    store.getSlots().forEach(slot => {
      years.add(new Date(slot.start_date).getFullYear());
    });
    return Array.from(years).sort();
  }

  getDepartments() {
    const departments = new Set();
    store.getTeachers().forEach(t => {
      if (t.home_department) departments.add(t.home_department);
    });
    return Array.from(departments).sort();
  }
}

customElements.define('report-viewer', ReportViewer);
