import { LitElement, html, css } from "lit";

/**
 * Henry Modal Component
 * Modal dialog for forms and content
 *
 * @property {Boolean} open - Whether modal is visible
 * @property {String} title - Modal header title
 * @property {Boolean} closeOnBackdrop - Close when clicking backdrop (default: true)
 * @fires close - Emitted when modal closes
 */
export class HenryModal extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    title: { type: String },
    closeOnBackdrop: { type: Boolean },
  };

  static styles = css`
    :host {
      display: none;
    }

    :host([open]) {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
    }

    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--color-overlay);
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--color-background);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease-out;
      min-width: 500px;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate(-50%, -45%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

	    .modal-header {
	      display: flex;
	      justify-content: flex-start;
	      align-items: center;
	      padding: var(--space-6);
	      border-bottom: 1px solid var(--color-border);
	      gap: var(--space-4);
	    }

    .modal-title {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

	    .modal-body {
	      padding: var(--space-6);
	      overflow-y: auto;
	      flex: 1;
	    }

    .modal-footer {
      padding: var(--space-6);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }
  `;

  constructor() {
    super();
    this.open = false;
    this.title = "";
    this.closeOnBackdrop = true;
  }

  render() {
    if (!this.open) return html``;

    return html`
      <div class="backdrop" @click="${this._handleBackdropClick}"></div>
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
	        <div class="modal-header">
	          <h2 class="modal-title" id="modal-title">${this.title}</h2>
	        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }

  _handleBackdropClick() {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  close() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  show() {
    this.open = true;
  }
}

customElements.define("henry-modal", HenryModal);
