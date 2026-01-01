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
                    FEI Kursplanerare samlar kurser, lärare, kursperioder och
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

              <div class="tabs-section">
                <henry-text variant="heading-4" class="section-title">
                  Flikar
                </henry-text>
                <div class="tab-grid">
                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Kurser
                    </henry-text>
                    <p>
                      Fliken Kurser är startpunkten för allt annat. Här skapar du
                      kursobjekt som sedan används i schemaläggning och rapporter.
                      Klicka Lägg till kurs för att öppna formuläret. Ange kurskod,
                      kursnamn och högskolepoäng, och välj eventuella spärrkurser
                      som måste vara klara innan kursen kan läsas.
                    </p>
                    <p>
                      Välj också kompatibla lärare så att schemaläggningen vet vem
                      som kan undervisa kursen, och markera om någon av dem är
                      examinator. När du sparar dyker kursen upp i tabellen. I
                      tabellen kan du öppna informationsläget för att se detaljer,
                      redigera via åtgärderna och ta bort en kurs när den inte
                      längre behövs. Radera försiktigt om kursen redan används i
                      planeringen.
                    </p>
                  </div>

                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Lärare
                    </henry-text>
                    <p>
                      Fliken Lärare används för att registrera all personal som
                      kan undervisa. Klicka Lägg till lärare, fyll i namn och välj
                      avdelning. Därefter kopplar du läraren till kompatibla
                      kurser. Det styr vilka kurser som visas som möjliga i
                      schemaläggningen och i lärartillgänglighetens filter.
                    </p>
                    <p>
                      Om läraren är examinator för vissa kurser markerar du dessa
                      i listan Examinator för kurser. När du sparar visas läraren
                      i tabellen där du kan öppna info för en sammanställning,
                      redigera uppgifter eller ta bort en lärare. Om du tar bort
                      en lärare rensas kopplingar automatiskt, så dubbelkolla
                      innan du bekräftar. Använd sökningen i tabellen för att
                      hitta rätt snabbare, särskilt när listan växer.
                    </p>
                  </div>

                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Kursperioder
                    </henry-text>
                    <p>
                      Fliken Kursperioder används för att definiera de tidsluckor
                      som schemaläggningen bygger på. Klicka Lägg till kursperiod
                      för att infoga en ny period i rätt ordning, välj Infoga
                      efter och ett startdatum som passar kalendern. Systemet
                      använder startdatumet för att visa perioderna som kolumner
                      i schemaläggningen och i lärartillgänglighet.
                    </p>
                    <p>
                      I tabellen ser du periodernas startdatum och åtgärder. Via
                      Redigera kan du justera startdatum om planeringen flyttas,
                      och Info visar vilka kullar och kurser som ligger i
                      perioden. Om du har överlappande perioder varnar systemet,
                      så håll kalendern ren och logisk. Det gör det lättare att
                      hitta rätt slot när du planerar, och ger tydligare
                      rapporter.
                    </p>
                  </div>

                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Kullar
                    </henry-text>
                    <p>
                      Fliken Kullar handlar om studentgrupperna som ska planeras.
                      Klicka Lägg till kull och ange startdatum samt planerat
                      antal studenter. Startdatumet används för att sortera kullar
                      och visas i schemaläggningen tillsammans med kullnummer, så
                      det lönar sig att vara konsekvent.
                    </p>
                    <p>
                      När en kull är skapad kan du öppna info för att se kopplade
                      kurser och kursperioder, eller redigera om storleken
                      förändras. Antalet studenter påverkar reglerna för
                      maxkapacitet och rapporterna, så håll siffran uppdaterad när
                      planeringen ändras. Du kan ta bort en kull om den inte ska
                      planeras alls, men gör det först när du är säker på att inga
                      kursomgångar längre behövs för gruppen.
                    </p>
                  </div>

                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Lärartillgänglighet
                    </henry-text>
                    <p>
                      I Lärartillgänglighet ser du alla lärare mot kursperioder i
                      en tabell. Slå på Redigera för att kunna måla. Klicka en
                      cell för att markera otillgänglighet eller dra över flera
                      celler för snabb ändring. Färglegendens betydelse ligger
                      längst ned.
                    </p>
                    <p>
                      När du klickar på en kursperiods rubrik öppnas detaljläge
                      där samma period bryts ned dag för dag. Där kan du filtrera
                      på en specifik kurs eller välja att applicera ändringen på
                      alla kurser i perioden. Använd knappen Idag för att hoppa
                      till aktuella perioder, och Avsluta detaljläge för att
                      återgå. Den här fliken är grunden för hur kompatibilitet och
                      varningar visas i schemaläggningen.
                    </p>
                  </div>

                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Schemaläggning
                    </henry-text>
                    <p>
                      I Schemaläggning planerar du faktiska kursomgångar. Varje
                      rad motsvarar en kull, och varje kolumn representerar en
                      kursperiod. Till vänster finns depån med kurser som ännu
                      inte ligger i schemat för den valda kullen. Dra en kurs
                      från depån till en cell för att skapa en kursomgång, och dra
                      tillbaka till depån för att ta bort den.
                    </p>
                    <p>
                      Systemet visar kompatibilitet, kapacitet och varningar när
                      du planerar, och du kan använda Återställ för att flytta
                      allt tillbaka till depån för den kullen. Auto-fyll använder
                      reglerna för att föreslå ett schema. Använd
                      varningsmarkörer för att se konflikter eller regelbrott och
                      justera manuellt. Spara ändringar med Commit i sidomenyn
                      när du är nöjd.
                    </p>
                  </div>

                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Regler
                    </henry-text>
                    <p>
                      I Regler styr du prioriteringar för auto-fyll och vilka
                      kontroller som ska vara aktiva. Varje regelrad har en
                      aktiv/inaktiv switch, och du kan dra i handtaget för att
                      ändra ordningen som auto-fyll använder. Högre upp i listan
                      betyder högre prioritet.
                    </p>
                    <p>
                      Längst ned justerar du max antal studenter, både ett hårt
                      tak och ett föredraget värde. När Redigera är på sparas
                      ändringarna automatiskt efter en kort stund, och en spinner
                      visar att sparning pågår. Om en regel är avstängd syns den
                      grå, men kan snabbt aktiveras igen. Använd fliken när du
                      vill påverka hur schemaläggningen väljer mellan flera
                      möjliga alternativ. Det är ett bra ställe att finjustera
                      resultatet när kapacitet eller tillgänglighet ändras.
                    </p>
                  </div>

                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Rapport
                    </henry-text>
                    <p>
                      I Rapport sammanställer du data från kurser, lärare och
                      kursperioder för översikt och export. Börja med
                      fritextsökningen för att filtrera på kurskod, kursnamn eller
                      lärare. Använd filtren för år, termin, avdelning och
                      datumintervall för att snäva in listan. När du öppnar
                      avancerade filter kan du lägga till examinator,
                      kursansvarig, antal deltagare och slotspecifika villkor.
                    </p>
                    <p>
                      Tabellen uppdateras direkt när du ändrar filter. När
                      urvalet är klart väljer du om du vill exportera en
                      filtrerad rapport eller hela databasen som CSV eller PDF.
                      Exportknapparna visar en spinner under generering, och
                      filen laddas ner med datumstämpel. Rapporten är praktisk
                      för delning med ledning eller som underlag inför möten.
                    </p>
                  </div>

                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Import/Export
                    </henry-text>
                    <p>
                      I Import/Export hanterar du hela databasen som JSON. För
                      import klickar du Välj fil och pekar ut en JSON-fil,
                      systemet läser in filen och ersätter aktuell data. Ett
                      meddelande bekräftar om importen lyckades eller om formatet
                      är fel. Under importen låses redigering tillfälligt för att
                      undvika konflikter.
                    </p>
                    <p>
                      För export klickar du Exportera full databas (JSON); filen
                      laddas ner lokalt med ett standardnamn. Under export visas
                      också en förhandsvisning av JSON så att du snabbt kan
                      kontrollera innehållet. Använd detta när du vill ta backup,
                      flytta data mellan miljöer eller dela med andra som kan
                      återimportera. Kom ihåg att import ersätter allt, så
                      exportera gärna först.
                    </p>
                  </div>

                  <div class="section-card">
                    <henry-text variant="heading-4" class="section-title">
                      Dokumentation
                    </henry-text>
                    <p>
                      Fliken Dokumentation är din inbyggda manual och samlar
                      praktiska steg för varje del av appen. Läs den när du är ny
                      i verktyget, eller när du behöver påminnelse om hur en viss
                      funktion fungerar. Texterna är skrivna för att matcha de
                      faktiska knapparna och flödena i gränssnittet, så du kan
                      följa dem samtidigt som du arbetar.
                    </p>
                    <p>
                      Om processerna förändras kan du uppdatera innehållet här så
                      att andra användare får rätt instruktioner. Använd gärna
                      fliken som onboarding för nya planerare och som referens
                      när du exporterar eller importerar data. Den ger sammanhang
                      till regler och schemaläggning och gör det lättare att
                      arbeta konsekvent.
                    </p>
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
