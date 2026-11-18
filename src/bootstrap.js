import './account.js';

async function bootstrap() {
const shell = document.querySelector('.app-shell');
const area = document.getElementById('accountArea');
try {
  const response = await fetch('/api/auth/me');
  if (!response.ok) throw new Error('Kunde inte kontrollera inloggningen.');
  const auth = await response.json();
  const panel = document.createElement('account-panel');
  if (!auth.user) {
    panel.loginOnly = true;
    area.append(panel);
  } else {
    panel.user = auth.user;
    document.querySelector('.sidebar-scroll').prepend(panel);
    if (auth.user.role !== 'admin') {
      document.getElementById('navResetDatabase')?.setAttribute('hidden', '');
      document.getElementById('navLoadTestData')?.setAttribute('hidden', '');
    }
    shell.hidden = false;
    await import('./main.js');
  }
} catch (error) {
  area.textContent = error.message;
}

}
bootstrap();
