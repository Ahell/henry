import { LitElement, html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { store } from "../../../platform/store/DataStore.js";
import "../../../components/ui/index.js";
import "../../teacher-availability/index.js";
import "../../scheduling/index.js";
import "../../courses/components/courses-tab.js";
import "../../teachers/components/teachers-tab.js";
import "../../cohorts/components/cohorts-tab.js";
import "../../slots/components/slots-tab.js";
import { adminPanelStyles } from "../styles/admin-panel.styles.js";

export class AdminPanel extends LitElement {
  static styles = adminPanelStyles;

  static properties = {
    activeTab: { type: String },
    loading: { type: Boolean },
    message: { type: String },
    messageType: { type: String },
  };

  constructor() {
    super();
    this.activeTab = "courses";
    this.loading = false;
    this.message = "";
    this.messageType = "";
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
    ];
    store.subscribe(() => this.requestUpdate());
  }

  async handleLoadSeedData() {
    if (
      !confirm(
        "Detta kommer att ERSÄTTA ALL data i databasen med testdata.\n\nVill du fortsätta?"
      )
    ) {
      return;
    }

    this.loading = true;
    this.message = "";
    this.requestUpdate();

    try {
      await store.dataServiceManager.loadSeedDataToDatabase();
      this.message = "Testdata laddad till databasen!";
      this.messageType = "success";
    } catch (error) {
      this.message = `Fel vid laddning av testdata: ${error.message}`;
      this.messageType = "error";
    } finally {
      this.loading = false;
      this.requestUpdate();

      // Clear message after 5 seconds
      setTimeout(() => {
        this.message = "";
        this.requestUpdate();
      }, 5000);
    }
  }

  async handleResetDatabase() {
    if (
      !confirm(
        "Detta kommer att RADERA ALL DATA från databasen.\n\nDenna åtgärd kan inte ångras!\n\nVill du fortsätta?"
      )
    ) {
      return;
    }

    this.loading = true;
    this.message = "";
    this.requestUpdate();

    try {
      await store.dataServiceManager.resetDatabase();
      this.message =
        'Databas återställd. Klicka "Ladda Testdata" om du vill fylla den.';
      this.messageType = "success";
    } catch (error) {
      this.message = `Fel vid återställning: ${error.message}`;
      this.messageType = "error";
    } finally {
      this.loading = false;
      this.requestUpdate();

      // Clear message after 5 seconds
      setTimeout(() => {
        this.message = "";
        this.requestUpdate();
      }, 5000);
    }
  }

  render() {
    return html`
      <!-- Data Management Panel -->
      <div class="data-management">
        <span class="data-management-label">Testdata:</span>
        <div class="button-group">
          <henry-button
            variant="primary"
            size="small"
            ?disabled=${this.loading}
            @click=${this.handleLoadSeedData}
          >
            ${this.loading ? "Laddar..." : "Ladda Testdata"}
          </henry-button>
          <henry-button
            variant="danger"
            size="small"
            ?disabled=${this.loading}
            @click=${this.handleResetDatabase}
          >
            ${this.loading ? "Återställer..." : "Återställ Databas"}
          </henry-button>
        </div>
        ${this.message
          ? html`
              <div class="message ${this.messageType}">${this.message}</div>
            `
          : ""}
      </div>

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
