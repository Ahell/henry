import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";

export class CohortsTab extends LitElement {
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

      <henry-panel>
        <div slot="header">
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
      </henry-panel>

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Befintliga Kullar</henry-text>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${this._getCohortTableColumns()}"
          .data="${store.getCohorts().sort((a, b) => new Date(a.start_date) - new Date(b.start_date))}"
          .renderCell="${(row, col) => this._renderCohortTableCell(row, col)}"
        ></henry-table>
      </henry-panel>
    `;
  }

  _getCohortTableColumns() {
    return [
      { key: 'name', label: 'Namn', width: '200px' },
      { key: 'start_date', label: 'Startdatum', width: '150px' },
      { key: 'planned_size', label: 'Antal Studenter', width: '150px' },
      { key: 'actions', label: 'Åtgärder', width: '180px' },
    ];
  }

  _renderCohortTableCell(cohort, column) {
    const isEditing = this.editingCohortId === cohort.cohort_id;

    switch (column.key) {
      case 'name':
        if (isEditing) {
          return html`
            <input
              type="text"
              class="edit-input"
              id="edit-cohort-name-${cohort.cohort_id}"
              .value="${cohort.name}"
            />
          `;
        }
        return html`${cohort.name}`;

      case 'start_date':
        if (isEditing) {
          return html`
            <input
              type="date"
              class="edit-input"
              id="edit-cohort-date-${cohort.cohort_id}"
              .value="${cohort.start_date}"
            />
          `;
        }
        return html`${cohort.start_date}`;

      case 'planned_size':
        if (isEditing) {
          return html`
            <input
              type="number"
              class="edit-input"
              id="edit-cohort-size-${cohort.cohort_id}"
              .value="${cohort.planned_size}"
              min="1"
            />
          `;
        }
        return html`${cohort.planned_size}`;

      case 'actions':
        if (isEditing) {
          return html`
            <div style="display: flex; gap: var(--space-2);">
              <henry-button
                variant="success"
                size="small"
                @click="${() => this.handleSaveCohort(cohort.cohort_id)}"
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
              @click="${() => this.handleEditCohort(cohort.cohort_id)}"
            >
              ✏️ Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              @click="${() => this.handleDeleteCohort(cohort.cohort_id)}"
            >
              🗑️ Ta bort
            </henry-button>
          </div>
        `;

      default:
        return html`${cohort[column.key] ?? ''}`;
    }
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
