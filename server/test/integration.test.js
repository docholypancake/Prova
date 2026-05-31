/*
 * Standalone integration test (no Jest needed): node test/integration.test.js
 * Spins up an in-memory MongoDB, seeds a user, forges the auth cookie, and
 * exercises the full Projects/Suites/Cases API via supertest.
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

const assert = require('assert');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const User = require('../models/User');
const { signToken, COOKIE_NAME } = require('../utils/jwt');

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

function authCookie(user) {
  const token = signToken({ id: user._id.toString(), githubId: user.githubId, username: user.username });
  return [`${COOKIE_NAME}=${token}`];
}

(async () => {
  // Use TEST_MONGO_URI if provided (e.g. a throwaway Atlas db), else spin up
  // an in-memory MongoDB. The in-memory server needs to download a mongod
  // binary on first run, so it requires network access to fastdl.mongodb.org.
  let mongo;
  if (process.env.TEST_MONGO_URI) {
    await mongoose.connect(process.env.TEST_MONGO_URI, { dbName: 'prova_test' });
  } else {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }

  // Two users: owner (free) + intruder
  const owner = await User.create({ githubId: '1', username: 'owner', plan: 'free' });
  const intruder = await User.create({ githubId: '2', username: 'intruder', plan: 'free' });
  const ownerCookie = authCookie(owner);
  const intruderCookie = authCookie(intruder);

  let projectId, suiteId, childSuiteId, caseId;

  console.log('\nAUTH GUARDS');
  await t('GET /api/projects without cookie → 401', async () => {
    const r = await request(app).get('/api/projects');
    assert.equal(r.status, 401);
  });
  await t('bad/garbage token → 401', async () => {
    const r = await request(app).get('/api/projects').set('Cookie', [`${COOKIE_NAME}=garbage`]);
    assert.equal(r.status, 401);
  });

  console.log('\nPROJECTS');
  await t('POST /api/projects with no name → 400', async () => {
    const r = await request(app).post('/api/projects').set('Cookie', ownerCookie).send({});
    assert.equal(r.status, 400);
    assert.ok(r.body.errors);
  });
  await t('POST /api/projects → 201 creates', async () => {
    const r = await request(app)
      .post('/api/projects')
      .set('Cookie', ownerCookie)
      .send({ name: 'Proj A', description: 'first' });
    assert.equal(r.status, 201);
    assert.equal(r.body.project.name, 'Proj A');
    projectId = r.body.project._id;
  });
  await t('free tier: 2nd project → 403', async () => {
    const r = await request(app)
      .post('/api/projects')
      .set('Cookie', ownerCookie)
      .send({ name: 'Proj B' });
    assert.equal(r.status, 403);
  });
  await t('GET /api/projects → only owner sees their project', async () => {
    const r = await request(app).get('/api/projects').set('Cookie', ownerCookie);
    assert.equal(r.status, 200);
    assert.equal(r.body.projects.length, 1);
    const ri = await request(app).get('/api/projects').set('Cookie', intruderCookie);
    assert.equal(ri.body.projects.length, 0);
  });
  await t('GET /api/projects/:id by non-owner → 403', async () => {
    const r = await request(app).get(`/api/projects/${projectId}`).set('Cookie', intruderCookie);
    assert.equal(r.status, 403);
  });
  await t('GET /api/projects/:badid → 400', async () => {
    const r = await request(app).get('/api/projects/not-an-id').set('Cookie', ownerCookie);
    assert.equal(r.status, 400);
  });
  await t('GET /api/projects/<valid-but-missing> → 404', async () => {
    const r = await request(app)
      .get(`/api/projects/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', ownerCookie);
    assert.equal(r.status, 404);
  });
  await t('PUT /api/projects/:id updates name', async () => {
    const r = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Proj A renamed' });
    assert.equal(r.status, 200);
    assert.equal(r.body.project.name, 'Proj A renamed');
  });

  console.log('\nSUITES');
  await t('POST suite no name → 400', async () => {
    const r = await request(app)
      .post(`/api/projects/${projectId}/suites`)
      .set('Cookie', ownerCookie)
      .send({});
    assert.equal(r.status, 400);
  });
  await t('POST suite → 201', async () => {
    const r = await request(app)
      .post(`/api/projects/${projectId}/suites`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Smoke' });
    assert.equal(r.status, 201);
    suiteId = r.body.suite._id;
  });
  await t('POST child suite → 201', async () => {
    const r = await request(app)
      .post(`/api/projects/${projectId}/suites`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Login', parentId: suiteId });
    assert.equal(r.status, 201);
    childSuiteId = r.body.suite._id;
  });
  await t('GET suites returns nested tree', async () => {
    const r = await request(app).get(`/api/projects/${projectId}/suites`).set('Cookie', ownerCookie);
    assert.equal(r.status, 200);
    assert.equal(r.body.suites.length, 1); // one root
    assert.equal(r.body.suites[0].children.length, 1); // one child
  });
  await t('non-owner cannot list suites → 403', async () => {
    const r = await request(app)
      .get(`/api/projects/${projectId}/suites`)
      .set('Cookie', intruderCookie);
    assert.equal(r.status, 403);
  });

  console.log('\nCASES');
  await t('POST case no title → 400', async () => {
    const r = await request(app)
      .post(`/api/suites/${suiteId}/cases`)
      .set('Cookie', ownerCookie)
      .send({ steps: ['x'] });
    assert.equal(r.status, 400);
  });
  await t('POST case bad priority → 400', async () => {
    const r = await request(app)
      .post(`/api/suites/${suiteId}/cases`)
      .set('Cookie', ownerCookie)
      .send({ title: 'T', priority: 'P9' });
    assert.equal(r.status, 400);
  });
  await t('POST case → 201', async () => {
    const r = await request(app)
      .post(`/api/suites/${suiteId}/cases`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'User can log in',
        steps: ['open login', 'enter creds', 'submit'],
        expectedResult: 'redirected to dashboard',
        priority: 'P0',
        tags: ['smoke', 'auth'],
      });
    assert.equal(r.status, 201);
    assert.equal(r.body.case.steps.length, 3);
    assert.equal(r.body.case.priority, 'P0');
    caseId = r.body.case._id;
  });
  await t('GET cases for suite → 200, 1 case', async () => {
    const r = await request(app).get(`/api/suites/${suiteId}/cases`).set('Cookie', ownerCookie);
    assert.equal(r.status, 200);
    assert.equal(r.body.cases.length, 1);
  });
  await t('PUT case updates title + priority', async () => {
    const r = await request(app)
      .put(`/api/cases/${caseId}`)
      .set('Cookie', ownerCookie)
      .send({ title: 'User can log in (edited)', priority: 'P1' });
    assert.equal(r.status, 200);
    assert.equal(r.body.case.title, 'User can log in (edited)');
    assert.equal(r.body.case.priority, 'P1');
  });
  await t('non-owner cannot edit case → 403', async () => {
    const r = await request(app)
      .put(`/api/cases/${caseId}`)
      .set('Cookie', intruderCookie)
      .send({ title: 'hax' });
    assert.equal(r.status, 403);
  });

  console.log('\nCASCADE DELETE');
  await t('DELETE suite cascades child suite + cases', async () => {
    const r = await request(app).delete(`/api/suites/${suiteId}`).set('Cookie', ownerCookie);
    assert.equal(r.status, 200);
    assert.equal(r.body.deletedSuites, 2); // parent + child
    const cases = await request(app).get(`/api/suites/${suiteId}/cases`).set('Cookie', ownerCookie);
    assert.equal(cases.status, 404); // suite gone
  });
  await t('DELETE project cascades remaining suites/cases', async () => {
    // recreate a suite + case to confirm project delete clears them
    const s = await request(app)
      .post(`/api/projects/${projectId}/suites`)
      .set('Cookie', ownerCookie)
      .send({ name: 'Temp' });
    await request(app)
      .post(`/api/suites/${s.body.suite._id}/cases`)
      .set('Cookie', ownerCookie)
      .send({ title: 'tmp' });
    const r = await request(app).delete(`/api/projects/${projectId}`).set('Cookie', ownerCookie);
    assert.equal(r.status, 200);
    const TestSuite = require('../models/TestSuite');
    const TestCase = require('../models/TestCase');
    assert.equal(await TestSuite.countDocuments({ projectId }), 0);
    assert.equal(await TestCase.countDocuments({ projectId }), 0);
  });
  await t('after delete, free tier can create again', async () => {
    const r = await request(app)
      .post('/api/projects')
      .set('Cookie', ownerCookie)
      .send({ name: 'Fresh' });
    assert.equal(r.status, 201);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
