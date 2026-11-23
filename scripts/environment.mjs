import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEnvironment, verifyUtilities } from './environment-policy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const contract = JSON.parse(fs.readFileSync(new URL('./environment-contract.json', import.meta.url), 'utf8'));
const runtimeFile = process.env.RUNTIME_ENV_FILE || process.env.UTILITY_ENV_FILE || path.join(root, contract.localEnvFile);
const fileText = fs.readFileSync(runtimeFile, 'utf8');
const fileEnvironment = fileText.match(/^APP_ENV\s*=\s*['"]?(staging|production)['"]?\s*$/m)?.[1];
if (!fileEnvironment || (process.env.APP_ENV && process.env.APP_ENV !== fileEnvironment)) throw new Error('Runtime configuration environment disagrees with deployment');
process.loadEnvFile(runtimeFile);
const environment = validateEnvironment(root, process.env);
if (contract.coreVersion && !contract.utilities.length) {
  const installed = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/@text-utilities/core/package.json'), 'utf8'));
  if (installed.version !== contract.coreVersion) throw new Error('Installed utility core version disagrees with release contract');
}
const utilities = await verifyUtilities(environment, contract, process.env);
console.log(JSON.stringify({ event: 'environment_verified', environment, app: contract.app, coreVersion: contract.coreVersion, utilities }));
