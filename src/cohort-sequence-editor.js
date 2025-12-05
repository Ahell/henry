import { LitElement, html, css } from "lit";
import { store } from "./store.js";

// Available course start dates from the specification
const AVAILABLE_DATES = [
  "2024-06-10",
  "2024-09-09",
  "2024-10-07",
  "2025-01-13",
  "2025-02-10",
  "2025-03-10",
  "2025-04-07",
  "2025-05-05",
  "2025-06-02",
  "2025-08-18",
  "2025-09-15",
  "2025-10-13",
  "2025-11-10",
  "2025-12-08",
  "2026-01-19",
  "2026-02-16",
  "2026-03-16",
  "2026-04-13",
  "2026-05-11",
  "2026-06-08",
  "2026-08-17",
  "2026-09-14",
  "2026-10-12",
  "2026-11-09",
  "2026-12-07",
  "2027-01-25",
  "2027-02-22",
  "2027-03-22",
  "2027-04-19",
  "2027-05-17",
  "2027-08-09",
  "2027-09-06",
  "2027-08-23",
  "2027-09-20",
  "2027-10-18",
  "2027-11-15",
];

export class CohortSequenceEditor extends LitElement {
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

    .cohort-selector {
      margin-bottom: 2rem;
    }

    .cohort-selector select {
      width: 100%;
      max-width: 400px;
      padding: 0.75rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .sequence-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .sequence-table th,
    .sequence-table td {
      border: 1px solid #ddd;
      padding: 0.75rem;
      text-align: left;
    }

    .sequence-table th {
      background: #f5f5f5;
      font-weight: bold;
    }

    .sequence-table tr:hover {
      background: #f9f9f9;
    }

    .sequence-table tr.law-course {
      background: #f3e5f5;
    }

    .sequence-table tr.law-course:hover {
      background: #e1bee7;
    }

    .sequence-table select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .sequence-table .order-input {
      width: 60px;
      padding: 0.5rem;
      text-align: center;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #0056b3;
    }

    .btn.save {
      background: #28a745;
    }

    .btn.save:hover {
      background: #218838;
    }

    .btn.delete {
      background: #dc3545;
    }

    .btn.delete:hover {
      background: #c82333;
    }

    .btn.add {
      margin-top: 1rem;
    }

    .message {
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .message.success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .message.error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .message.warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
    }

    .law-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background: #6f42c1;
      color: white;
      border-radius: 3px;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #666;
      font-style: italic;
    }

    .info-text {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
  `;

  static properties = {
    selectedCohortId: { type: Number },
    cohortSequence: { type: Array },
    message: { type: String },
    messageType: { type: String },
  };

  constructor() {
    super();
    this.selectedCohortId = null;
    this.cohortSequence = [];
    this.message = "";
    this.messageType = "";

    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      <div class="panel">
        <h3>Redigera Kurssekvens för Kull</h3>
        <p class="info-text">
          Välj en kull och redigera dess kurssekvens. Du kan ändra ordning,
          startdatum och vilka kurser som ingår. Startdatum måste väljas från de
          fördefinierade datumen.
        </p>

        ${this.message
          ? html`
              <div class="message ${this.messageType}">${this.message}</div>
            `
          : ""}

        <div class="cohort-selector">
          <label><strong>Välj Kull:</strong></label>
          <select @change="${this.onCohortChange}">
            <option value="">-- Välj en kull --</option>
            ${store
              .getCohorts()
              .map(
                (cohort) => html`
                  <option
                    value="${cohort.cohort_id}"
                    ?selected="${this.selectedCohortId === cohort.cohort_id}"
                  >
                    ${cohort.name} (Start: ${cohort.start_date},
                    ${cohort.planned_size} studenter)
                  </option>
                `
              )}
          </select>
        </div>

        ${this.selectedCohortId
          ? this.renderSequenceEditor()
          : this.renderEmptyState()}
      </div>
    `;
  }

  renderEmptyState() {
    return html`
      <div class="empty-state">
        <p>Välj en kull ovan för att redigera dess kurssekvens.</p>
      </div>
    `;
  }

