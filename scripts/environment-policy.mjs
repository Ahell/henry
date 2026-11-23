export function validateEnvironment(root, env) {
  const environment = env.APP_ENV;
  if (!['staging', 'production'].includes(environment)) throw new Error('APP_ENV must be staging or production');
  const deployment = env.PM2_APP_NAME || root.split('/').filter(Boolean).at(-1);
  const expected = deployment.endsWith('-staging') ? 'staging' : deployment.endsWith('-production') ? 'production' : null;
  if (expected && expected !== environment) throw new Error('APP_ENV disagrees with deployment target');
  if (env.PUBLIC_BASE_URL) {
    const host = new URL(env.PUBLIC_BASE_URL).hostname;
    if (host.endsWith('.whcg.se') && (host.includes('-staging.') !== (environment === 'staging'))) throw new Error('PUBLIC_BASE_URL disagrees with APP_ENV');
  }
  return environment;
}

export async function verifyUtilities(environment, contract, env, request = fetch) {
  const dependencies = [];
  for (const prefix of contract.utilities) {
    const address = env[`${prefix}_URL`];
    const key = env[`${prefix}_KEY`];
    if (!address || !key) throw new Error(`${prefix}_URL and ${prefix}_KEY are required`);
    const url = new URL(address);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error(`Invalid ${prefix}_URL`);
    const response = await request(`${url.origin}/api/v1/info`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`${prefix} utility metadata unavailable`);
    const info = await response.json();
    const service = { TRANSLATION: 'translate', PDF: 'pdf', IMAGE: 'image', AUDIO: 'audio' }[prefix];
    if (info.service !== service || info.environment !== environment || info.coreVersion !== contract.coreVersion) throw new Error(`${prefix} utility environment, service or core version mismatch`);
    const capability = prefix === 'TRANSLATION' ? 'translation' : prefix.toLowerCase();
    const access = await request(`${url.origin}/api/v1/${capability}-capabilities`, { headers: { 'X-Service-Key': key }, signal: AbortSignal.timeout(20000) });
    if (!access.ok) throw new Error(`${prefix} utility credentials rejected`);
    dependencies.push({ service, environment: info.environment, coreVersion: info.coreVersion });
  }
  return dependencies;
}
