import { LitElement, html, css } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import "../../../components/ui/index.js";

export class ImportExport extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .panel {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    h3 {
      margin-top: 0;
      color: #333;
    }

    .button-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.2s;
    }

    button:hover {
      background: #0056b3;
    }

    button.secondary {
      background: #6c757d;
    }

    button.secondary:hover {
      background: #5a6268;
    }

    button.danger {
      background: #dc3545;
    }

    button.danger:hover {
      background: #c82333;
    }

    input[type="file"] {
      display: none;
    }

    .message {
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .message.success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .message.error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .data-preview {
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .data-preview pre {
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.4;
    }
  `;

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

      <div class="panel">
        <h3>Återställ Data</h3>
        <p>
          Återställ all data till ursprunglig seeddata. Detta raderar alla
          ändringar du gjort.
        </p>
        <div class="button-group">
          <henry-button variant="danger" @click="${this.resetData}">
            Återställ till Grunddata
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

  async resetData() {
    if (
      confirm(
        "Är du säker? Detta raderar alla ändringar och återställer till ursprungsdata."
      )
    ) {
      try {
        await store.resetToSeedData();
        this.message = "Data återställd till ursprungsdata!";
        this.messageType = "success";
      } catch (error) {
        this.message = `Fel vid återställning: ${error.message}`;
        this.messageType = "error";
      }
      this.requestUpdate();
      setTimeout(() => {
        this.message = "";
        this.requestUpdate();
      }, 4000);
    }
  }
}

customElements.define("import-export", ImportExport);
