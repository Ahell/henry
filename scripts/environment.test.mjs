import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvironment, verifyUtilities } from './environment-policy.mjs';

test('environment target must be explicit and match deployment', () => {
  assert.throws(() => validateEnvironment('/apps/example-staging', {}));
  assert.throws(() => validateEnvironment('/apps/example-staging', { APP_ENV: 'production' }));
  assert.throws(() => validateEnvironment('/apps/example-production', { APP_ENV: 'production', PUBLIC_BASE_URL: 'https://example-staging.whcg.se' }));
  assert.equal(validateEnvironment('/apps/example-staging', { APP_ENV: 'staging' }), 'staging');
  assert.equal(validateEnvironment('/apps/example', { APP_ENV: 'production', PM2_APP_NAME: 'example' }), 'production');
});
test('utility checks reject missing configuration, wrong environments, versions and credentials', async () => {
  const contract = { utilities: ['PDF'], coreVersion: '1.3.0' };
  const env = { PDF_URL: 'http://127.0.0.1:5225', PDF_KEY: 'test-key' };
  await assert.rejects(verifyUtilities('staging', contract, {}));
  for (const info of [{ service: 'pdf', environment: 'production', coreVersion: '1.3.0' }, { service: 'pdf', environment: 'staging', coreVersion: 'old' }, { service: 'image', environment: 'staging', coreVersion: '1.3.0' }]) {
    await assert.rejects(verifyUtilities('staging', contract, env, async () => new Response(JSON.stringify(info))));
  }
  const info = { service: 'pdf', environment: 'staging', coreVersion: '1.3.0' };
  await assert.rejects(verifyUtilities('staging', contract, env, async url => url.endsWith('/info') ? new Response(JSON.stringify(info)) : new Response('', { status: 401 })));
  const result = await verifyUtilities('staging', contract, env, async (url, options) => {
    if (!url.endsWith('/info')) assert.equal(options.headers['X-Service-Key'], 'test-key');
    return new Response(JSON.stringify(info));
  });
  assert.equal(result[0].environment, 'staging');
});
