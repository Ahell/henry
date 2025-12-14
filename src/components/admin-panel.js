import { LitElement, html, css } from "lit";
import { store } from "../utils/store.js";
import "./report-viewer.js";
import "./ui/index.js";
import "./admin/index.js";

export class AdminPanel extends LitElement {
  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
      padding: 0;
    }

    .tabs {
      display: inline-flex;
      gap: var(--space-2);
      margin: var(--space-2) 0 var(--space-5);
      flex-wrap: wrap;
      padding: var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-gray-50);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
    }

    .tab-button {
      background: transparent;
      border: 1px solid transparent;
      padding: var(--space-2) var(--space-4);
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-sm);
      transition: var(--transition-all);
    }

    .tab-button.active {
      color: var(--color-primary-700);
      background: var(--color-primary-50);
      border-color: var(--color-primary-200);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    .tab-button:hover {
      color: var(--color-text-primary);
      background: var(--color-gray-100);
      border-color: var(--color-border);
    }
  `;

  static properties = {
    activeTab: { type: String },
  };

  constructor() {
    super();
    this.activeTab = "courses";
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      <div class="tabs">
        <button
          class="tab-button ${this.activeTab === "courses" ? "active" : ""}"
          @click="${() => (this.activeTab = "courses")}"
        >
          Kurser
        </button>
        <button
          class="tab-button ${this.activeTab === "cohorts" ? "active" : ""}"
          @click="${() => (this.activeTab = "cohorts")}"
        >
          Kullar
        </button>
        <button
          class="tab-button ${this.activeTab === "teachers" ? "active" : ""}"
          @click="${() => (this.activeTab = "teachers")}"
        >
          Lärare
        </button>
        <button
          class="tab-button ${this.activeTab === "slots" ? "active" : ""}"
          @click="${() => (this.activeTab = "slots")}"
        >
          Slots
        </button>
        <button
          class="tab-button ${this.activeTab === "teacherView" ? "active" : ""}"
          @click="${() => (this.activeTab = "teacherView")}"
        >
          Lärartillgänglighet
        </button>
        <button
          class="tab-button ${this.activeTab === "gantt" ? "active" : ""}"
          @click="${() => (this.activeTab = "gantt")}"
        >
          Schemaläggning
        </button>
      </div>

      ${this.activeTab === "courses" ? html`<courses-tab></courses-tab>` : ""}
      ${this.activeTab === "cohorts" ? html`<cohorts-tab></cohorts-tab>` : ""}
      ${this.activeTab === "teachers"
        ? html`<teachers-tab></teachers-tab>`
        : ""}
      ${this.activeTab === "slots" ? html`<slots-tab></slots-tab>` : ""}
      ${this.activeTab === "teacherView"
        ? html`<report-viewer
            .activeTab=${"teacher"}
            .hideTabs=${true}
          ></report-viewer>`
        : ""}
      ${this.activeTab === "gantt"
        ? html`<report-viewer
            .activeTab=${"gantt"}
            .hideTabs=${true}
          ></report-viewer>`
        : ""}
    `;
  }
}

customElements.define("admin-panel", AdminPanel);
