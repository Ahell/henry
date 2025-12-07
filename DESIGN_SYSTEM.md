# Design System - Henry Course Planner

## Översikt

Detta dokument beskriver design systemet för Henry Course Planner, inklusive design tokens, färger, typografi och komponenter.

## 🎨 Design Tokens

### Färger

#### Primärfärg (Blå)

```css
--color-primary-500: #667eea  /* Huvudfärg */
--color-primary-600: #5568d3  /* Hover state */
--color-primary-700: #4553b8  /* Active state */
```

#### Sekundärfärg (Lila)

```css
--color-secondary-500: #764ba2; /* Accent färg */
```

#### Semantiska färger

```css
--color-success: #10b981    /* Framgångsrika åtgärder */
--color-danger: #ef4444     /* Destruktiva åtgärder */
--color-warning: #f59e0b    /* Varningar */
--color-info: #3b82f6       /* Information */
```

#### Gråskala

```css
--color-gray-100: #f3f4f6   /* Bakgrunder */
--color-gray-300: #d1d5db   /* Borders */
--color-gray-700: #374151   /* Text */
--color-gray-900: #111827   /* Headings */
```

### Typografi

#### Font Familjer

```css
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', ...
```

#### Font Storlekar

```css
--font-size-xs: 0.75rem     /* 12px - Small text */
--font-size-sm: 0.875rem    /* 14px - Form labels */
--font-size-base: 1rem      /* 16px - Body text */
--font-size-lg: 1.125rem    /* 18px - Subheadings */
--font-size-xl: 1.25rem     /* 20px - H3 */
--font-size-2xl: 1.5rem     /* 24px - H2 */
--font-size-3xl: 2rem       /* 32px - H1 */
```

#### Font Vikter

```css
--font-weight-normal: 400    /* Body text */
--font-weight-medium: 500    /* Buttons, labels */
--font-weight-semibold: 600  /* Headings */
--font-weight-bold: 700      /* Important text */
```

### Spacing

Använder 4px bas-enhet:

```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-5: 1.25rem   /* 20px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
```

### Border Radius

```css
--radius-sm: 4px      /* Small elements */
--radius-base: 6px    /* Default (buttons, inputs) */
--radius-md: 8px      /* Cards */
--radius-lg: 12px     /* Large cards */
--radius-xl: 16px     /* Extra large */
--radius-full: 9999px /* Circular */
```

### Shadows

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.07)
--shadow-base: 0 4px 6px rgba(0, 0, 0, 0.1)
--shadow-md: 0 6px 12px rgba(0, 0, 0, 0.12)
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15)
```

Special shadows för komponenter:

```css
--shadow-primary: 0 2px 4px rgba(102, 126, 234, 0.4)
--shadow-danger: 0 2px 4px rgba(239, 68, 68, 0.4)
--shadow-success: 0 2px 4px rgba(16, 185, 129, 0.4)
```

### Transitions

```css
--transition-fast: 150ms ease
--transition-base: 200ms ease    /* Default */
--transition-slow: 300ms ease
--transition-all: all 200ms ease
```

## 🧩 Komponenter

### Button

**Variants:**

- `primary` - Huvudåtgärd (gradient blå → lila)
- `secondary` - Sekundär åtgärd (grå)
- `danger` - Destruktiv åtgärd (röd)
- `success` - Bekräfta åtgärd (grön)

**Sizes:**

- `small` - 32px höjd
- `medium` - 40px höjd (default)
- `large` - 48px höjd

**Användning:**

```html
<henry-button variant="primary">Spara</henry-button>
<henry-button variant="secondary" size="small">Avbryt</henry-button>
```

### Input

**Typer:** text, number, date, email, etc.

**States:**

- Default - Border: gray-300
- Hover - Border: gray-400
- Focus - Border: primary-500, ring shadow
- Disabled - Background: gray-100, opacity 0.6

**Användning:**

```html
<henry-input
  label="Kursnamn"
  .value="${this.name}"
  required
  @input-change="${this.handleChange}"
></henry-input>
```

### Select

Dropdown med konsekvent styling.

**Användning:**

```html
<henry-select label="Blocklängd" .value="${this.length}">
  <option value="1">1 block</option>
  <option value="2">2 block</option>
</henry-select>
```

### Card

Container för innehåll.

**Variants:**

- `default` - Enkel border
- `elevated` - Shadow med hover-effekt
- `bordered` - Primärfärg border

**Användning:**

```html
<henry-card variant="elevated">
  <henry-heading level="h3">Titel</henry-heading>
  <p>Innehåll...</p>
</henry-card>
```

## 📏 Designprinciper

### 1. Konsistens

- Använd alltid design tokens, inte hårdkodade värden
- Följ etablerade patterns för nya komponenter
- Alla interaktiva element ska ha hover/focus states

### 2. Hierarki

- Använd font-size och font-weight för visuell hierarki
- Primära åtgärder framhävs med `primary` variant
- Sekundära åtgärder använder `secondary` variant

### 3. Spacing

- Använd spacing scale (4px bas)
- Konsekvent spacing mellan relaterade element
- Mer spacing mellan olika sektioner

### 4. Feedback

- Alla interaktioner ger visuell feedback
- Hover states: subtle transform + shadow
- Focus states: ring shadow för tillgänglighet
- Disabled states: opacity + cursor not-allowed

### 5. Tillgänglighet

- Tillräcklig färgkontrast (WCAG AA)
- Focus states alltid synliga
- Labels på alla form inputs
- Required fields markerade med \*

## 🔧 Användning

### I komponenter (Lit)

```javascript
import { LitElement, html, css } from "lit";

export class MyComponent extends LitElement {
  static styles = css`
    @import url("/src/styles/tokens.css");

    .my-element {
      padding: var(--space-4);
      background: var(--color-primary-500);
      border-radius: var(--radius-base);
      box-shadow: var(--shadow-base);
      transition: var(--transition-all);
    }
  `;
}
```

### I global CSS

```html
<link rel="stylesheet" href="/src/styles/tokens.css" />
<link rel="stylesheet" href="/src/styles/theme.css" />
```

### I inline styles

```html
<div style="margin-bottom: var(--space-4); color: var(--color-text-primary);">
  Content
</div>
```

## 🎯 Best Practices

### DO ✅

- Använd design tokens för alla värden
- Följ component API dokumentation
- Testa hover/focus/disabled states
- Använd semantic color names
- Konsistent spacing mellan element

### DON'T ❌

- Hårdkoda färger eller mått
- Blanda olika spacing scales
- Skapa custom components utan att följa patterns
- Ignorera hover/focus states
- Använda inline styles för layout

## 📦 Filstruktur

```
src/
├── styles/
│   ├── tokens.css      # Design tokens (variabler)
│   └── theme.css       # Gemensamma stilar & utilities
└── components/
    └── ui/
        ├── button.js
        ├── input.js
        ├── select.js
        ├── textarea.js
        ├── checkbox.js
        ├── heading.js
        ├── card.js
        └── index.js
```

## 🔄 Uppdatera Design System

1. **Lägg till nya tokens** i `tokens.css`
2. **Dokumentera** i denna fil
3. **Uppdatera komponenter** att använda nya tokens
4. **Testa** i alla komponenter
5. **Committa** med beskrivande meddelande
