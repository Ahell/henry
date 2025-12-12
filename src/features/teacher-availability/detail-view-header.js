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
      gap: var(--space-4);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
      background: linear-gradient(
          135deg,
          rgba(102, 126, 234, 0.06),
          rgba(255, 255, 255, 0)
        ),
        var(--color-background);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary-700);
      margin-bottom: var(--space-1);
    }

    .title-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .detail-view-title {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      font-size: var(--font-size-xl);
      line-height: var(--line-height-tight);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      background: var(--color-gray-100);
      color: var(--color-text-secondary);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      border: 1px solid var(--color-border);
    }

    .pill.warning {
      background: var(--color-warning-light);
      color: var(--color-warning-hover);
      border-color: var(--color-warning);
    }

    .title-block {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .detail-view-actions {
      display: flex;
      gap: var(--space-2);
      flex-shrink: 0;
      align-items: center;
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
        <div class="title-block">
          <div class="detail-view-title">${this.slotTitle}</div>
          ${this.daysLength
            ? html`<span class="pill">${this.daysLength} dagar</span>`
            : ""}
        </div>
        <div class="detail-view-actions">
          <henry-button
            variant="${this.isEditingExamDate ? "primary" : "outline"}"
            size="small"
            @click="${this._toggleExamDateEditing}"
          >
            ${this.isEditingExamDate ? "Avbryt ändring" : "Ändra tentamensdatum"}
          </henry-button>
          <henry-button
            variant="secondary"
            size="small"
            @click="${this._exitDetailView}"
          >
            Avsluta detaljläge
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
