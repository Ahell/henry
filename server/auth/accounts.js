import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const error = (status, message) => Object.assign(new Error(message), { status });
const digest = token => createHash('sha256').update(token).digest('hex');
const publicUser = user => ({ id: user.id, username: user.username, role: user.role });

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw error(400, 'Lösenordet behöver innehålla 12–256 tecken.');
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`;
}
async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 256) return false;
  const [salt, hex] = stored.split(':');
  const actual = await scrypt(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hex, 'hex'));
}
export async function createUser(store, username, password, role = 'user') {
  if (typeof username !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._@+-]{2,79}$/.test(username)) throw error(400, 'Användarnamn ska vara 3–80 bokstäver, siffror eller . _ @ + -');
  const hash = await hashPassword(password);
  const user = { id: randomUUID(), username: username.toLowerCase(), role };
  try { store.db.prepare('INSERT INTO users(id,username,password_hash,role) VALUES(?,?,?,?)').run(user.id, user.username, hash, role); }
  catch (failure) { if (failure.code?.includes('SQLITE')) throw error(409, 'Användarnamnet finns redan.'); throw failure; }
  return user;
}
export function mountAuth(app, store, config) {
  const wrap = handler => (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next);
  const routes = {
    get: (path, handler) => app.get(path, wrap(handler)),
    post: (path, handler) => app.post(path, wrap(handler)),
    patch: (path, handler) => app.patch(path, wrap(handler))
  };
  const required = Boolean(config.authRequired);
  const cookieName = config.publicBaseUrl?.startsWith('https:') ? '__Host-fei' : `fei-${config.port}`;
  const cookie = (res, value, maxAge) => res.cookie(cookieName, value, { httpOnly: true, secure: config.publicBaseUrl?.startsWith('https:'), sameSite: 'strict', path: '/', maxAge });
  const attempts = new Map();
  const dummy = randomBytes(16).toString('hex') + ':' + randomBytes(64).toString('hex');
  let activeLogins = 0;
  app.use((req, _res, next) => {
    req.user = required ? null : { id: 'local', username: 'Lokal arbetsyta', role: 'local' };
    const token = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    if (required && token && /^[a-f0-9]{64}$/.test(token)) {
      const user = store.db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>? AND users.disabled=0').get(digest(token), Date.now());
      if (user) req.user = publicUser(user);
    }
    next();
  });
  routes.get('/api/auth/me', (req, res) => res.json({ required, user: req.user }));
  routes.post('/api/auth/login', async (req, res) => {
    if (!required) return res.json({ user: req.user });
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
    const address = req.ip;
    const attempt = attempts.get(address) || { count: 0, until: now + 15 * 60000 };
    if (attempt.count >= 20 || attempts.size >= 10000 || activeLogins >= 4) throw error(429, 'För många inloggningsförsök. Försök senare.');
    attempt.count++;
    attempts.set(address, attempt);
    activeLogins++;
    try {
      const username = typeof req.body?.username === 'string' ? req.body.username.toLowerCase() : '';
      const user = store.db.prepare('SELECT * FROM users WHERE username=? AND disabled=0').get(username);
      const valid = await verifyPassword(req.body?.password, user?.password_hash || dummy);
      if (!user || !valid) throw error(401, 'Fel användarnamn eller lösenord.');
      const token = randomBytes(32).toString('hex');
      const duration = 12 * 3600000;
      store.db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now);
      store.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token), user.id, now + duration);
      attempts.delete(address);
      cookie(res, token, duration);
      res.json({ user: publicUser(user) });
    } finally { activeLogins--; }
  });
  routes.post('/api/auth/logout', (req, res) => {
    const token = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    if (token) store.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));
    cookie(res, '', 0);
    res.json({ loggedOut: true });
  });
  app.use('/api', (req, _res, next) => {
    if (['/health', '/info'].includes(req.path)) return next();
    if (!req.user) throw error(401, 'Logga in för att fortsätta.');
    next();
  });
  routes.post('/api/auth/password', async (req, res) => {
    if (!required) throw error(400, 'Kontohantering kräver inloggningsläge.');
    const user = store.db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
    if (!await verifyPassword(req.body?.currentPassword, user.password_hash)) throw error(401, 'Det nuvarande lösenordet är fel.');
    const hash = await hashPassword(req.body?.password);
    store.db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, user.id);
    store.db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
    cookie(res, '', 0);
    res.json({ changed: true });
  });
  app.use('/api/accounts', (req, _res, next) => {
    if (req.user?.role !== 'admin') throw error(403, 'Administratörsbehörighet krävs.');
    next();
  });
  routes.get('/api/accounts/users', (_req, res) => res.json({ users: store.db.prepare('SELECT id,username,role,disabled FROM users ORDER BY username').all() }));
  routes.post('/api/accounts/users', async (req, res) => res.status(201).json({ user: await createUser(store, req.body?.username, req.body?.password) }));
  routes.patch('/api/accounts/users/:id', async (req, res) => {
    const user = store.db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user || user.role === 'admin') throw error(400, 'Välj ett vanligt användarkonto.');
    if (typeof req.body?.disabled !== 'boolean') throw error(400, 'Ange om kontot ska spärras.');
    store.db.prepare('UPDATE users SET disabled=? WHERE id=?').run(Number(req.body.disabled), user.id);
    store.db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
    res.json({ updated: true });
  });
}
