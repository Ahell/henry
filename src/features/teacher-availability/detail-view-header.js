import { LitElement, html, css } from "lit";
import "../../components/ui/button.js";

export class DetailViewHeader extends LitElement {
  static properties = {
    slotTitle: { type: String },
    daysLength: { type: Number },
    isEditingExamDate: { type: Boolean },
  };

  // Keep default shadow DOM here - the header is a div outside of the table
  static styles = css`
    :host {
      display: block;
    }
    .detail-view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      padding: var(--space-3);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
    }

    .detail-view-title {
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary);
    }

    .detail-view-actions {
      display: flex;
      gap: var(--space-2);
    }
  `;

  constructor() {
    super();
    this.slotTitle = "";
    this.daysLength = 0;
    this.isEditingExamDate = false;
  }

  render() {
    return html`
      <div class="detail-view-header">
        <div class="detail-view-title">
          📅
          ${this.slotTitle}${this.daysLength
            ? ` (${this.daysLength} dagar)`
            : ""}
        </div>
        <div class="detail-view-actions">
          <henry-button
            variant="${this.isEditingExamDate ? "primary" : "outline"}"
            size="small"
            @click="${this._toggleExamDateEditing}"
          >
            ${this.isEditingExamDate
              ? "🚫 Avbryt ändring"
              : "📝 Ändra tentamensdatum"}
          </henry-button>
          <henry-button
            variant="secondary"
            size="small"
            @click="${this._exitDetailView}"
          >
            ← Avsluta detaljläge
          </henry-button>
        </div>
      </div>
    `;
  }

  _toggleExamDateEditing() {
    this.dispatchEvent(
      new CustomEvent("toggle-edit-exam", {
        bubbles: true,
        composed: true,
        detail: { isEditing: !this.isEditingExamDate },
      })
    );
  }

  _exitDetailView() {
    this.dispatchEvent(
      new CustomEvent("exit-detail", { bubbles: true, composed: true })
    );
  }
}

customElements.define("detail-view-header", DetailViewHeader);
