import { LitElement, html, css } from 'lit';

/**
 * Primary Heading Component
 * @property {String} level - Heading level (h1, h2, h3, h4, h5, h6)
 * @property {String} align - Text alignment (left, center, right)
 */
export class HenryHeading extends LitElement {
  static properties = {
    level: { type: String },
    align: { type: String }
  };

  static styles = css`
    :host {
      display: block;
    }

    h1, h2, h3, h4, h5, h6 {
      margin: 0;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.3;
    }

    h1 {
      font-size: 32px;
      margin-bottom: 24px;
    }

    h2 {
      font-size: 24px;
      margin-bottom: 20px;
    }

    h3 {
      font-size: 20px;
      margin-bottom: 16px;
    }

    h4 {
      font-size: 18px;
      margin-bottom: 12px;
    }

    h5 {
      font-size: 16px;
      margin-bottom: 10px;
    }

    h6 {
      font-size: 14px;
      margin-bottom: 8px;
    }

    .left { text-align: left; }
    .center { text-align: center; }
    .right { text-align: right; }
  `;

  constructor() {
    super();
    this.level = 'h2';
    this.align = 'left';
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

customElements.define('henry-heading', HenryHeading);
