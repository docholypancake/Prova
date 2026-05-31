/*
 * No-DB smoke test: node test/smoke.test.js
 * Verifies the app boots, routes are mounted, and auth guards reject
 * unauthenticated requests. Does NOT touch MongoDB (auth fails before any
 * DB query), so it runs anywhere — used for CI/sandbox where Mongo is absent.
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const assert = require('assert');
const request = require('supertest');
const app = require('../app');
const { COOKIE_NAME } = require('../utils/jwt');

let passed = 0;
let failed = 0;
async function t(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}

(async () => {
  await t('GET / → 200 {ok:true}', async () => {
    const r = await request(app).get('/');
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
  });

  const protectedGets = [
    '/api/projects',
    '/api/projects/000000000000000000000000',
    '/api/projects/000000000000000000000000/suites',
    '/api/suites/000000000000000000000000/cases',
    '/api/projects/000000000000000000000000/runs',
    '/api/runs/000000000000000000000000',
    '/api/projects/000000000000000000000000/stats',
  ];
  for (const path of protectedGets) {
    await t(`GET ${path} without cookie → 401`, async () => {
      const r = await request(app).get(path);
      assert.equal(r.status, 401);
    });
  }

  await t('garbage token → 401 (jwt.verify rejects before DB)', async () => {
    const r = await request(app).get('/api/projects').set('Cookie', [`${COOKIE_NAME}=garbage`]);
    assert.equal(r.status, 401);
  });

  await t('POST /api/projects without cookie → 401 (auth before validation)', async () => {
    const r = await request(app).post('/api/projects').send({});
    assert.equal(r.status, 401);
  });

  await t('POST /api/upload without cookie → 401', async () => {
    const r = await request(app).post('/api/upload').send({ image: 'x' });
    assert.equal(r.status, 401);
  });

  await t('GET /api/notifications without cookie → 401', async () => {
    const r = await request(app).get('/api/notifications');
    assert.equal(r.status, 401);
  });

  await t('POST /api/bugs/:id/github-sync without cookie → 401', async () => {
    const r = await request(app).post('/api/bugs/000000000000000000000000/github-sync');
    assert.equal(r.status, 401);
  });

  await t('webhook bad/missing signature → 401', async () => {
    const r = await request(app).post('/webhooks/github').send({ action: 'opened' });
    assert.equal(r.status, 401);
  });

  await t('unknown non-API route → 404', async () => {
    const r = await request(app).get('/totally-unknown');
    assert.equal(r.status, 404);
  });

  await t('unknown /api route → 401 (router-level auth guard runs first)', async () => {
    const r = await request(app).get('/api/nope');
    assert.equal(r.status, 401);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
