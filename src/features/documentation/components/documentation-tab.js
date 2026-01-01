import { LitElement, html } from "lit";
import "../../../components/ui/index.js";
import { documentationTabStyles } from "../styles/documentation-tab.styles.js";

export class DocumentationTab extends LitElement {
  static styles = documentationTabStyles;

  render() {
    return html`
      <henry-panel full-height>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Dokumentation</henry-text>
        </div>
        <div class="tab-body">
          <div class="tab-scroll">
            <div class="layout-stack">
              <div class="section-grid">
                <div class="section-card">
                  <henry-text variant="heading-4" class="section-title">
                    Översikt
                  </henry-text>
                  <p>
                    Henry Kursplanerare samlar kurser, lärare, kursperioder och
                    kullar så att du kan planera undervisning och bemanning över
                    tid. Varje flik fokuserar på ett steg i planeringen och
                    hjälper dig att gå från grunddata till färdigt schema.
                  </p>
                  <p>
                    Målet är att snabbt se vad som är möjligt, upptäcka krockar
                    och exportera underlag när planeringen är klar.
                  </p>
                </div>

                <div class="section-card">
                  <henry-text variant="heading-4" class="section-title">
                    Typiskt arbetsflöde
                  </henry-text>
                  <ol>
                    <li>Skapa kurser och komplettera med krav och metadata.</li>
                    <li>Lägg upp lärare och markera vilka kurser de kan hålla.</li>
                    <li>Definiera kursperioder och kullar.</li>
                    <li>Registrera lärarnas tillgänglighet.</li>
                    <li>Planera kursomgångar i schemaläggningen.</li>
                    <li>Granska rapporter och exportera vid behov.</li>
                  </ol>
                </div>
              </div>

              <div class="section-card">
                <henry-text variant="heading-4" class="section-title">
                  Kärnobjekt
                </henry-text>
                <ul>
                  <li>
                    <strong>Kurser</strong> innehåller kod, namn, poäng och
                    eventuella krav.
                  </li>
                  <li>
                    <strong>Lärare</strong> kopplas till vilka kurser de kan
                    undervisa.
                  </li>
                  <li>
                    <strong>Kursperioder</strong> är tidsluckor (slots) med
                    start- och slutdatum.
                  </li>
                  <li>
                    <strong>Kullar</strong> beskriver studentgrupper och deras
                    storlek.
                  </li>
                  <li>
                    <strong>Kursomgångar</strong> kopplar kurs, kull och lärare i
                    en kursperiod.
                  </li>
                </ul>
              </div>

              <div class="section-card">
                <henry-text variant="heading-4" class="section-title">
                  Flikar
                </henry-text>
                <div class="definition-list">
                  <div class="definition-row">
                    <span class="definition-term">Kurser</span>
                    <span class="definition-desc">
                      Hantera kursinformation, krav och kursmetadata.
                    </span>
                  </div>
                  <div class="definition-row">
                    <span class="definition-term">Lärare</span>
                    <span class="definition-desc">
                      Lägg upp lärare, kompetenser och kurskopplingar.
                    </span>
                  </div>
                  <div class="definition-row">
                    <span class="definition-term">Kursperioder</span>
                    <span class="definition-desc">
                      Skapa tidsluckor för undervisning och schema.
                    </span>
                  </div>
                  <div class="definition-row">
                    <span class="definition-term">Kullar</span>
                    <span class="definition-desc">
                      Hantera studentkullar och deras planerade storlek.
                    </span>
                  </div>
                  <div class="definition-row">
                    <span class="definition-term">Lärartillgänglighet</span>
                    <span class="definition-desc">
                      Markera tillgänglighet per lärare och kursperiod.
                    </span>
                  </div>
                  <div class="definition-row">
                    <span class="definition-term">Schemaläggning</span>
                    <span class="definition-desc">
                      Planera kursomgångar med drag-and-drop och få stöd för
                      krockar.
                    </span>
                  </div>
                  <div class="definition-row">
                    <span class="definition-term">Regler</span>
                    <span class="definition-desc">
                      Styr prioriteringar och valideringar för auto-fyll.
                    </span>
                  </div>
                  <div class="definition-row">
                    <span class="definition-term">Rapport</span>
                    <span class="definition-desc">
                      Filtrera och exportera rapporter till CSV eller PDF.
                    </span>
                  </div>
                  <div class="definition-row">
                    <span class="definition-term">Import/Export</span>
                    <span class="definition-desc">
                      Importera eller exportera hela databasen som JSON.
                    </span>
                  </div>
                  <div class="definition-row">
                    <span class="definition-term">Dokumentation</span>
                    <span class="definition-desc">
                      Beskriver appens funktioner och arbetsflöde.
                    </span>
                  </div>
                </div>
              </div>

              <div class="section-grid">
                <div class="section-card">
                  <henry-text variant="heading-4" class="section-title">
                    Ändringar och status
                  </henry-text>
                  <ul>
                    <li>
                      <strong>Redigera</strong> måste vara aktiv för att göra
                      ändringar.
                    </li>
                    <li>
                      <strong>Commit</strong> skapar en återställningspunkt för
                      nuvarande data.
                    </li>
                    <li>
                      <strong>Revertera</strong> återgår till senaste commit och
                      sparar tillbaka.
                    </li>
                    <li>
                      <strong>Status</strong> visar korta systemmeddelanden i
                      sidomenyn.
                    </li>
                  </ul>
                  <div class="callout">
                    <strong>Tips:</strong> Om du fastnar, kontrollera först att
                    Redigera är påslaget.
                  </div>
                </div>

                <div class="section-card">
                  <henry-text variant="heading-4" class="section-title">
                    Adminverktyg
                  </henry-text>
                  <ul>
                    <li>
                      <strong>Ladda testdata</strong> ersätter all data med
                      exempeldata.
                    </li>
                    <li>
                      <strong>Återställ databas</strong> rensar all data och kan
                      inte ångras.
                    </li>
                  </ul>
                  <div class="callout">
                    <strong>Tips:</strong> Använd testdata för demo eller
                    onboarding, men undvik det i produktion.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </henry-panel>
    `;
  }
}

customElements.define("documentation-tab", DocumentationTab);
