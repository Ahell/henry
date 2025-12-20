import { LitElement, html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { store } from "../../../platform/store/DataStore.js";
import "../../../components/ui/index.js";
import "../../teacher-availability/index.js";
import "../../scheduling/index.js";
import "../../business-logic/index.js";
import "../../courses/components/courses-tab.js";
import "../../teachers/components/teachers-tab.js";
import "../../cohorts/components/cohorts-tab.js";
import "../../slots/components/slots-tab.js";
import { adminPanelStyles } from "../styles/admin-panel.styles.js";

export class AdminPanel extends LitElement {
  static styles = adminPanelStyles;

  static properties = {
    activeTab: { type: String },
  };

  constructor() {
    super();
    this.activeTab = "courses";
    this.tabs = [
      {
        key: "courses",
        label: "Kurser",
        component: html`<courses-tab></courses-tab>`,
      },
      {
        key: "cohorts",
        label: "Kullar",
        component: html`<cohorts-tab></cohorts-tab>`,
      },
      {
        key: "teachers",
        label: "Lärare",
        component: html`<teachers-tab></teachers-tab>`,
      },
      {
        key: "slots",
        label: "Slots",
        component: html`<slots-tab></slots-tab>`,
      },
      {
        key: "teacherAvailability",
        label: "Lärartillgänglighet",
        component: html`<teacher-availability-tab></teacher-availability-tab>`,
      },
      {
        key: "scheduling",
        label: "Schemaläggning",
        component: html`<scheduling-tab></scheduling-tab>`,
      },
      {
        key: "businessLogic",
        label: "Affärslogik",
        component: html`<business-logic-tab></business-logic-tab>`,
      },
    ];
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      <!-- Tabs -->
      <div class="tabs">
        ${repeat(
          this.tabs,
          (tab) => tab.key,
          (tab) => html`
            <button
              class="tab-button ${this.activeTab === tab.key ? "active" : ""}"
              @click="${() => (this.activeTab = tab.key)}"
            >
              ${tab.label}
            </button>
          `
        )}
      </div>

      ${this.tabs.find((tab) => tab.key === this.activeTab)?.component || ""}
    `;
  }
}

customElements.define("admin-panel", AdminPanel);
