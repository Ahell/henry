import { css } from "lit";

export const importExportStyles = css`
  :host {
    display: block;
    padding: var(--space-4);
  }

  .panel {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: var(--space-6);
    margin-bottom: var(--space-6);
  }

  h3 {
    margin-top: 0;
    color: var(--color-text-primary);
  }

  .button-group {
    display: flex;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  button {
    background-color: var(--color-primary-500);
    color: var(--color-text-light);
    border: none;
    padding: var(--space-3) var(--space-6);
    border-radius: var(--radius-base);
    cursor: pointer;
    font-family: var(--font-family-base);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: var(--transition-base);
  }

  button:hover {
    background-color: var(--color-primary-600);
  }

  button.secondary {
    background-color: var(--color-gray);
    color: var(--color-white);
  }

  button.secondary:hover {
    background-color: var(--color-gray-dark);
  }

  button.danger {
    background-color: var(--color-danger);
    color: var(--color-white);
  }

  button.danger:hover {
    background-color: var(--color-red-dark);
  }

  input[type="file"] {
    display: none;
  }

  .message {
    padding: var(--space-4);
    border-radius: var(--radius-base);
    margin-bottom: var(--space-4);
    font-size: var(--font-size-sm);
  }

  .message.success {
    background-color: var(--color-success-bg);
    border: 1px solid var(--color-success);
    color: var(--color-success-text);
  }

  .message.error {
    background-color: var(--color-danger-bg);
    border: 1px solid var(--color-danger);
    color: var(--color-danger-text);
  }

  .data-preview {
    background-color: var(--color-broken-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--space-4);
    margin-top: var(--space-4);
    max-height: 400px;
    overflow-y: auto;
  }

  .data-preview pre {
    margin: 0;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    line-height: var(--line-height-normal);
  }
`;