import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import {
  getInputValue,
  resetForm,
  showSuccessMessage,
  showErrorMessage,
  initializeEditState,
  subscribeToStore,
} from "../../utils/admin-helpers.js";
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
    cohorts: { type: Array },
  };

  constructor() {
    super();
    initializeEditState(this, "editingCohortId");
    this.cohorts = store.getCohorts();
    subscribeToStore(this);
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
          .data="${this.cohorts
            .slice()
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))}"
          .renderCell="${(row, col) => this._renderCohortTableCell(row, col)}"
        ></henry-table>
      </henry-panel>

      ${this._renderEditModal()}
    `;
  }

  _renderEditModal() {
    if (!this.editingCohortId) return html``;

    const cohort = store.getCohort(this.editingCohortId);
    if (!cohort) return html``;

    return html`
      <henry-modal
        open
        title="Redigera Kull"
        @close="${this.handleCancelCohortEdit}"
      >
        <form @submit="${(e) => this._handleSaveFromModal(e)}">
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input
              id="edit-name"
              label="Namn"
              .value="${cohort.name}"
              readonly
              disabled
              style="background-color: #e9ecef; cursor: not-allowed;"
            ></henry-input>

            <henry-input
              id="edit-date"
              label="Startdatum"
              type="date"
              .value="${cohort.start_date}"
              required
            ></henry-input>

            <henry-input
              id="edit-size"
              label="Antal Studenter"
              type="number"
              min="1"
              .value="${cohort.planned_size}"
              required
            ></henry-input>
          </div>
        </form>

        <div slot="footer">
          <henry-button
            variant="secondary"
            @click="${this.handleCancelCohortEdit}"
          >
            Avbryt
          </henry-button>
          <henry-button
            variant="success"
            @click="${() => this.handleSaveCohort(cohort.cohort_id)}"
          >
            💾 Spara
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  _handleSaveFromModal(e) {
    e.preventDefault();
    if (this.editingCohortId) {
      this.handleSaveCohort(this.editingCohortId);
    }
  }

  _getCohortTableColumns() {
    return [
      { key: "name", label: "Namn", width: "200px" },
      { key: "start_date", label: "Startdatum", width: "150px" },
      { key: "planned_size", label: "Antal Studenter", width: "150px" },
      { key: "actions", label: "Åtgärder", width: "180px" },
    ];
  }

  _renderCohortTableCell(cohort, column) {
    switch (column.key) {
      case "name":
        return html`${cohort.name}`;

      case "start_date":
        return html`${cohort.start_date}`;

      case "planned_size":
        return html`${cohort.planned_size}`;

      case "actions":
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
        return html`${cohort[column.key] ?? ""}`;
    }
  }

  async handleAddCohort(e) {
    e.preventDefault();
    const root = this.shadowRoot;
    const startDate = getInputValue(root, "cohortStartDate");
    const plannedSize = parseInt(getInputValue(root, "cohortSize"));

    const cohort = {
      start_date: startDate,
      planned_size: plannedSize,
    };

    try {
      await store.addCohort(cohort);
      resetForm(root);
      showSuccessMessage(this, "Kull tillagd!");
    } catch (error) {
      showErrorMessage(this, `Fel: ${error.message}`);
    }
  }

  handleEditCohort(cohortId) {
    this.editingCohortId = cohortId;
  }

  handleCancelCohortEdit() {
    this.editingCohortId = null;
  }

  handleSaveCohort(cohortId) {
    const root = this.shadowRoot;
    const startDate = getInputValue(root, "edit-date");
    const plannedSize = parseInt(getInputValue(root, "edit-size"));

    store.updateCohort(cohortId, {
      start_date: startDate,
      planned_size: plannedSize,
    });

    this.editingCohortId = null;
    showSuccessMessage(this, "Kull uppdaterad!");
  }

  async handleDeleteCohort(cohortId) {
    const cohort = store.getCohort(cohortId);
    if (!cohort) return;

    const cohortName = cohort.name;

    if (
      confirm(
        `Är du säker på att du vill ta bort kullen "${cohortName}"?\n\nDetta kommer också ta bort alla schemalagda kurstillfällen för denna kull.`
      )
    ) {
      try {
        await store.deleteCohort(cohortId);
        showSuccessMessage(this, `Kull "${cohortName}" borttagen!`);
      } catch (error) {
        showErrorMessage(this, `Fel: ${error.message}`);
      }
    }
  }
}

customElements.define("cohorts-tab", CohortsTab);
