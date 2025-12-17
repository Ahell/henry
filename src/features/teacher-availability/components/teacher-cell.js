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
    this._prevClassTokens = [];
    this._onMouseDownListener = null;
    this._onMouseEnterListener = null;
  }

  updated() {
    // Ensure host element carries base class
    this.classList.add("teacher-cell");

    // Update suffix classes (like 'unavailable', 'teaching-day-default')
    const nextTokens = this.classNameSuffix
      ? this.classNameSuffix.split(" ").filter(Boolean)
      : [];
    // Remove previously applied tokens to avoid stale classes
    for (const token of this._prevClassTokens) {
      if (!nextTokens.includes(token)) this.classList.remove(token);
    }
    // Add current tokens
    for (const token of nextTokens) {
      this.classList.add(token);
    }
    this._prevClassTokens = nextTokens;

    this._setAttr("data-teacher-id", this.teacherId ?? "");
    this._setAttr("data-slot-date", this.slotDate);
    this._setAttr("data-slot-id", this.slotId != null ? String(this.slotId) : "");
    this._setAttr("data-date", this.date);
    this._setAttr("data-is-detail", this.isDetail ? "true" : "false");
    this._setAttr("data-is-locked", this.isLocked ? "true" : "false");
    this._setAttr("title", this.titleText ?? "");
  }

  connectedCallback() {
    super.connectedCallback();
    // Use event listeners on the host (light DOM) to normalize interactions
    this._onMouseDownListener = (e) => this._handleMouseDown(e);
    this._onMouseEnterListener = (e) => this._handleMouseEnter(e);

    this.addEventListener("mousedown", this._onMouseDownListener);
    this.addEventListener("mouseenter", this._onMouseEnterListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._onMouseDownListener)
      this.removeEventListener("mousedown", this._onMouseDownListener);
    if (this._onMouseEnterListener)
      this.removeEventListener("mouseenter", this._onMouseEnterListener);
  }

  render() {
    return html`<span class="cell-content">${this.content || ""}</span>`;
  }

  _handleMouseDown(e) {
    // Prevent text selection and other default browser behaviors for painting
    try {
      e.preventDefault();
    } catch (err) {
      /* ignore */
    }
    this.dispatchEvent(
      new CustomEvent("cell-mousedown", {
        detail: this._buildDetail(),
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleMouseEnter() {
    this.dispatchEvent(
      new CustomEvent("cell-enter", {
        detail: this._buildDetail(),
        bubbles: true,
        composed: true,
      })
    );
  }

  _buildDetail() {
    return {
      teacherId: this.teacherId,
      slotDate: this.slotDate,
      date: this.date,
      slotId: this.slotId,
      isDetail: !!this.isDetail,
      isLocked: !!this.isLocked,
    };
  }

  _setAttr(name, value) {
    if (value === undefined || value === null || value === "") {
      this.removeAttribute(name);
    } else {
      this.setAttribute(name, value);
    }
  }
}

customElements.define("teacher-cell", TeacherCell);
