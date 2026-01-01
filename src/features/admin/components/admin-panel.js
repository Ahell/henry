import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import "../../../components/ui/index.js";
import "../../teacher-availability/index.js";
import "../../scheduling/index.js";
import "../../business-logic/index.js";
import "../../report/index.js";
import "../../import-export/index.js";
import "../../documentation/index.js";
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
        key: "teachers",
        label: "Lärare",
        component: html`<teachers-tab></teachers-tab>`,
      },
      {
        key: "slots",
        label: "Kursperioder",
        component: html`<slots-tab></slots-tab>`,
      },
      {
        key: "cohorts",
        label: "Kullar",
        component: html`<cohorts-tab></cohorts-tab>`,
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
        label: "Regler",
        component: html`<business-logic-tab></business-logic-tab>`,
      },
      {
        key: "report",
        label: "Rapport",
        component: html`<report-tab></report-tab>`,
      },
      {
        key: "importExport",
        label: "Import/Export",
        component: html`<import-export></import-export>`,
      },
      {
        key: "documentation",
        label: "Dokumentation",
        component: html`<documentation-tab></documentation-tab>`,
      },
    ];
    store.subscribe(() => this.requestUpdate());
  }

  getTabsMeta() {
    return (this.tabs || []).map((t) => ({ key: t.key, label: t.label }));
  }

  updated(changed) {
    if (changed.has("activeTab")) {
      this.dispatchEvent(
        new CustomEvent("admin-tab-changed", {
          bubbles: true,
          composed: true,
          detail: { activeTab: this.activeTab },
        })
      );
    }
  }

  render() {
    const active =
      this.tabs.find((tab) => tab.key === this.activeTab) || this.tabs[0];
    return html`
      ${active?.component || ""}
    `;
  }
}

customElements.define("admin-panel", AdminPanel);
