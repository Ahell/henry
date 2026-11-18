import './runtime.mjs';
import { loadRuntimeConfig } from '../server/config/runtime-config.js';
const config = loadRuntimeConfig();
const response = await fetch(`http://127.0.0.1:${config.port}/api/health`, { signal: AbortSignal.timeout(10000) });
if (!response.ok) throw new Error(`Health failed: ${response.status}`);
console.log('FEI health check passed.');
