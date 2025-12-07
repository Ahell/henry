import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";

export class CohortsTab extends LitElement {
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

    .panel-header {
      margin-bottom: var(--space-6);
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
    editingCohortId: { type: Number },
    message: { type: String },
    messageType: { type: String },
  };

  constructor() {
    super();
    this.editingCohortId = null;
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
        <div class="panel-header">
          <henry-text variant="heading-3">Lägg till Ny Kull</henry-text>
        </div>
        <form @submit="${this.handleAddCohort}">
          <div class="form-row">
            <henry-input
              id="cohortStartDate"
              type="date"
              label="Startdatum"
              required
            ></henry-input>
            <henry-input
              id="cohortSize"
              type="number"
              label="Planerat antal studenter"
              min="1"
              placeholder="30"
              required
            ></henry-input>
          </div>
          <henry-button type="submit" variant="primary">
            Lägg till Kull
          </henry-button>
        </form>
      </div>

      <div class="panel">
        <div class="panel-header">
          <henry-text variant="heading-3">Befintliga Kullar</henry-text>
        </div>
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
            <henry-button
              size="small"
              variant="success"
              @click="${() => this.handleSaveCohort(cohort.cohort_id)}"
            >
              Spara
            </henry-button>
            <henry-button
              size="small"
              variant="secondary"
              @click="${() => this.handleCancelCohortEdit()}"
            >
              Avbryt
            </henry-button>
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
          <henry-button
            size="small"
            variant="secondary"
            @click="${() => this.handleEditCohort(cohort.cohort_id)}"
          >
            Redigera
          </henry-button>
          <henry-button
            size="small"
            variant="danger"
            @click="${() =>
              this.handleDeleteCohort(cohort.cohort_id, cohort.name)}"
          >
            Ta bort
          </henry-button>
        </td>
      </tr>
    `;
  }

  async handleAddCohort(e) {
    e.preventDefault();
    const startDate = this.shadowRoot
      .querySelector("#cohortStartDate")
      .getInput().value;
    const plannedSize = parseInt(
      this.shadowRoot.querySelector("#cohortSize").getInput().value
    );

    const cohort = {
      start_date: startDate,
      planned_size: plannedSize,
    };

    try {
      await store.addCohort(cohort);
      this.message = "Kull tillagd!";
      this.messageType = "success";
      this.shadowRoot.querySelector("form").reset();
      setTimeout(() => {
        this.message = "";
      }, 3000);
    } catch (error) {
      this.message = `Fel: ${error.message}`;
      this.messageType = "error";
      setTimeout(() => {
        this.message = "";
      }, 5000);
    }
  }

  handleEditCohort(cohortId) {
    this.editingCohortId = cohortId;
  }

  handleCancelCohortEdit() {
    this.editingCohortId = null;
  }

  handleSaveCohort(cohortId) {
    const startDate = this.shadowRoot.querySelector(
      `#edit-cohort-date-${cohortId}`
    ).value;
    const plannedSize = parseInt(
      this.shadowRoot.querySelector(`#edit-cohort-size-${cohortId}`).value
    );

    store.updateCohort(cohortId, {
      start_date: startDate,
      planned_size: plannedSize,
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
        `Är du säker på att du vill ta bort kullen "${cohortName}"?\n\nDetta kommer också ta bort alla schemalagda kurstillfällen för denna kull.`
      )
    ) {
      try {
        await store.deleteCohort(cohortId);
        this.message = `Kull "${cohortName}" borttagen!`;
        this.messageType = "success";
        setTimeout(() => {
          this.message = "";
        }, 3000);
      } catch (error) {
        this.message = `Fel: ${error.message}`;
        this.messageType = "error";
        setTimeout(() => {
          this.message = "";
        }, 5000);
      }
    }
  }
}

customElements.define("cohorts-tab", CohortsTab);
