import { LitElement, html } from "lit";
import "../../../components/ui/paint-controls.js";

export class TeacherAvailabilityToolbar extends LitElement {
  static properties = {
    isPainting: { type: Boolean },
    paintMode: { type: String },
  };

  // Use light DOM so surrounding table styles continue to apply consistently.
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
    this.isPainting = false;
    this.paintMode = null;
  }

  render() {
    return html`
      <paint-controls
        .isPainting=${this.isPainting}
        .paintMode=${this.paintMode}
        @paint-change-request=${(e) => this._forwardPaintChange(e)}
      ></paint-controls>
    `;
  }

  _forwardPaintChange(e) {
    this.dispatchEvent(
      new CustomEvent("paint-change-request", {
        detail: e?.detail,
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define(
  "teacher-availability-toolbar",
  TeacherAvailabilityToolbar
);
