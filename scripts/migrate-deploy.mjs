import './runtime.mjs';
import { db } from '../server/db/index.js';
import { loadRuntimeConfig } from '../server/config/runtime-config.js';
import { openAccounts } from '../server/auth/store.js';
const accounts = openAccounts(loadRuntimeConfig().authDbPath);
accounts.close();
db.close();
console.log('FEI schema and missing base settings initialized.');
