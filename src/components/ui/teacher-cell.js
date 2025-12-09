import { LitElement, html } from "lit";

export class TeacherCell extends LitElement {
  static properties = {
    teacherId: { type: Number },
    slotDate: { type: String },
    date: { type: String },
    slotId: { type: Number },
    isDetail: { type: Boolean },
    classNameSuffix: { type: String },
    titleText: { type: String },
    content: { type: String },
    isLocked: { type: Boolean },
  };

  // Render into light DOM to keep table structure and global CSS compatibility
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
    this.teacherId = null;
    this.slotDate = null;
    this.date = null;
    this.slotId = null;
    this.isDetail = false;
    this.classNameSuffix = "";
    this.titleText = "";
    this.content = "";
    this.isLocked = false;
    this._onMouseDownListener = null;
    this._onMouseEnterListener = null;
  }

  updated() {
    // Ensure host element carries needed class and attributes
    // Keep existing classes but ensure `teacher-cell` is present
    if (!this.classList.contains("teacher-cell")) {
      this.classList.add("teacher-cell");
    }

    // Apply suffix classes (like 'unavailable', 'teaching-day-default')
    if (this.classNameSuffix) {
      const tokens = this.classNameSuffix.split(" ").filter(Boolean);
      for (const t of tokens) {
        if (!this.classList.contains(t)) this.classList.add(t);
      }
    }

    this.setAttribute("data-teacher-id", this.teacherId ?? "");
    if (this.slotDate) this.setAttribute("data-slot-date", this.slotDate);
    if (this.slotId !== null)
      this.setAttribute("data-slot-id", String(this.slotId));
    if (this.date) this.setAttribute("data-date", this.date);
    this.setAttribute("data-is-detail", this.isDetail ? "true" : "false");
    this.setAttribute("title", this.titleText ?? "");
    this.setAttribute("data-is-locked", this.isLocked ? "true" : "false");
  }

  connectedCallback() {
    super.connectedCallback();
    // Use event listeners on the host (light DOM) to normalize interactions
    this._onMouseDownListener = (e) => {
      // Prevent text selection and other default browser behaviors for painting
      try { e.preventDefault(); } catch (err) { /* ignore */ }
      // Build normalized payload
      const detail = {
        teacherId: this.teacherId,
        slotDate: this.slotDate,
        date: this.date,
        slotId: this.slotId,
        isDetail: !!this.isDetail,
        isLocked: !!this.isLocked,
      };
      this.dispatchEvent(new CustomEvent('cell-mousedown', { detail, bubbles: true, composed: true }));
    };

    this._onMouseEnterListener = (e) => {
      const detail = {
        teacherId: this.teacherId,
        slotDate: this.slotDate,
        date: this.date,
        slotId: this.slotId,
        isDetail: !!this.isDetail,
        isLocked: !!this.isLocked,
      };
      this.dispatchEvent(new CustomEvent('cell-enter', { detail, bubbles: true, composed: true }));
    };

    this.addEventListener('mousedown', this._onMouseDownListener);
    this.addEventListener('mouseenter', this._onMouseEnterListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._onMouseDownListener) this.removeEventListener('mousedown', this._onMouseDownListener);
    if (this._onMouseEnterListener) this.removeEventListener('mouseenter', this._onMouseEnterListener);
  }

  render() {
    return html`${this.content || ""}`;
  }
}

customElements.define("teacher-cell", TeacherCell);
