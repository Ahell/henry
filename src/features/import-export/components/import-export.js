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
  }

  render() {
    return html`
      <div class="panel">
        <h3>Importera Data från Excel/JSON</h3>

        ${this.message
          ? html`
              <div class="message ${this.messageType}">${this.message}</div>
            `
          : ""}

        <div class="button-group">
          <henry-button variant="primary" @click="${this.triggerFileInput}">
            Välj fil (CSV/JSON)
          </henry-button>
          <henry-button variant="secondary" @click="${this.loadSampleData}">
            Ladda Exempeldata
          </henry-button>
        </div>

        <input
          type="file"
          id="fileInput"
          accept=".json,.csv"
          @change="${this.handleFileUpload}"
        />

        <div class="data-preview">
          <p><strong>Aktuell data:</strong></p>
          <pre>${JSON.stringify(store.exportData(), null, 2)}</pre>
        </div>
      </div>

      <div class="panel">
        <h3>Exportera Data</h3>
        <p>Exportera all data som JSON för att spara eller dela.</p>
        <div class="button-group">
          <henry-button variant="primary" @click="${this.exportAsJson}">
            Exportera som JSON
          </henry-button>
          <henry-button variant="secondary" @click="${this.exportAsCSV}">
            Exportera som CSV
          </henry-button>
        </div>
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
      } else if (file.name.endsWith(".csv")) {
        data = this.parseCSV(content);
      } else {
        throw new Error("Okänd filformat. Använd JSON eller CSV.");
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

  parseCSV(content) {
    // Enkel CSV-parser - detta kan utökas för mer komplexa scenarier
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const data = {
      courses: [],
      cohorts: [],
      teachers: [],
      slots: [],
      courseRuns: [],
      teacherAvailability: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row = {};
      headers.forEach((h, j) => {
        row[h] = values[j];
      });

      // Försök identifiera vilken typ av data detta är
      const credits = row.credits ?? row.hp;
      if (row.code && row.name && credits) {
        data.courses.push({
          code: row.code,
          name: row.name,
          credits: parseFloat(credits),
        });
      }
    }

    return data;
  }

  async loadSampleData() {
    try {
      await store.loadSeedDataToDatabase();
      this.message =
        "Fullständig testdata laddad (14 kurser, 10 kullar, 12 lärare, alla slots och kursomgångar)!";
      this.messageType = "success";
    } catch (error) {
      this.message = `Fel vid laddning av testdata: ${error.message}`;
      this.messageType = "error";
    }
    this.requestUpdate();
    setTimeout(() => {
      this.message = "";
      this.requestUpdate();
    }, 4000);
  }

  exportAsJson() {
    const data = store.exportData();
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, "henry-course-plan.json", "application/json");
  }

  exportAsCSV() {
    const data = store.exportData();
    let csv = "Courses\n";
    csv += "code,name,credits\n";
    data.courses.forEach((c) => {
      csv += `${c.code},"${c.name}",${c.credits ?? ""}\n`;
    });

    csv += "\nCohorts\n";
    csv += "name,start_date,planned_size\n";
    data.cohorts.forEach((c) => {
      csv += `${c.name},${c.start_date},${c.planned_size}\n`;
    });

    this.downloadFile(csv, "henry-course-plan.csv", "text/csv");
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
