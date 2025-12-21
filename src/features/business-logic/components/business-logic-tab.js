import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { subscribeToStore } from "../../admin/utils/admin-helpers.js";
import "../../../components/ui/index.js";
import { businessLogicTabStyles } from "../styles/business-logic-tab.styles.js";

export class BusinessLogicTab extends LitElement {
  static styles = businessLogicTabStyles;

  static properties = {
    formValid: { type: Boolean },
    message: { type: String },
    messageType: { type: String },
    saving: { type: Boolean },
    isEditing: { type: Boolean },
  };

  constructor() {
    super();
    this.formValid = true;
    this.message = "";
    this.messageType = "";
    this.saving = false;
    this.isEditing = !!store.editMode;
    this._autoSaveTimer = null;
    this._saveGeneration = 0;
    this._lastScheduledSaveGeneration = 0;
    subscribeToStore(this);
    store.subscribe(() => {
      const next = !!store.editMode;
      if (this.isEditing !== next) this.setEditMode(next);
    });
  }

  firstUpdated() {
    this._updateFormValidity();
  }

  disconnectedCallback() {
    super.disconnectedCallback && super.disconnectedCallback();
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  }

  _updateFormValidity() {
    // Simpler than scanning the DOM: validate the two numeric params directly.
    const businessLogic = store.businessLogicManager.getBusinessLogic();
    const params = businessLogic?.scheduling?.params || {};
    const hard = Number(params.maxStudentsHard);
    const preferred = Number(params.maxStudentsPreferred);
    this.formValid =
      Number.isFinite(hard) &&
      hard > 0 &&
      Number.isFinite(preferred) &&
      preferred > 0;
  }

  _scheduleAutoSave() {
    if (store.isReconciling) return;
    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);

    const generation = (this._saveGeneration += 1);
    this._lastScheduledSaveGeneration = generation;

