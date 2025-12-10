import { LitElement, html } from "lit";

export class AvailabilityEmptyState extends LitElement {
  static properties = {
    message: { type: String },
  };

  // Render in light DOM so parent styles (like .empty-state) apply.
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
    this.message = "";
  }

  render() {
    return html`
      <div class="empty-state">
        <p>${this.message}</p>
      </div>
    `;
  }
}

customElements.define("availability-empty-state", AvailabilityEmptyState);
