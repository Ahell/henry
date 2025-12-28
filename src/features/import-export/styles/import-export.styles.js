import { css } from "lit";

export const importExportStyles = css`
  :host {
    display: block;
    padding: 1rem;
  }

  .panel {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  h3 {
    margin-top: 0;
    color: #333;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
  }

  button:hover {
    background: #0056b3;
  }

  button.secondary {
    background: #6c757d;
  }

  button.secondary:hover {
    background: #5a6268;
  }

  button.danger {
    background: #dc3545;
  }

  button.danger:hover {
    background: #c82333;
  }

  input[type="file"] {
    display: none;
  }

  .message {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .message.success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }

  .message.error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }

  .data-preview {
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    margin-top: 1rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .data-preview pre {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.4;
  }
`;
