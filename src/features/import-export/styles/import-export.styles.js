import { css } from "lit";

export const importExportStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .layout-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    flex: 1;
    min-height: 0;
  }

  henry-panel {
    flex: 1;
    min-height: 0;
  }

  .tab-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .tab-scroll {
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: auto;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Mimics the 'grayer background' container from Report (.filters) */
  .section-card {
    background: var(--color-broken-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .section-card:last-child {
    margin-bottom: 0;
  }

  p {
    margin-top: 0;
    margin-bottom: var(--space-4);
    color: var(--color-text-secondary);
    font-family: var(--font-family-base);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
  }

  .button-group {
    display: flex;
    gap: var(--space-4);
    align-items: center;
  }

  .message {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-base);
    margin-bottom: var(--space-4);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-base);
    display: flex;
    align-items: center;
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

  .preview-section {
    margin-top: var(--space-4);
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-4);
  }

  .data-preview {
    background-color: var(--color-white); /* White background for code inside the gray card */
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--space-4);
    max-height: 400px;
    overflow-y: auto;
    margin-top: var(--space-2);
  }

  .data-preview pre {
    margin: 0;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    line-height: var(--line-height-normal);
    color: var(--color-text-primary);
  }
`;
