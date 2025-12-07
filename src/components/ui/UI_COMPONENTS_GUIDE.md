# Henry UI Components Guide

## Översikt

Denna guide visar hur du använder de primära UI-komponenterna i Henry-appen.

## Komponenter

### 1. Henry Button

Används för alla knappar i appen.

**Attribut:**

- `variant`: `primary` (default), `secondary`, `danger`, `success`
- `size`: `small`, `medium` (default), `large`
- `disabled`: Boolean
- `fullWidth`: Boolean

**Användning:**

```html
<!-- Primär knapp -->
<henry-button @button-click="${this.handleClick}"> Spara </henry-button>

<!-- Sekundär knapp -->
<henry-button variant="secondary" @button-click="${this.handleCancel}">
  Avbryt
</henry-button>

<!-- Farlig handling -->
<henry-button variant="danger" @button-click="${this.handleDelete}">
  Ta bort
</henry-button>

<!-- Full bredd -->
<henry-button fullWidth @button-click="${this.handleSubmit}">
  ➕ Lägg till
</henry-button>
```

### 2. Henry Input

Används för textinmatning, nummer, datum etc.

**Attribut:**

- `label`: Label-text
- `value`: Värde
- `type`: `text` (default), `number`, `date`, `email`, etc.
- `required`: Boolean
- `disabled`: Boolean
- `placeholder`: Placeholder-text
- `min`, `max`, `step`: För nummer/datum

**Användning:**

```html
<!-- Text input med label -->
<henry-input
  label="Kursnamn"
  .value=${this.courseName}
  placeholder="Ange kursnamn"
  required
  @input-change=${(e) => this.courseName = e.detail.value}
></henry-input>

<!-- Nummer input -->
<henry-input
  label="Poäng"
  type="number"
  .value=${this.points}
  min="0"
  max="100"
  @input-change=${(e) => this.points = e.detail.value}
></henry-input>

<!-- Datum input -->
<henry-input
  label="Startdatum"
  type="date"
  .value=${this.startDate}
  @input-change=${(e) => this.startDate = e.detail.value}
></henry-input>
```

### 3. Henry Select

Används för dropdown-menyer.

**Attribut:**

- `label`: Label-text
- `value`: Valt värde
- `required`: Boolean
- `disabled`: Boolean
- `placeholder`: Placeholder-text

**Användning:**

```html
<henry-select
  label="Blocklängd"
  .value=${this.blockLength}
  required
  @select-change=${(e) => this.blockLength = e.detail.value}
>
  <option value="1">1 block</option>
  <option value="2">2 block</option>
  <option value="4">4 block</option>
</henry-select>
```

### 4. Henry Textarea

Används för flerradiga textfält.

**Attribut:**

- `label`: Label-text
- `value`: Värde
- `required`: Boolean
- `disabled`: Boolean
- `placeholder`: Placeholder-text
- `rows`: Antal rader (default: 4)

**Användning:**

```html
<henry-textarea
  label="Beskrivning"
  .value=${this.description}
  placeholder="Skriv en beskrivning..."
  rows="6"
  @textarea-change=${(e) => this.description = e.detail.value}
></henry-textarea>
```

### 5. Henry Checkbox

Används för checkboxar.

**Attribut:**

- `label`: Label-text
- `checked`: Boolean
- `disabled`: Boolean

**Användning:**

```html
<henry-checkbox
  label="Aktiv kurs"
  .checked=${this.isActive}
  @checkbox-change=${(e) => this.isActive = e.detail.checked}
></henry-checkbox>
```

### 6. Henry Heading

Används för rubriker.

**Attribut:**

- `level`: `h1`, `h2` (default), `h3`, `h4`, `h5`, `h6`
- `align`: `left` (default), `center`, `right`

**Användning:**

```html
<henry-heading level="h2">Kurser</henry-heading>
<henry-heading level="h3" align="center">Välkommen</henry-heading>
```

### 7. Henry Card

Används för kort/paneler.

**Attribut:**

- `variant`: `default`, `elevated`, `bordered`
- `padding`: Boolean (default: true)

**Användning:**

```html
<henry-card variant="elevated">
  <henry-heading level="h3">Panel titel</henry-heading>
  <p>Panel innehåll...</p>
</henry-card>

<henry-card variant="bordered" ?padding="${false}">
  <div style="padding: 20px;">Custom padding</div>
</henry-card>
```

## Best Practices

1. **Konsekvent användning**: Använd alltid dessa komponenter istället för vanlig HTML
2. **Event handling**: Lyssna på komponent-events (`button-click`, `input-change`, etc.)
3. **Reactive properties**: Använd `.value` för att binda egenskaper
4. **Styling**: Styling hanteras av komponenterna - behöver inte överskrivas

## Exempel: Komplett formulär

```javascript
render() {
  return html`
    <henry-card variant="elevated">
      <henry-heading level="h2">Lägg till ny kurs</henry-heading>

      <form @submit=${this.handleSubmit}>
        <henry-input
          label="Kursnamn"
          .value=${this.courseName}
          required
          @input-change=${(e) => this.courseName = e.detail.value}
        ></henry-input>

        <henry-input
          label="Poäng"
          type="number"
          .value=${this.points}
          min="0"
          @input-change=${(e) => this.points = e.detail.value}
        ></henry-input>

        <henry-select
          label="Blocklängd"
          .value=${this.blockLength}
          required
          @select-change=${(e) => this.blockLength = e.detail.value}
        >
          <option value="1">1 block</option>
          <option value="2">2 block</option>
        </henry-select>

        <henry-textarea
          label="Beskrivning"
          .value=${this.description}
          rows="4"
          @textarea-change=${(e) => this.description = e.detail.value}
        ></henry-textarea>

        <henry-checkbox
          label="Aktiv kurs"
          .checked=${this.isActive}
          @checkbox-change=${(e) => this.isActive = e.detail.checked}
        ></henry-checkbox>

        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <henry-button type="submit">
            Spara
          </henry-button>
          <henry-button variant="secondary" @button-click=${this.handleCancel}>
            Avbryt
          </henry-button>
        </div>
      </form>
    </henry-card>
  `;
}
```

## Migration från gamla komponenter

### Före:

```html
<button type="submit" class="btn-submit">Spara</button>
<input type="text" id="courseName" />
<select id="blockLength">
  ...
</select>
```

### Efter:

```html
<henry-button type="submit">Spara</henry-button>
<henry-input label="Kursnamn" .value="${this.courseName}"></henry-input>
<henry-select label="Blocklängd" .value="${this.blockLength}">...</henry-select>
```

## Fördelar

✅ **Konsekvent design** - Alla komponenter följer samma designsystem  
✅ **Mindre kod** - Inbyggd styling och funktionalitet  
✅ **Lättare underhåll** - Uppdatera en komponent = uppdatera hela appen  
✅ **Bättre UX** - Professionella interaktioner och transitions  
✅ **Type safety** - Tydliga properties och events