  renderSequenceEditor() {
    const cohort = store.getCohort(this.selectedCohortId);
    if (!cohort) return "";

    // Get course runs for this cohort
    const cohortRuns = this.getCohortCourseRuns();

    return html`
      <h4>Kurssekvens för ${cohort.name}</h4>

      ${cohortRuns.length === 0
        ? html`
            <div class="empty-state">
              <p>Inga kurser har lagts till för denna kull ännu.</p>
            </div>
          `
        : html`
            <table class="sequence-table">
              <thead>
                <tr>
                  <th style="width: 60px">Ordning</th>
                  <th>Kurs</th>
                  <th style="width: 180px">Startdatum</th>
                  <th style="width: 150px">Lärare</th>
                  <th style="width: 120px">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                ${cohortRuns.map((run, index) =>
                  this.renderSequenceRow(run, index)
                )}
              </tbody>
            </table>
          `}

      <button class="btn add" @click="${this.addCourseToSequence}">
        + Lägg till kurs i sekvensen
      </button>
    `;
  }

  renderSequenceRow(run, index) {
    const course = store.getCourse(run.course_id);
    const slot = store.getSlot(run.slot_id);
    const teacher = store.getTeacher(run.teacher_id);
    const cohort = store.getCohort(this.selectedCohortId);
    const cohortStartDate = cohort?.start_date || "";

    // Filter dates to only show dates on or after the cohort's start date
    const availableDatesForCohort = AVAILABLE_DATES.filter(
      (date) => date >= cohortStartDate
    );

    // Get available courses with business logic applied
    const availableCourses = this.getAvailableCoursesForCohort(run.run_id);

    return html`
      <tr class="${course?.is_law_course ? "law-course" : ""}">
        <td>
          <input
            type="number"
            class="order-input"
            value="${index + 1}"
            min="1"
            @change="${(e) =>
              this.updateOrder(run.run_id, parseInt(e.target.value))}"
          />
        </td>
        <td>
          <select
            @change="${(e) =>
              this.updateCourse(run.run_id, parseInt(e.target.value))}"
          >
            ${availableCourses.map(
              (c) => html`
                <option
                  value="${c.course_id}"
                  ?selected="${c.course_id === run.course_id}"
                >
                  ${c.code} - ${c.name} (${c.hp} hp)${c.samlesning_info || ""}
                </option>
              `
            )}
          </select>
          ${course?.is_law_course
            ? html`<span class="law-badge">Juridik</span>`
            : ""}
        </td>
        <td>
          <select
            @change="${(e) => this.updateStartDate(run.run_id, e.target.value)}"
          >
            ${availableDatesForCohort.map(
              (date) => html`
                <option
                  value="${date}"
                  ?selected="${slot?.start_date === date}"
                >
                  ${date}
                </option>
              `
            )}
          </select>
        </td>
        <td>
          <select
            @change="${(e) =>
              this.updateTeacher(run.run_id, parseInt(e.target.value))}"
          >
            <option value="">-- Välj --</option>
            ${store
              .getTeachers()
              .map(
                (t) => html`
                  <option
                    value="${t.teacher_id}"
                    ?selected="${t.teacher_id === run.teacher_id}"
                  >
                    ${t.name}
                  </option>
                `
              )}
          </select>
        </td>
        <td>
          <div class="actions">
            <button
              class="btn delete"
              @click="${() => this.removeCourseFromSequence(run.run_id)}"
            >
              Ta bort
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Get available courses for the cohort based on business rules:
   * 1. Exclude courses already in sequence (except current row)
   * 2. Law courses (except Juridisk översikt) require Juridisk översikt to be completed first
   * 3. Sort by co-reading potential (samläsning) - courses with available capacity prioritized
   * 4. Secondary sort by preferred_order_index
   */
  getAvailableCoursesForCohort(excludeRunId = null) {
    const cohortRuns = this.getCohortCourseRuns();
    const cohort = store.getCohort(this.selectedCohortId);
    const cohortSize = cohort?.planned_size || 30;

    // Get course IDs already used in this cohort's sequence (excluding current row)
    const usedCourseIds = cohortRuns
      .filter((r) => r.run_id !== excludeRunId)
      .map((r) => r.course_id);

    // Check if Juridisk översiktskurs (law_type: "overview") is in the sequence
    const hasJuridiskOversikt = cohortRuns.some((r) => {
      const course = store.getCourse(r.course_id);
      return course?.law_type === "overview";
    });

    // Get all courses and filter
    let availableCourses = store.getCourses().filter((course) => {
      // Exclude already used courses
      if (usedCourseIds.includes(course.course_id)) {
        return false;
      }

      // Law course logic:
      // - Juridisk översiktskurs (law_type: "overview") is always available
      // - Other law courses require Juridisk översiktskurs to be completed first
      if (course.is_law_course && course.law_type !== "overview") {
        if (!hasJuridiskOversikt) {
          return false; // Hide other law courses until Juridisk översikt is done
        }
      }

      return true;
    });

    // Calculate co-reading potential for each course
    const MAX_STUDENTS_PREFERRED = 100;
    const MAX_STUDENTS_HARD = 130;

    // Get available dates for this cohort
    const cohortStartDate = cohort?.start_date || "";
    const availableDatesForCohort = AVAILABLE_DATES.filter(
      (date) => date >= cohortStartDate
    );

    availableCourses = availableCourses.map((course) => {
      // Find existing course runs for this course that could be co-read
      // Only consider runs at dates available for this cohort
      const existingRuns = store.getCourseRuns().filter((run) => {
        if (run.course_id !== course.course_id) return false;
        // Don't count runs this cohort is already in
        if (run.cohorts && run.cohorts.includes(this.selectedCohortId))
          return false;
        // Only consider runs at dates available for this cohort
        const slot = store.getSlot(run.slot_id);
        if (!slot || !availableDatesForCohort.includes(slot.start_date))
          return false;
        return true;
      });

      let samlesning_info = "";
      let samlesning_score = 0; // Higher = better for co-reading

      if (existingRuns.length > 0) {
        // Check each existing run for co-reading potential
        for (const run of existingRuns) {
          const currentStudents = run.planned_students || 0;
          const potentialTotal = currentStudents + cohortSize;
          const slot = store.getSlot(run.slot_id);

          if (potentialTotal <= MAX_STUDENTS_PREFERRED) {
            // Great for co-reading
            samlesning_score = 100 - potentialTotal; // Lower total = higher score
            samlesning_info = ` ★ Samläsning möjlig (${currentStudents}+${cohortSize}=${potentialTotal} stud)`;
            break;
          } else if (potentialTotal <= MAX_STUDENTS_HARD) {
            // Possible but near limit
            samlesning_score = 50 - potentialTotal;
            samlesning_info = ` ⚠ Samläsning nära gräns (${potentialTotal} stud)`;
          }
        }
      }

      return {
        ...course,
        samlesning_info,
        samlesning_score,
      };
    });

    // Check if this is the first course for the cohort (no courses in sequence yet)
    const isFirstCourse =
      cohortRuns.length === 0 ||
      (cohortRuns.length === 1 &&
        excludeRunId &&
        cohortRuns[0].run_id === excludeRunId);

    // Check if there are any other cohorts with courses at the first available date
    const firstAvailableDate = availableDatesForCohort[0];

    let hasOtherCohortsAtFirstDate = false;
    if (firstAvailableDate) {
      // Find slots at or near the first available date
      const runsAtFirstDate = store.getCourseRuns().filter((run) => {
        const slot = store.getSlot(run.slot_id);
        if (!slot) return false;
        // Check if any other cohort has a course at this date
        if (run.cohorts && run.cohorts.includes(this.selectedCohortId))
          return false;
        return slot.start_date === firstAvailableDate;
      });
      hasOtherCohortsAtFirstDate = runsAtFirstDate.length > 0;
    }

    // Sort courses:
    // 1. If first course AND no other cohorts at first date: prioritize Juridisk översikt
    // 2. By co-reading potential (samlesning_score, higher first)
    // 3. By preferred_order_index (lower first)
    availableCourses.sort((a, b) => {
      // Special case: First course with no other cohorts - prioritize Juridisk översikt
      if (isFirstCourse && !hasOtherCohortsAtFirstDate) {
        const aIsJuridiskOversikt = a.law_type === "overview";
        const bIsJuridiskOversikt = b.law_type === "overview";
        if (aIsJuridiskOversikt && !bIsJuridiskOversikt) return -1;
        if (!aIsJuridiskOversikt && bIsJuridiskOversikt) return 1;
      }

      // Then: prioritize courses with co-reading potential
      if (a.samlesning_score !== b.samlesning_score) {
        return b.samlesning_score - a.samlesning_score;
      }
      // Finally: by preferred order
      return (
        (a.preferred_order_index || 999) - (b.preferred_order_index || 999)
      );
    });

    return availableCourses;
  }

  onCohortChange(e) {
    const cohortId = parseInt(e.target.value);
    this.selectedCohortId = cohortId || null;
  }

  getCohortCourseRuns() {
    if (!this.selectedCohortId) return [];

    return store
      .getCourseRuns()
      .filter(
        (run) => run.cohorts && run.cohorts.includes(this.selectedCohortId)
      )
      .sort((a, b) => {
        const slotA = store.getSlot(a.slot_id);
        const slotB = store.getSlot(b.slot_id);
        if (!slotA || !slotB) return 0;
        return new Date(slotA.start_date) - new Date(slotB.start_date);
      });
  }

  updateCourse(runId, newCourseId) {
    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (run) {
      run.course_id = newCourseId;
      store.notify();
      this.showMessage("Kurs uppdaterad!", "success");
    }
  }

  updateStartDate(runId, newStartDate) {
    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (run) {
      // Find or create slot with this start date
      let slot = store.getSlots().find((s) => s.start_date === newStartDate);
      if (!slot) {
        // Calculate end date (4 weeks later)
        const startDate = new Date(newStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 28);
        slot = store.addSlot({
          start_date: newStartDate,
          end_date: endDate.toISOString().split("T")[0],
          evening_pattern: "tis/tor",
          is_placeholder: false,
        });
      }
      run.slot_id = slot.slot_id;
      store.notify();
      this.showMessage("Startdatum uppdaterat!", "success");
    }
  }

  updateTeacher(runId, newTeacherId) {
    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (run) {
      run.teacher_id = newTeacherId;
      store.notify();
      this.showMessage("Lärare uppdaterad!", "success");
    }
  }

  updateOrder(runId, newOrder) {
    // Reorder courses - this is a simplified version
    // In a full implementation, you'd reorder slots
    this.showMessage(
      "Ordning sparad (visuellt - slots behöver anpassas)",
      "warning"
    );
  }

  addCourseToSequence() {
    if (!this.selectedCohortId) return;

    const cohort = store.getCohort(this.selectedCohortId);
    const cohortStartDate = cohort?.start_date || "";

    // Filter dates to only include dates on or after the cohort's start date
    const availableDatesForCohort = AVAILABLE_DATES.filter(
      (date) => date >= cohortStartDate
    );

    if (availableDatesForCohort.length === 0) {
      this.showMessage("Inga tillgängliga datum för denna kull!", "error");
      return;
    }

    // Find next available slot date
    const cohortRuns = this.getCohortCourseRuns();
    let nextDateIndex = 0;

    if (cohortRuns.length > 0) {
      const lastRun = cohortRuns[cohortRuns.length - 1];
      const lastSlot = store.getSlot(lastRun.slot_id);
      if (lastSlot) {
        const lastDateIndex = availableDatesForCohort.indexOf(
          lastSlot.start_date
        );
        nextDateIndex = Math.min(
          lastDateIndex + 1,
          availableDatesForCohort.length - 1
        );
      }
    }

    const nextDate = availableDatesForCohort[nextDateIndex];

    // Find or create slot
    let slot = store.getSlots().find((s) => s.start_date === nextDate);
    if (!slot) {
      const startDate = new Date(nextDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 28);
      slot = store.addSlot({
        start_date: nextDate,
        end_date: endDate.toISOString().split("T")[0],
        evening_pattern: "tis/tor",
        is_placeholder: false,
      });
    }

    // Get first available course using business logic
    const availableCourses = this.getAvailableCoursesForCohort();

    if (availableCourses.length === 0) {
      this.showMessage(
        "Alla kurser är redan tillagda för denna kull!",
        "warning"
      );
      return;
    }

    // Pick the first (best) course based on sorting
    const availableCourse = availableCourses[0];

    // Create new course run
    store.addCourseRun({
      course_id: availableCourse.course_id,
      slot_id: slot.slot_id,
      teacher_id: null,
      cohorts: [this.selectedCohortId],
      planned_students:
        store.getCohort(this.selectedCohortId)?.planned_size || 30,
      status: "planerad",
    });

    this.showMessage(`Kurs "${availableCourse.name}" tillagd!`, "success");
  }

  removeCourseFromSequence(runId) {
    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (run) {
      // Remove this cohort from the run
      run.cohorts = run.cohorts.filter((id) => id !== this.selectedCohortId);

      // If no cohorts left, remove the entire run
      if (run.cohorts.length === 0) {
        const index = store.courseRuns.indexOf(run);
        if (index > -1) {
          store.courseRuns.splice(index, 1);
        }
      }

      store.notify();
      this.showMessage("Kurs borttagen från sekvensen!", "success");
    }
  }

  showMessage(text, type) {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }
}

customElements.define("cohort-sequence-editor", CohortSequenceEditor);
