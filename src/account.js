import { LitElement, html, css } from 'lit';

class AccountPanel extends LitElement {
  static properties = { user: {}, loginOnly: { type: Boolean }, message: { state: true }, busy: { state: true }, users: { state: true }, expanded: { state: true } };
  static styles = css`
    :host {
      display: block;
      font-family: var(--font-family-base, system-ui, sans-serif);
      font-size: 14px;
      line-height: 1.5;
      color: var(--color-text-primary, #212121);
    }
    * { box-sizing: border-box; }
    .card {
      max-width: 440px;
      margin: 70px auto;
      padding: 28px;
      background: #fff;
      border: 1px solid var(--color-gray-light, #e6e6e6);
      border-radius: var(--radius-md, 8px);
    }
    .bar {
      margin-top: 16px;
      padding: 16px 0 0;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      color: #fff;
    }
    .account-label {
      display: block;
      padding: 0 8px;
      margin-bottom: 8px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .account-actions {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    form { margin: 20px 0; }
    label { display: block; margin: 12px 0; }
    input {
      display: block;
      width: 100%;
      margin-top: 5px;
      padding: 10px;
      border: 1px solid var(--color-gray-light, #e6e6e6);
      border-radius: var(--radius-md, 8px);
      font: inherit;
      background: #fff;
      color: var(--color-text-primary, #212121);
    }
    button {
      padding: 9px 14px;
      border: 0;
      border-radius: var(--radius-md, 8px);
      background: var(--color-kth-blue, #004791);
      color: #fff;
      font: inherit;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    button:hover { background: var(--color-navy, #000061); }
    button:focus-visible, input:focus-visible {
      outline: 2px solid var(--color-sky-blue, #6298d2);
      outline-offset: 3px;
    }
    button:disabled { opacity: 0.5; cursor: default; }
    .account-actions button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 10px 12px;
      border: none;
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      background: transparent;
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: left;
    }
    .account-actions button:hover,
    .account-actions button[aria-expanded="true"] {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    .account-actions button:focus-visible { outline-color: #fff; }
    p { white-space: pre-wrap; }
    dialog {
      width: min(600px, calc(100vw - 32px));
      max-height: calc(100dvh - 48px);
      padding: 0;
      border: 1px solid var(--color-gray-light, #e6e6e6);
      border-radius: var(--radius-lg, 12px);
      background: #fff;
      color: var(--color-text-primary, #212121);
      box-shadow: var(--shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.25));
      overflow: auto;
    }
    dialog::backdrop { background: rgba(15, 23, 42, 0.45); }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-gray-light, #e6e6e6);
    }
    .modal-header h2 { margin: 0; font-size: 1.2rem; }
    .close-button {
      background: transparent;
      color: var(--color-text-primary, #212121);
      font-size: 1.5rem;
      padding: 2px 10px;
    }
    .close-button:hover { background: var(--color-gray-light, #e6e6e6); }
    .settings { padding: 0 24px 20px; }
    h1 { font-size: 1.5rem; color: var(--color-kth-blue, #004791); }
    h2 { font-size: 1rem; }
    h3 { font-size: 0.9rem; }
    .user { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 10px 0; }
    .user span { overflow-wrap: anywhere; min-width: 0; }
    .note { font-size: 12px; color: var(--color-gray-dark, #323232); }
    @media (max-width: 500px) {
      .card { margin: 24px 16px; padding: 24px; }
    }
  `;

  constructor() { super(); this.message = ''; this.busy = false; this.users = []; this.expanded = false; }
  async openAccount() {
    this.expanded = true;
    this.message = '';
    await this.updateComplete;
    const dialog = this.renderRoot.querySelector('dialog');
    if (!dialog.open) dialog.showModal();
    await this.loadUsers();
  }
  closeAccount() {
    this.renderRoot.querySelector('dialog')?.close();
  }
  accountClosed() {
    this.expanded = false;
    this.message = '';
    this.renderRoot.querySelector('.account-actions button')?.focus();
  }
  async request(url, body, method = 'POST') {
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Anropet misslyckades.');
    return result;
  }
  async submit(event, action) {
    event.preventDefault();
    if (this.busy) return;
    this.busy = true;
    const fields = Object.fromEntries(new FormData(event.target));
    try {
      if (action === 'login') { await this.request('/api/auth/login', fields); location.reload(); }
      if (action === 'password') { await this.request('/api/auth/password', fields); location.reload(); }
      if (action === 'create') { await this.request('/api/accounts/users', fields); event.target.reset(); await this.loadUsers(); this.message = 'Kontot skapades. Lämna lösenordet till användaren via en privat kanal.'; }
    } catch (error) { this.message = error.message; }
    finally { this.busy = false; }
  }
  async loadUsers() {
    if (this.user?.role === 'admin') {
      try { this.users = (await this.request('/api/accounts/users', null, 'GET')).users; }
      catch (error) { this.message = error.message; }
    }
  }
  async toggleUser(user) {
    try { await this.request(`/api/accounts/users/${user.id}`, { disabled: !user.disabled }, 'PATCH'); await this.loadUsers(); }
    catch (error) { this.message = error.message; }
  }
  render() {
    if (this.loginOnly) return html`<section class="card"><h1>FEI Kursplanerare</h1><p>Logga in till din arbetsyta.</p><form @submit=${event => this.submit(event, 'login')}><label>Användarnamn<input name="username" autocomplete="username" required maxlength="80"></label><label>Lösenord<input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button ?disabled=${this.busy}>Logga in</button></form><p role="status">${this.message}</p></section>`;
    return html`<div class="bar"><span class="account-label">Konto</span><div class="account-actions"><button aria-haspopup="dialog" aria-expanded=${this.expanded} aria-controls="account-settings" @click=${this.openAccount}>Ändra konto</button><button @click=${async () => { try { await this.request('/api/auth/logout'); location.reload(); } catch (error) { this.message = error.message; } }}>Logga ut</button></div></div>${this.expanded ? html`<dialog id="account-settings" aria-labelledby="account-title" @close=${this.accountClosed} @click=${event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) this.closeAccount(); } }}><header class="modal-header"><h2 id="account-title">Mitt konto</h2><button class="close-button" aria-label="Stäng kontoinställningar" autofocus @click=${this.closeAccount}>×</button></header><section class="settings"><form @submit=${event => this.submit(event, 'password')}><label>Nuvarande lösenord<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>Nytt lösenord, minst 12 tecken<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="256" required></label><button ?disabled=${this.busy}>Byt lösenord och logga ut</button></form>
    ${this.user?.role === 'admin' ? html`<h2>Användare</h2><p class="note">Inloggade användare arbetar i den gemensamma kursplaneringen. Administratörer hanterar konton.</p>${this.users.map(user => html`<div class="user"><span>${user.username} · ${user.disabled ? 'Spärrad' : user.role}</span>${user.role !== 'admin' ? html`<button @click=${() => this.toggleUser(user)}>${user.disabled ? 'Aktivera' : 'Spärra'}</button>` : ''}</div>`)}<form @submit=${event => this.submit(event, 'create')}><h3>Skapa konto</h3><label>Användarnamn<input name="username" autocomplete="off" minlength="3" maxlength="80" required></label><label>Tillfälligt lösenord<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="256" required></label><button ?disabled=${this.busy}>Skapa personligt konto</button></form>` : ''}<p role="status">${this.message}</p></section></dialog>` : ''}`;
  }
}
customElements.define('account-panel', AccountPanel);