    this._autoSaveTimer = setTimeout(async () => {
      if (store.isReconciling) return;
      // Don’t persist invalid params. Keep UI state; user can correct.
      this._updateFormValidity();
      if (!this.formValid) return;

      const myGen = generation;
      this.saving = true;
      this.requestUpdate();

      try {
        await store.saveData({ label: "auto-save-business-logic" });
        // Clear any previous error message on successful save.
        if (this.messageType === "error") {
          this.message = "";
          this.messageType = "";
        }
      } catch (error) {
        this.message = `Kunde inte spara affärslogik: ${error.message}`;
        this.messageType = "error";
        this.requestUpdate();
        setTimeout(() => {
          if (this.messageType === "error") {
            this.message = "";
            this.messageType = "";
            this.requestUpdate();
          }
        }, 6000);
      } finally {
        if (myGen === this._lastScheduledSaveGeneration) {
          this.saving = false;
          this.requestUpdate();
        }
      }
    }, 400);
  }

  render() {
    const businessLogic = store.businessLogicManager.getBusinessLogic();
    const scheduling = businessLogic?.scheduling || {};
    const rules = scheduling?.rules || [];

    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

      <henry-panel>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3"
            >Affärslogik - Prioriteringsordning för auto-fyll</henry-text
          >
          <div class="header-actions">
            ${this.saving
              ? html`<henry-text variant="caption">Sparar…</henry-text>`
              : ""}
          </div>
        </div>
        <div class="rule-list">
          ${rules.map((r, idx) => this._renderRuleRow(r, idx, rules.length))}
        </div>
      </henry-panel>
    `;
  }

  _handleEditClick(e) {
    const next =
      typeof e?.detail?.checked === "boolean"
        ? !!e.detail.checked
        : !this.isEditing;
    this.setEditMode(next);
  }

  setEditMode(enabled) {
    const next = !!enabled;
    if (this.isEditing === next) return;
    this.isEditing = next;
  }

  _renderRuleRow(rule, idx, listLength) {
    const params =
      store.businessLogicManager.getBusinessLogic()?.scheduling?.params || {};
    const isEnabled = Boolean(rule?.enabled);
    const isHard = String(rule?.kind || "soft").toLowerCase() === "hard";
    const isLast = idx === (Number(listLength) || 0) - 1;
    const ruleId = rule?.id;
    const disabled = !this.isEditing;

    const renderRuleParamInput = () => {
      if (ruleId === "maxStudentsHard") {
        return html`
          <henry-input
            id="maxStudentsHard"
            placeholder="Hard cap"
            type="number"
            min="1"
            style="width: 110px;"
            .value=${String(params.maxStudentsHard ?? "")}
            required
            ?disabled=${disabled}
            @input-change=${(e) =>
              this._updateSchedulingParam("maxStudentsHard", e.detail.value)}
          ></henry-input>
        `;
      }

      if (ruleId === "avoidOverPreferred") {
        return html`
          <henry-input
            id="maxStudentsPreferred"
            placeholder="Preferred cap"
            type="number"
            min="1"
            style="width: 110px;"
            .value=${String(params.maxStudentsPreferred ?? "")}
            required
            ?disabled=${disabled}
            @input-change=${(e) =>
              this._updateSchedulingParam(
                "maxStudentsPreferred",
                e.detail.value
              )}
          ></henry-input>
        `;
      }

      return "";
    };

    return html`
      <div class="rule ${!isEnabled ? "muted" : ""}">
        <div>
          <div class="rule-title">${rule?.label || rule?.id}</div>
          <div class="rule-desc">${rule?.description || ""}</div>
        </div>
        <div class="rule-actions">
          ${renderRuleParamInput()}
          <henry-switch
            label="Aktiv"
            .checked=${isEnabled}
            ?disabled=${disabled}
            @switch-change=${(e) => this._toggleRule(ruleId, e.detail.checked)}
          ></henry-switch>
          <henry-switch
            label="Hard"
            .checked=${isHard}
            ?disabled=${disabled}
            @switch-change=${(e) =>
              this._setRuleKind(ruleId, e.detail.checked ? "hard" : "soft")}
          ></henry-switch>
          <henry-button
            variant="secondary"
            ?disabled=${disabled || idx === 0}
            @click=${() => this._moveRule(idx, -1)}
            >Upp</henry-button
          >
          <henry-button
            variant="secondary"
            ?disabled=${disabled || isLast}
            @click=${() => this._moveRule(idx, +1)}
            >Ner</henry-button
          >
        </div>
      </div>
    `;
  }

  _updateSchedulingParam(key, value) {
    if (!this.isEditing) return;
    const current = store.businessLogicManager.getBusinessLogic();
    const scheduling = current?.scheduling || {};
    const params = { ...(scheduling?.params || {}) };

    const n = Number(value);
    params[key] = Number.isFinite(n) ? n : value;

    store.businessLogicManager.setBusinessLogic({
      ...current,
      scheduling: {
        ...scheduling,
        params,
      },
    });
    this._updateFormValidity();
    this._scheduleAutoSave();
  }

  _toggleRule(ruleId, enabled) {
    if (!this.isEditing) return;
    if (!ruleId) return;
    const current = store.businessLogicManager.getBusinessLogic();
    const scheduling = current?.scheduling || {};
    const rules = Array.isArray(scheduling.rules) ? scheduling.rules : [];

    const next = rules.map((r) =>
      r?.id === ruleId ? { ...r, enabled: Boolean(enabled) } : r
    );

    store.businessLogicManager.setBusinessLogic({
      ...current,
      scheduling: {
        ...scheduling,
        rules: next,
      },
    });
    this._scheduleAutoSave();
  }

  _setRuleKind(ruleId, kind) {
    if (!this.isEditing) return;
    if (!ruleId) return;
    const current = store.businessLogicManager.getBusinessLogic();
    const scheduling = current?.scheduling || {};
    const rules = Array.isArray(scheduling.rules) ? scheduling.rules : [];
    const normalizedKind =
      String(kind).toLowerCase() === "hard" ? "hard" : "soft";

    const next = rules.map((r) =>
      r?.id === ruleId ? { ...r, kind: normalizedKind } : r
    );

    store.businessLogicManager.setBusinessLogic({
      ...current,
      scheduling: {
        ...scheduling,
        rules: next,
      },
    });
    this._scheduleAutoSave();
  }

  _moveRule(idx, delta) {
    if (!this.isEditing) return;
    const current = store.businessLogicManager.getBusinessLogic();
    const scheduling = current?.scheduling || {};
    const list = Array.isArray(scheduling.rules)
      ? scheduling.rules.slice()
      : [];

    const targetIdx = idx + delta;
    if (idx < 0 || idx >= list.length) return;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const [item] = list.splice(idx, 1);
    list.splice(targetIdx, 0, item);

    store.businessLogicManager.setBusinessLogic({
      ...current,
      scheduling: {
        ...scheduling,
        rules: list,
      },
    });
    this._scheduleAutoSave();
  }
}

customElements.define("business-logic-tab", BusinessLogicTab);
