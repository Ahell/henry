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
    const hardRules = scheduling?.hardRules || [];
    const softRules = scheduling?.softRules || [];

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
              disabled
              @switch-change=${(e) =>
                this._updateSchedulingParam("futureOnlyReplan", e.detail.checked)}
            ></henry-switch>
          </div>
          <div class="row">
            <henry-input
              id="maxStudentsHard"
              label="Max studenter per kurs (hard)"
              type="number"
              min="1"
              .value=${String(params.maxStudentsHard ?? "")}
              required
              @input-change=${(e) =>
                this._updateSchedulingParam("maxStudentsHard", e.detail.value)}
            ></henry-input>
            <henry-input
              id="maxStudentsPreferred"
              label="Max studenter per kurs (preferred)"
              type="number"
              min="1"
              .value=${String(params.maxStudentsPreferred ?? "")}
              required
              @input-change=${(e) =>
                this._updateSchedulingParam("maxStudentsPreferred", e.detail.value)}
            ></henry-input>
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
            <henry-text variant="heading-3">Hard rules</henry-text>
          </div>
          <div class="rule-list">
            ${hardRules.map((r, idx) =>
              this._renderRuleRow(r, idx, "hard", hardRules.length)
            )}
          </div>
        </henry-panel>

        <henry-panel>
          <div slot="header">
            <henry-text variant="heading-3">Soft rules (prioritet)</henry-text>
          </div>
          <div class="rule-list">
            ${softRules.map((r, idx) =>
              this._renderRuleRow(r, idx, "soft", softRules.length)
            )}
          </div>
        </henry-panel>
      </div>
    `;
  }

  _renderRuleRow(rule, idx, kind, listLength) {
    const isLocked = Boolean(rule?.locked);
    const isEnabled = Boolean(rule?.enabled);
    const isLast = idx === (Number(listLength) || 0) - 1;
    return html`
      <div class="rule ${!isEnabled ? "muted" : ""}">
        <div>
          <div class="rule-title">${rule?.label || rule?.id}</div>
          <div class="rule-desc">${rule?.description || ""}</div>
        </div>
        <div class="rule-actions">
          <henry-switch
            label="Aktiv"
            .checked=${isEnabled}
            ?disabled=${isLocked}
            @switch-change=${(e) =>
              this._toggleRule(kind, rule?.id, e.detail.checked)}
          ></henry-switch>
          <henry-button
            variant="secondary"
            ?disabled=${idx === 0}
            @click=${() => this._moveRule(kind, idx, -1)}
            >Upp</henry-button
          >
          <henry-button
            variant="secondary"
            ?disabled=${isLast}
            @click=${() => this._moveRule(kind, idx, +1)}
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

  _toggleRule(kind, ruleId, enabled) {
    if (!ruleId) return;
    const current = store.businessLogicManager.getBusinessLogic();
    const scheduling = current?.scheduling || {};
    const listKey = kind === "hard" ? "hardRules" : "softRules";
    const list = Array.isArray(scheduling[listKey]) ? scheduling[listKey] : [];

    const next = list.map((r) =>
      r?.id === ruleId ? { ...r, enabled: Boolean(enabled) } : r
    );

    store.businessLogicManager.setBusinessLogic({
      ...current,
      scheduling: {
        ...scheduling,
        [listKey]: next,
      },
    });
  }

  _moveRule(kind, idx, delta) {
    const current = store.businessLogicManager.getBusinessLogic();
    const scheduling = current?.scheduling || {};
    const listKey = kind === "hard" ? "hardRules" : "softRules";
    const list = Array.isArray(scheduling[listKey])
      ? scheduling[listKey].slice()
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
        [listKey]: list,
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
