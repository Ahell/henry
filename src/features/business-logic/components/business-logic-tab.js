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
  };

  constructor() {
    super();
    this.formValid = true;
    this.message = "";
    this.messageType = "";
    this.saving = false;
    subscribeToStore(this);
  }

  firstUpdated() {
    this._updateFormValidity();
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

  render() {
    const businessLogic = store.businessLogicManager.getBusinessLogic();
    const scheduling = businessLogic?.scheduling || {};
    const params = scheduling?.params || {};
    const rules = scheduling?.rules || [];

    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

      <div class="grid">
        <henry-panel>
          <div slot="header">
            <henry-text variant="heading-3">Affärslogik</henry-text>
          </div>
          <div class="row">
            <henry-switch
              label="Optimera endast efter idag"
              .checked=${Boolean(params.futureOnlyReplan)}
              @switch-change=${(e) =>
                this._updateSchedulingParam("futureOnlyReplan", e.detail.checked)}
            ></henry-switch>
          </div>
          <div class="row">
            <henry-button
              variant="primary"
              ?disabled=${!this.formValid || this.saving}
              @click=${this._handleSaveClick}
              >Spara affärslogik</henry-button
            >
          </div>
        </henry-panel>

        <henry-panel>
          <div slot="header">
            <henry-text variant="heading-3">Regler</henry-text>
          </div>
          <div class="rule-list">
            ${rules.map((r, idx) =>
              this._renderRuleRow(r, idx, rules.length)
            )}
          </div>
        </henry-panel>
      </div>
    `;
  }

  _renderRuleRow(rule, idx, listLength) {
    const params = store.businessLogicManager.getBusinessLogic()?.scheduling?.params || {};
    const isEnabled = Boolean(rule?.enabled);
    const isHard = String(rule?.kind || "soft").toLowerCase() === "hard";
    const isLast = idx === (Number(listLength) || 0) - 1;
    const ruleId = rule?.id;

    const renderRuleParamInput = () => {
      if (ruleId === "maxStudentsHard") {
        return html`
          <henry-input
            id="maxStudentsHard"
            placeholder="Hard cap"
            type="number"
            min="1"
            style="width: 120px;"
            .value=${String(params.maxStudentsHard ?? "")}
            required
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
            style="width: 140px;"
            .value=${String(params.maxStudentsPreferred ?? "")}
            required
            @input-change=${(e) =>
              this._updateSchedulingParam("maxStudentsPreferred", e.detail.value)}
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
            @switch-change=${(e) =>
              this._toggleRule(ruleId, e.detail.checked)}
          ></henry-switch>
          <henry-switch
            label="Hard"
            .checked=${isHard}
            @switch-change=${(e) =>
              this._setRuleKind(ruleId, e.detail.checked ? "hard" : "soft")}
          ></henry-switch>
          <henry-button
            variant="secondary"
            ?disabled=${idx === 0}
            @click=${() => this._moveRule(idx, -1)}
            >Upp</henry-button
          >
          <henry-button
            variant="secondary"
            ?disabled=${isLast}
            @click=${() => this._moveRule(idx, +1)}
            >Ner</henry-button
          >
        </div>
      </div>
    `;
  }

  _updateSchedulingParam(key, value) {
    const current = store.businessLogicManager.getBusinessLogic();
    const scheduling = current?.scheduling || {};
    const params = { ...(scheduling?.params || {}) };

    if (key === "futureOnlyReplan") {
      params.futureOnlyReplan = Boolean(value);
    } else {
      const n = Number(value);
      params[key] = Number.isFinite(n) ? n : value;
    }

    store.businessLogicManager.setBusinessLogic({
      ...current,
      scheduling: {
        ...scheduling,
        params,
      },
    });
    this._updateFormValidity();
  }

  _toggleRule(ruleId, enabled) {
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
  }

  _setRuleKind(ruleId, kind) {
    if (!ruleId) return;
    const current = store.businessLogicManager.getBusinessLogic();
    const scheduling = current?.scheduling || {};
    const rules = Array.isArray(scheduling.rules) ? scheduling.rules : [];
    const normalizedKind = String(kind).toLowerCase() === "hard" ? "hard" : "soft";

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
  }

  _moveRule(idx, delta) {
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
  }

  async _handleSaveClick() {
    this.saving = true;
    this.message = "";
    this.requestUpdate();

    const mutationId = store.applyOptimistic({
      label: "save-business-logic",
      rollback: null,
    });

    try {
      await store.saveData({ mutationId });
      this.message = "Affärslogik sparad!";
      this.messageType = "success";
    } catch (error) {
      this.message = `Kunde inte spara affärslogik: ${error.message}`;
      this.messageType = "error";
    } finally {
      this.saving = false;
      this.requestUpdate();
      setTimeout(() => {
        this.message = "";
        this.requestUpdate();
      }, 4000);
    }
  }
}

customElements.define("business-logic-tab", BusinessLogicTab);
