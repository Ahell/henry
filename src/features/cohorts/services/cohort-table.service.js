import { html } from "lit";
import { store } from "../../../platform/store/DataStore.js";

export class CohortTableService {
  static getColumns() {
    return [
      { key: "name", label: "Namn", width: "200px" },
      { key: "start_date", label: "Startdatum", width: "150px" },
      { key: "planned_size", label: "Antal Studenter", width: "150px" },
      { key: "actions", label: "Åtgärder", width: "180px" },
    ];
  }

  static renderCell(cohort, column, onEdit, onDelete, onInfo) {
    if (!cohort || !column) return html``;

    switch (column.key) {
      case "name":
        return html`
          <button
            class="cohort-name-button"
            type="button"
            @click="${() => onInfo?.(cohort.cohort_id)}"
          >
            ${cohort.name}
          </button>
        `;
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
              ?disabled=${!store.editMode}
              @click="${() => onEdit?.(cohort.cohort_id)}"
            >
              Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              ?disabled=${!store.editMode}
              @click="${() => onDelete?.(cohort.cohort_id)}"
            >
              Ta bort
            </henry-button>
          </div>
        `;
      default:
        return html`${cohort[column.key] ?? ""}`;
    }
  }
}
