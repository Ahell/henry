import './runtime.mjs';
import { loadRuntimeConfig } from '../server/config/runtime-config.js';
import { openAccounts } from '../server/auth/store.js';
import { createUser } from '../server/auth/accounts.js';
const [username, role = 'user'] = process.argv.slice(2);
if (!['user', 'admin'].includes(role)) throw new Error('Invalid role');
let password = '';
for await (const chunk of process.stdin) password += chunk;
const store = openAccounts(loadRuntimeConfig().authDbPath);
try { const user = await createUser(store, username, password.trimEnd(), role); console.log(`Created ${user.role} ${user.username}`); }
finally { store.close(); }
