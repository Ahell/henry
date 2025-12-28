import { css } from "lit";

export const teacherAvailabilityTabStyles = css`
  @import url("/src/styles/tokens.css");

  :host {
    display: block;
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
  }

  .legend-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
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
    background: color-mix(
      in srgb,
      var(--color-info) 70%,
      var(--color-danger-light)
    );
    border-color: var(--color-danger);
  }

  .legend-swatch--partial-conflict {
    background: color-mix(
      in srgb,
      var(--color-info-light) 70%,
      var(--color-danger-light)
    );
    border-color: var(--color-danger);
    border-style: dashed;
  }

  .legend-swatch--assigned-course-unavailable {
    background: color-mix(
      in srgb,
      var(--color-success) 70%,
      var(--color-danger-light)
    );
    border-color: var(--color-danger);
  }

  .legend-swatch--assigned-partial-conflict {
    background: color-mix(
      in srgb,
      var(--color-success-light) 70%,
      var(--color-danger-light)
    );
    border-color: var(--color-danger);
    border-style: dashed;
  }

  .legend-swatch--partial-availability {
    background: var(--color-info-light);
    border-color: var(--color-info);
    border-style: dashed;
  }

  .legend-swatch--no-course-partial {
    border-color: var(--color-danger-light);
    border-style: dashed;
    background: var(--color-gray-50);
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
`;
