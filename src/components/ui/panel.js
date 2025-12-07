import { LitElement, html, css } from "lit";

/**
 * HenryPanel - Consistent panel container component
 *
 * Usage:
 * <henry-panel>
 *   <div slot="header">
 *     <henry-text variant="heading-3">Panel Title</henry-text>
 *   </div>
 *   <p>Panel content goes here...</p>
 * </henry-panel>
 *
 * Properties:
 * - noPadding: boolean - Remove default padding from content area
 * - noHeader: boolean - Hide header slot entirely
 */
export class HenryPanel extends LitElement {
  static properties = {
    noPadding: { type: Boolean },
    noHeader: { type: Boolean },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    .panel {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .panel-header {
      padding: var(--space-6);
      padding-bottom: var(--space-3);
      border-bottom: 2px solid var(--color-border);
    }

    .panel-header:empty {
      display: none;
    }

    .panel-content {
      padding: var(--space-6);
    }

    :host([noPadding]) .panel-content {
      padding: 0;
    }

    :host([noHeader]) .panel-header {
      display: none;
    }
  `;

  constructor() {
    super();
    this.noPadding = false;
    this.noHeader = false;
  }

  render() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <slot name="header"></slot>
        </div>
        <div class="panel-content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

customElements.define("henry-panel", HenryPanel);
