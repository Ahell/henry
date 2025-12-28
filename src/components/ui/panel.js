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
    fullHeight: { type: Boolean, attribute: "full-height" },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    :host([full-height]) {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }

    .panel {
      background: var(--color-surface);
      border: none;
      border-radius: 0;
      margin-bottom: var(--space-4);
      box-shadow: none;
      overflow: hidden;
    }

    :host([full-height]) .panel {
      height: 100%;
      display: flex;
      flex-direction: column;
      margin-bottom: 0;
      border-radius: var(--radius-lg);
    }

    .panel-header {
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-background);
      flex-shrink: 0;
    }

    .panel-header:empty {
      display: none;
    }

    .panel-content {
      padding: var(--space-6);
    }

    :host([full-height]) .panel-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
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
    this.fullHeight = false;
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
