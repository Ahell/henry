import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const serverFile = root.startsWith('/home/initium/webapps/') ? `/home/initium/.config/webapps/${path.basename(root)}.env` : '';
const file = process.env.RUNTIME_ENV_FILE || [serverFile, path.join(root, '.env')].find(name => name && fs.existsSync(name));
if (file) {
  process.env.RUNTIME_ENV_FILE = file;
  process.loadEnvFile(file);
}
