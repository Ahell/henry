import { html } from "lit";
import { store } from "../../../platform/store/DataStore.js";

export class CohortTableService {
  static formatDateYYMMDD(value) {
    if (!value) return "-";
    const [datePart] = String(value).split("T");
    const parts = datePart.split("-");
    if (parts.length !== 3) return datePart;
    const [yyyy, mm, dd] = parts;
    if (!yyyy || !mm || !dd) return datePart;
    return `${yyyy.slice(-2)}${mm}${dd}`;
  }

  static getColumns() {
    return [
      { key: "name", label: "Namn", width: "200px" },
      { key: "start_date", label: "Startdatum", width: "150px" },
      { key: "planned_size", label: "Antal Studenter", width: "150px" },
      { key: "actions", label: "Åtgärder", width: "180px" },
    ];
  }

  static renderCell(cohort, column, onEdit, onDelete, onInfo, isSaving = false) {
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
        return html`${CohortTableService.formatDateYYMMDD(cohort.start_date)}`;
      case "planned_size":
        return html`${cohort.planned_size}`;
      case "actions":
        return html`
          <div style="display: flex; gap: var(--space-2);">
            <henry-button
              variant="secondary"
              size="small"
              ?disabled=${!store.editMode || isSaving}
              @click="${() => onEdit?.(cohort.cohort_id)}"
            >
              Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              ?disabled=${!store.editMode || isSaving}
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
