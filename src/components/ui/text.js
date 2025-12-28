import { LitElement, html, css } from "lit";

/**
 * Text Component - Standardized text styles
 * @property {String} variant - Text style variant
 * @property {String} color - Text color variant
 * @property {String} align - Text alignment
 * @property {Boolean} bold - Bold text
 * @property {String} as - HTML element to render as
 */
export class HenryText extends LitElement {
  static properties = {
    variant: { type: String },
    color: { type: String },
    align: { type: String },
    bold: { type: Boolean },
    as: { type: String },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    /* Heading variants */
    .heading-1 {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
      font-family: var(--font-family-base);
      color: var(--color-primary-500);
      margin: 0;
    }

    .heading-2 {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
      font-family: var(--font-family-base);
      color: var(--color-primary-500);
      margin: 0;
    }

    .heading-3 {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      line-height: var(--line-height-snug);
      font-family: var(--font-family-base);
      color: var(--color-primary-500);
      margin: 0;
    }

    .heading-4 {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      line-height: var(--line-height-snug);
      font-family: var(--font-family-base);
      color: var(--color-primary-500);
      margin: 0;
    }

    /* Body variants */
    .body-large {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-normal);
      line-height: var(--line-height-normal);
      font-family: var(--font-family-serif);
      margin: 0;
    }

    .body {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-normal);
      line-height: var(--line-height-normal);
      font-family: var(--font-family-serif);
      margin: 0;
    }

    .body-small {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-normal);
      line-height: var(--line-height-normal);
      font-family: var(--font-family-base);
      margin: 0;
    }

    /* Special variants */
    .caption {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-normal);
      line-height: var(--line-height-snug);
      color: var(--color-text-secondary);
      font-family: var(--font-family-base);
      margin: 0;
    }

    .label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      line-height: var(--line-height-snug);
      font-family: var(--font-family-base);
      margin: 0;
    }

    /* Color modifiers */
    .color-primary {
      color: var(--color-text-primary);
    }

    .color-secondary {
      color: var(--color-text-secondary);
    }

    .color-disabled {
      color: var(--color-text-disabled);
    }

    .color-danger {
      color: var(--color-danger);
    }

    .color-success {
      color: var(--color-success);
    }

    /* Alignment */
    .align-left {
      text-align: left;
    }

    .align-center {
      text-align: center;
    }

    .align-right {
      text-align: right;
    }

    /* Bold modifier */
    .bold {
      font-weight: var(--font-weight-bold);
    }
  `;

  constructor() {
    super();
    this.variant = "body";
    this.color = "primary";
    this.align = "left";
    this.bold = false;
    this.as = null;
  }

  render() {
    const classes = [
      this.variant,
      `color-${this.color}`,
      `align-${this.align}`,
      this.bold ? "bold" : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Determine element type based on variant or 'as' prop
    const elementMap = {
      "heading-1": "h1",
      "heading-2": "h2",
      "heading-3": "h3",
      "heading-4": "h4",
      body: "p",
      "body-large": "p",
      "body-small": "p",
      caption: "span",
      label: "label",
    };

    const element = this.as || elementMap[this.variant] || "p";

    // Create element dynamically
    switch (element) {
      case "h1":
        return html`<h1 class="${classes}"><slot></slot></h1>`;
      case "h2":
        return html`<h2 class="${classes}"><slot></slot></h2>`;
      case "h3":
        return html`<h3 class="${classes}"><slot></slot></h3>`;
      case "h4":
        return html`<h4 class="${classes}"><slot></slot></h4>`;
      case "span":
        return html`<span class="${classes}"><slot></slot></span>`;
      case "label":
        return html`<label class="${classes}"><slot></slot></label>`;
      case "div":
        return html`<div class="${classes}"><slot></slot></div>`;
      default:
        return html`<p class="${classes}"><slot></slot></p>`;
    }
  }
}

customElements.define("henry-text", HenryText);
