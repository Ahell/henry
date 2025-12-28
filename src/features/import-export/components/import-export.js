import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import "../../../components/ui/index.js";
import { importExportStyles } from "../styles/import-export.styles.js";

export class ImportExport extends LitElement {
  static styles = importExportStyles;

  static properties = {
    message: { type: String },
    messageType: { type: String },
  };

  constructor() {
    super();
    this.message = "";
    this.messageType = "";
    this._onStoreChange = () => this.requestUpdate();
  }

  connectedCallback() {
    super.connectedCallback();
    store.subscribe(this._onStoreChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    store.unsubscribe(this._onStoreChange);
  }

  render() {
    return html`
      <div class="layout-stack">
        <henry-panel full-height>
          <div slot="header" class="panel-header">
            <henry-text variant="heading-3">Importera / Exportera</henry-text>
          </div>

          <div class="tab-body">
            <div class="tab-scroll">
              <div class="section-card">
                <henry-text variant="heading-4" style="margin-bottom: var(--space-3)">Importera data (JSON)</henry-text>
                <p>
                  JSON innehåller hela databasen och kan importeras tillbaka utan att
                  tappa relationer.
                </p>

                ${this.message
                  ? html`
                      <div class="message ${this.messageType}">${this.message}</div>
                    `
                  : ""}

                <div class="button-group">
                  <henry-button variant="primary" @click="${this.triggerFileInput}">
                    Välj fil (JSON)
                  </henry-button>
                </div>
              </div>

              <input
                type="file"
                id="fileInput"
                accept=".json"
                @change="${this.handleFileUpload}"
                style="display: none;"
              />

              <div class="section-card">
                <henry-text variant="heading-4" style="margin-bottom: var(--space-3)">Exportera data</henry-text>
                <p>
                  Exportera hela databasen som JSON för redigering och återimport.
                </p>
                <div class="button-group">
                  <henry-button variant="primary" @click="${this.exportAsJson}">
                    Exportera full databas (JSON)
                  </henry-button>
                </div>
                
                <div class="preview-section">
                  <div class="data-preview">
                    <pre>${JSON.stringify(store.exportData(), null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </henry-panel>
      </div>
    `;
  }

  triggerFileInput() {
    this.shadowRoot.querySelector("#fileInput").click();
  }

  async handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const content = await file.text();
      let data;

      if (file.name.endsWith(".json")) {
        data = JSON.parse(content);
      } else {
        throw new Error("Okänd filformat. Använd JSON.");
      }

      store.importData(data);
      this.message = `Importerade ${file.name} framgångsrikt!`;
      this.messageType = "success";
    } catch (err) {
      this.message = `Fel vid import: ${err.message}`;
      this.messageType = "error";
    }

    setTimeout(() => {
      this.message = "";
    }, 4000);
  }

  exportAsJson() {
    const data = store.exportData();
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, "henry-course-plan.json", "application/json");
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

customElements.define("import-export", ImportExport);
