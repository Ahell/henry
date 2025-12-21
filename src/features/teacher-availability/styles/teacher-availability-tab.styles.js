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
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-gray-50);
    border: 1px solid var(--color-border);
    font-size: var(--font-size-sm);
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
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
    background: var(--color-gray-200);
  }

  .legend-swatch--assigned {
    background: linear-gradient(
      135deg,
      var(--color-success),
      var(--color-success-hover)
    );
  }

  .legend-swatch--compatible {
    background: linear-gradient(
      135deg,
      var(--color-info),
      var(--color-info-hover)
    );
  }

  .legend-swatch--compatible-occupied {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-info), #64748b 48%),
      color-mix(in srgb, var(--color-info-hover), #64748b 48%)
    );
  }

  .legend-swatch--unavailable {
    background: var(--color-danger);
  }

  .legend-swatch--course-unavailable {
    background: repeating-linear-gradient(
        135deg,
        rgba(239, 68, 68, 0.82) 0px,
        rgba(239, 68, 68, 0.82) 8px,
        rgba(239, 68, 68, 0) 8px,
        rgba(239, 68, 68, 0) 16px
      ),
      linear-gradient(135deg, var(--color-info), var(--color-info-hover));
  }

  .legend-swatch--partial-conflict {
    background: repeating-linear-gradient(
        135deg,
        rgba(239, 68, 68, 0.28) 0px,
        rgba(239, 68, 68, 0.28) 8px,
        rgba(239, 68, 68, 0) 8px,
        rgba(239, 68, 68, 0) 16px
      ),
      linear-gradient(135deg, var(--color-info), var(--color-info-hover));
  }

  .legend-swatch--partial-availability {
    background: repeating-linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.28) 0px,
        rgba(59, 130, 246, 0.28) 8px,
        rgba(59, 130, 246, 0) 8px,
        rgba(59, 130, 246, 0) 16px
      ),
      linear-gradient(135deg, var(--color-info), var(--color-info-hover));
  }

  .legend-swatch--no-course-partial {
    border-color: rgba(239, 68, 68, 0.22);
    background: repeating-linear-gradient(
        135deg,
        rgba(239, 68, 68, 0.22) 0px,
        rgba(239, 68, 68, 0.22) 8px,
        transparent 8px,
        transparent 16px
      ),
      #ffffff;
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
