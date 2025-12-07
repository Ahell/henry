import { LitElement, html, css } from "lit";

/**
 * Primary Heading Component
 * @property {String} level - Heading level (h1, h2, h3, h4, h5, h6)
 * @property {String} align - Text alignment (left, center, right)
 */
export class HenryHeading extends LitElement {
  static properties = {
    level: { type: String },
    align: { type: String },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 0;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
    }

    h1 {
      font-size: var(--font-size-3xl);
      margin-bottom: var(--space-6);
    }

    h2 {
      font-size: var(--font-size-2xl);
      margin-bottom: var(--space-5);
    }

    h3 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--space-4);
    }

    h4 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--space-3);
    }

    h5 {
      font-size: var(--font-size-base);
      margin-bottom: var(--space-2);
    }

    h6 {
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-2);
    }

    .left {
      text-align: left;
    }
    .center {
      text-align: center;
    }
    .right {
      text-align: right;
    }
  `;

  constructor() {
    super();
    this.level = "h2";
    this.align = "left";
  }

  render() {
    const HeadingTag = this.level;
    return html`
      <${HeadingTag} class="${this.align}">
        <slot></slot>
      </${HeadingTag}>
    `;
  }
}

customElements.define("henry-heading", HenryHeading);
