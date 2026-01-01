import { css } from "lit";

export const teacherAvailabilityTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
    height: 100%;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    align-items: center;
    flex-wrap: wrap;
    min-height: var(--button-height-base);
  }

  .header-text {
    flex: 1;
    min-width: 260px;
    text-align: left;
  }

  .description {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    margin: var(--space-2) 0 0;
    line-height: var(--line-height-normal);
  }

  .header-actions {
    display: flex;
    flex-direction: row;
    gap: var(--space-2);
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
  }

  .header-buttons {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
    flex: 0 0 auto;
  }

  .save-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-primary-600);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .paint-status {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-align: right;
    max-width: 320px;
  }

  .layout-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .legend-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
    margin-bottom: 0;
  }

  .footer-legend {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .legend-chip {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
    padding: 4px 8px;
    border-radius: var(--radius-full);
    background: var(--color-gray-50);
    border: 1px solid var(--color-border);
    font-size: 0.7rem;
    color: var(--color-text-primary);
  }

  .select-chip {
    cursor: pointer;
  }

  .select-chip:focus-within {
    box-shadow: var(--input-focus-ring);
    border-color: var(--color-primary-500);
  }

  .select-label {
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  .select-chip select {
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding: 0;
    margin: 0;
    min-width: 150px;
  }

  .select-chip select:focus-visible {
    outline: none;
  }

  .legend-swatch {
    width: 16px;
    height: 12px;
    border-radius: 6px;
    border: 1px solid var(--color-border);
    background: var(--color-gray-200);
  }

  .legend-swatch--assigned {
    background: var(--color-success);
  }

  .legend-swatch--compatible {
    background: var(--color-info);
  }

  .legend-swatch--compatible-occupied {
    background: color-mix(
      in srgb,
      var(--color-info) 55%,
      var(--color-gray-300)
    );
  }

  .legend-swatch--unavailable {
    background: var(--color-danger);
  }

  .legend-swatch--course-unavailable {
    background: repeating-linear-gradient(
      135deg,
      var(--color-info) 0,
      var(--color-info) 8px,
      var(--color-danger-light) 8px,
      var(--color-danger-light) 16px
    );
  }

  .legend-swatch--partial-conflict {
    background: repeating-linear-gradient(
      135deg,
      var(--color-info-light) 0,
      var(--color-info-light) 8px,
      var(--color-danger-light) 8px,
      var(--color-danger-light) 16px
    );
  }

  .legend-swatch--assigned-course-unavailable {
    background: repeating-linear-gradient(
      135deg,
      var(--color-success) 0,
      var(--color-success) 8px,
      var(--color-danger-light) 8px,
      var(--color-danger-light) 16px
    );
  }

  .legend-swatch--assigned-partial-conflict {
    background: repeating-linear-gradient(
      135deg,
      var(--color-success-light) 0,
      var(--color-success-light) 8px,
      var(--color-danger-light) 8px,
      var(--color-danger-light) 16px
    );
  }

  .legend-swatch--partial-availability {
    background: repeating-linear-gradient(
      135deg,
      var(--color-info-light) 0,
      var(--color-info-light) 8px,
      var(--color-gray-50) 8px,
      var(--color-gray-50) 16px
    );
  }

  .legend-swatch--no-course-partial {
    background: repeating-linear-gradient(
      135deg,
      var(--color-gray-50) 0,
      var(--color-gray-50) 8px,
      var(--color-danger-light) 8px,
      var(--color-danger-light) 16px
    );
  }

  .legend-left {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
  }

  .legend-right {
    display: inline-flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    flex: 0 0 auto;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
