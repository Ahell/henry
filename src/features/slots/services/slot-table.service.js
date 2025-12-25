import { html } from "lit";

export class SlotTableService {
  static getColumns() {
    return [
      { key: "name", label: "Namn", width: "200px" },
      { key: "start_date", label: "Startdatum", width: "150px" },
      { key: "end_date", label: "Slutdatum", width: "150px" },
      { key: "duration", label: "Längd (dagar)", width: "120px" },
      { key: "actions", label: "", width: "120px" },
    ];
  }

  static renderCell(slot, column, onEdit, onDelete) {
    if (!slot || !column) return html``;

    switch (column.key) {
      case "name":
        return html`${slot.name || "-"}`;
      case "start_date":
        return html`${slot.start_date || "-"}`;
      case "end_date":
        return html`${slot.end_date || "-"}`;
      case "duration":
        if (!slot.start_date || !slot.end_date) return html`-`;
        const start = new Date(slot.start_date);
        const end = new Date(slot.end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return html`${diffDays}`;
      case "actions":
        return html`
          <henry-button
            variant="secondary"
            size="small"
            @click="${() => onEdit?.(slot.slot_id)}"
          >
            ✏️ Redigera
          </henry-button>
          <henry-button
            variant="danger"
            size="small"
            @click="${() => onDelete?.(slot.slot_id)}"
          >
            🗑️ Ta bort
          </henry-button>
        `;
      default:
        return html`${slot[column.key] ?? ""}`;
    }
  }
}
