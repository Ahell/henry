import { LitElement, html, css } from 'lit';

class AccountPanel extends LitElement {
  static properties = { user: {}, loginOnly: { type: Boolean }, message: { state: true }, busy: { state: true }, users: { state: true }, expanded: { state: true } };
  static styles = css`
    :host{display:block;font:14px/1.5 system-ui;color:#24372f}.card{max-width:440px;margin:70px auto;padding:28px;background:white;border:1px solid #dfe4db;border-radius:12px}.bar{padding:12px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap}form{margin:20px 0}label{display:block;margin:12px 0}input{display:block;padding:10px;margin-top:5px;box-sizing:border-box;width:100%;border:1px solid #bbc8bd;border-radius:6px;font:inherit}button{padding:9px 14px;background:#285c46;color:white;border:0;border-radius:6px;cursor:pointer}button:disabled{opacity:.5}p{white-space:pre-wrap}.settings{padding:20px;background:white;border:1px solid #dfe4db;border-radius:10px;max-width:600px}.user{display:flex;gap:12px;align-items:center;margin:10px 0}.note{font-size:12px;color:#65756b}
  `;
  constructor() { super(); this.message = ''; this.busy = false; this.users = []; this.expanded = false; }
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
    return html`<div class="bar"><span>Inloggad som ${this.user?.username}</span><button @click=${async () => { this.expanded = !this.expanded; if (this.expanded) await this.loadUsers(); }}>Mitt konto</button><button @click=${async () => { try { await this.request('/api/auth/logout'); location.reload(); } catch (error) { this.message = error.message; } }}>Logga ut</button></div>${this.expanded ? html`<section class="settings"><h2>Mitt konto</h2><form @submit=${event => this.submit(event, 'password')}><label>Nuvarande lösenord<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>Nytt lösenord, minst 12 tecken<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="256" required></label><button ?disabled=${this.busy}>Byt lösenord och logga ut</button></form>
    ${this.user?.role === 'admin' ? html`<h2>Användare</h2><p class="note">Inloggade användare arbetar i den gemensamma kursplaneringen. Administratörer hanterar konton.</p>${this.users.map(user => html`<div class="user"><span>${user.username} · ${user.disabled ? 'Spärrad' : user.role}</span>${user.role !== 'admin' ? html`<button @click=${() => this.toggleUser(user)}>${user.disabled ? 'Aktivera' : 'Spärra'}</button>` : ''}</div>`)}<form @submit=${event => this.submit(event, 'create')}><h3>Skapa konto</h3><label>Användarnamn<input name="username" autocomplete="off" minlength="3" maxlength="80" required></label><label>Tillfälligt lösenord<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="256" required></label><button ?disabled=${this.busy}>Skapa personligt konto</button></form>` : ''}<p role="status">${this.message}</p></section>` : ''}`;
  }
}
customElements.define('account-panel', AccountPanel);
