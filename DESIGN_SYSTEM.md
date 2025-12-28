# Design System - Henry Course Planner

## Översikt

Detta dokument beskriver design systemet för Henry Course Planner, baserat på KTH:s grafiska profil och visuella identitet.

## 🎨 Design Tokens

### Färger (KTH Palett)

#### Primärfärger

```css
--color-kth-blue: #004791;      /* KTH-blå (Huvudfärg) */
--color-navy: #000061;          /* Marinblå (Mörkare accent/text) */
--color-sky-blue: #6298d2;      /* Himmelsblå */
--color-light-blue: #def0ff;    /* Ljusblå (Bakgrunder) */
--color-digital-blue: #0029ed;  /* Digitalblå (Digital accent) */
```

#### Funktionsfärger

Används för status, grafer och pedagogisk kodning.

**Grön (Success/Bra):**
```css
--color-green-dark: #0d4a21;
--color-green: #4da060;
--color-green-light: #c7ebba;
```

**Röd/Tegel (Danger/Varning/Spärr):**
```css
--color-red-dark: #78001a;
--color-red: #e86a58;
--color-red-light: #ffccc4;
```

**Gul (Warning/Uppmärksamhet):**
```css
--color-yellow-dark: #a65900;
--color-yellow: #ffbe00;
--color-yellow-light: #fff0b0;
```

**Turkos (Info/Komplement):**
```css
--color-turquoise-dark: #1c434c;
--color-turquoise: #339c9c;
--color-turquoise-light: #b2e0e0;
```

#### Neutrala färger

```css
--color-sand: #ebe5e0;          /* Sand (Bakgrund) */
--color-white: #ffffff;         /* Ren vit */
--color-broken-white: #fcfcfc;  /* Bruten vit */
--color-broken-black: #212121;  /* Bruten svart (Huvudtext) */
--color-gray-dark: #323232;     /* Mörkgrå */
--color-gray: #a5a5a5;          /* Grå */
--color-gray-light: #e6e6e6;    /* Ljusgrå (Borders) */
```

### Semantiska Mappningar

```css
--color-primary-500: var(--color-kth-blue);
--color-background: var(--color-white);
--color-surface: var(--color-sand);
--color-text-primary: var(--color-broken-black);
--color-border: var(--color-gray-light);
```

### Typografi

#### Font Familjer

```css
--font-family-base: "Figtree", sans-serif; /* Rubriker & UI */
--font-family-serif: "Georgia", serif;     /* Brödtext */
--font-family-mono: "SF Mono", monospace;  /* Kod/Data */
```

#### Font Storlekar

```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 2rem;      /* 32px */
```

### Spacing

Baserad på 4px skala (0.25rem).

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

### Border Radius

```css
--radius-sm: 2px;
--radius-base: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-full: 9999px;
```

## 🧩 Komponenter

### Button

Använder KTH-blå för primära actions.

```html
<henry-button variant="primary">Spara</henry-button>
<henry-button variant="secondary">Avbryt</henry-button>
```

### Form Elements

Enhetlig styling med `henry-input`, `henry-select`, etc.
Använd alltid labels.

### Gantt Chart

Färgkodning av kurser använder den mörka skalan av funktionsfärger för att garantera kontrast mot vit text.

## 📏 Designprinciper

1. **KTH Identitet:** Använd alltid definierade färger och typsnitt.
2. **Tillgänglighet:** Säkerställ god kontrast. Använd mörka varianter av funktionsfärger för text/ikoner på ljus bakgrund.
3. **Konsekvens:** Undvik hårdkodade värden. Använd tokens.

## 📦 Filstruktur

```
src/
├── styles/
│   ├── tokens.css      # Alla designvariabler
│   └── theme.css       # Globala bas-stilar och utilities
└── components/
    └── ui/             # Bas-komponenter (Button, Input, etc.)
```