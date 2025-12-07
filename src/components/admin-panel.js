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
      padding: var(--space-4);
    }

    .tabs {
      display: flex;
      border-bottom: 2px solid var(--color-border);
      margin-bottom: var(--space-6);
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .tab-button {
      background: none;
      border: none;
      padding: var(--space-4);
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
      border-bottom: 3px solid transparent;
      transition: var(--transition-all);
      font-weight: var(--font-weight-medium);
    }

    .tab-button.active {
      color: var(--color-primary-500);
      border-bottom-color: var(--color-primary-500);
      background: var(--color-gray-50);
    }

    .tab-button:hover {
      color: var(--color-primary-500);
      background: var(--color-gray-50);
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
          📚 Kurser
        </button>
        <button
          class="tab-button ${this.activeTab === "cohorts" ? "active" : ""}"
          @click="${() => (this.activeTab = "cohorts")}"
        >
          👥 Kullar
        </button>
        <button
          class="tab-button ${this.activeTab === "teachers" ? "active" : ""}"
          @click="${() => (this.activeTab = "teachers")}"
        >
          👨‍🏫 Lärare
        </button>
        <button
          class="tab-button ${this.activeTab === "teacherView" ? "active" : ""}"
          @click="${() => (this.activeTab = "teacherView")}"
        >
          📅 Lärartillgänglighet
        </button>
        <button
          class="tab-button ${this.activeTab === "gantt" ? "active" : ""}"
          @click="${() => (this.activeTab = "gantt")}"
        >
          📊 Schemaläggning
        </button>
      </div>

      ${this.activeTab === "courses" ? html`<courses-tab></courses-tab>` : ""}
      ${this.activeTab === "cohorts" ? html`<cohorts-tab></cohorts-tab>` : ""}
      ${this.activeTab === "teachers"
        ? html`<teachers-tab></teachers-tab>`
        : ""}
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
