import { css } from "lit";

export const businessLogicTabStyles = css`
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
  }

  .rule-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .rule {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    padding: 0.75rem;
    border: 1px solid #e6e9ef;
    background: #fff;
  }

  .rule-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .rule-desc {
    color: #5f6b7a;
    font-size: 0.9rem;
    line-height: 1.2rem;
  }

  .rule-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .rule-actions henry-input {
    margin-bottom: 0;
  }

  .muted {
    opacity: 0.7;
  }
`;
