import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { openAccounts } from '../auth/store.js';
import { createUser } from '../auth/accounts.js';
import { DatabaseSync } from 'node:sqlite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const password = 'Temporary-test-password-394';
async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'fei-isolation-'));
  const socket = createServer().listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const envFile = path.join(directory, 'runtime.env');
  const dbPath = path.join(directory, 'planning.db');
  const authDbPath = path.join(directory, 'accounts.sqlite');
  await fs.writeFile(envFile, `NODE_ENV=development\nHOST=127.0.0.1\nPORT=${port}\nHENRY_DB_PATH=${dbPath}\nHENRY_AUTH_DB_PATH=${authDbPath}\n`);
  const store = openAccounts(authDbPath);
  await createUser(store, 'anders', password, 'admin');
  await createUser(store, 'colleague', password);
  store.close();
  let child;
  let output = '';
  async function start() {
    child = spawn(process.execPath, ['server/server.js'], { cwd: root, env: { ...process.env, RUNTIME_ENV_FILE: envFile }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    for (let i = 0; i < 150; i++) {
      if (child.exitCode !== null) throw new Error(output);
      try { if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    throw new Error('Server startup timed out: ' + output);
  }
  async function stop() { if (child?.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); } }
  t.after(async () => { await stop(); await fs.rm(directory, { recursive: true, force: true }); });
  await start();
  const request = (url, init = {}) => fetch(`http://127.0.0.1:${port}` + url, init);
  const login = async username => {
    const response = await request('/api/auth/login', json({ username, password }));
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  };
  return { request, login, start, stop, dbPath, authDbPath, envFile, directory };
}
const json = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const withCookie = (cookie, init = {}) => ({ ...init, headers: { ...init.headers, Cookie: cookie } });

test('personal logins share planning, protect destructive administration and survive restart without data loss', async t => {
  const app = await fixture(t);
  assert.equal((await app.request('/api/bulk/load')).status, 401);
  assert.equal((await app.request('/api/courses', json({}))).status, 401);
  assert.equal((await app.request('/api/runtime')).status, 401);
  assert.equal((await app.request('/api/auth/login', json({ username: 'anders', password: 'wrong' }))).status, 401);
  const admin = await app.login('anders');
  const colleague = await app.login('colleague');
  assert.deepEqual(await (await app.request('/api/courses', withCookie(admin))).json(), []);
  const course = { course_id: 42, name: 'Synthetic planning test', code: 'TEST42', credits: 7.5 };
  assert.equal((await app.request('/api/courses', withCookie(colleague, json(course)))).status, 200);
  assert.equal((await (await app.request('/api/courses', withCookie(admin))).json()).length, 1);
  assert.equal((await app.request('/api/admin/reset-all', withCookie(colleague, json({})))).status, 403);
  assert.equal((await app.request('/api/accounts/users', withCookie(colleague))).status, 403);
  assert.equal((await app.request('/api/courses', { ...withCookie(admin), headers: { Cookie: admin, Origin: 'https://attacker.example' } })).status, 403);
  await app.stop();
  const database = new DatabaseSync(app.dbPath);
  // Legacy startup cleanup would have removed this record.
  database.prepare('INSERT INTO teacher_slot_unavailability(teacher_id,slot_id) VALUES(?,?)').run(999, 999);
  database.close();
  await app.start();
  assert.equal((await (await app.request('/api/courses', withCookie(admin))).json())[0].name, course.name);
  const verify = new DatabaseSync(app.dbPath);
  assert.equal(verify.prepare('SELECT count(*) AS n FROM teacher_slot_unavailability').get().n, 1);
  verify.close();
  await app.request('/api/admin/reset-all', withCookie(admin, json({})));
  assert.equal((await app.request('/api/courses', withCookie(colleague))).status, 200);
  assert.deepEqual(await (await app.request('/api/courses', withCookie(admin))).json(), []);
  await app.request('/api/auth/logout', withCookie(admin, json({})));
  assert.equal((await app.request('/api/courses', withCookie(admin))).status, 401);
});

test('two installations have separate planning, users and session cookies', async t => {
  const a = await fixture(t);
  const b = await fixture(t);
  const cookieA = await a.login('anders');
  const cookieB = await b.login('anders');
  assert.notEqual(cookieA.split('=')[0], cookieB.split('=')[0]);
  assert.equal((await b.request('/api/courses', withCookie(cookieA))).status, 401);
  await a.request('/api/courses', withCookie(cookieA, json({ course_id: 1, name: 'Environment A', code: 'A', credits: 15 })));
  assert.deepEqual(await (await b.request('/api/courses', withCookie(cookieB))).json(), []);
  await b.stop(); await b.start();
  assert.deepEqual(await (await b.request('/api/courses', withCookie(cookieB))).json(), []);
  assert.equal((await (await a.request('/api/courses', withCookie(cookieA))).json()).length, 1);
});


test('assignment APIs preserve multiple courses and transactionally enforce the Hard rule', async t => {
  const app = await fixture(t);
  const cookie = await app.login('anders');
  const database = new DatabaseSync(app.dbPath);
  t.after(() => database.close());
  database.exec(`
    INSERT INTO courses(course_id,name,code,credits) VALUES (1,'Long course','LONG',15),(2,'Short course','SHORT',7.5);
    INSERT INTO teachers(teacher_id,name) VALUES (7,'Synthetic teacher');
    INSERT INTO cohorts(cohort_id,name) VALUES (1,'A'),(2,'B');
    INSERT INTO slots(slot_id,start_date,end_date) VALUES
      (1,'2027-01-01','2027-01-31'),(2,'2027-02-01','2027-02-28');
  `);
  const saveRule = async (enabled, kind) => {
    const response = await app.request('/api/bulk/save', withCookie(cookie, json({
      _delta: true, changed: ['businessLogic'],
      businessLogic: { scheduling: { rules: [{ id: 'maxOneCoursePerTeacherPeriod', enabled, kind }] } }
    })));
    assert.equal(response.status, 200, await response.text());
  };
  const create = payload => app.request('/api/course-runs', withCookie(cookie, json(payload)));
  const firstResponse = await create({ course_id: 1, slot_id: 1, teachers: [7], cohorts: [1], kursansvarig_id: 7 });
  assert.equal(firstResponse.status, 200, await firstResponse.clone().text());
  const first = await firstResponse.json();
  await saveRule(true, 'hard');
  const blocked = await create({ course_id: 2, slot_id: 2, teachers: [7], cohorts: [2] });
  assert.equal(blocked.status, 409, await blocked.text());
  assert.equal(database.prepare('SELECT count(*) AS n FROM joint_course_runs').get().n, 1);
  assert.equal(database.prepare('SELECT count(*) AS n FROM cohort_slot_courses').get().n, 1);
  await saveRule(true, 'soft');
  const allowed = await create({ course_id: 2, slot_id: 2, teachers: [7], cohorts: [2] });
  assert.equal(allowed.status, 200, await allowed.clone().text());
  const second = await allowed.json();
  await saveRule(true, 'hard');
  assert.equal(database.prepare('SELECT count(*) AS n FROM joint_course_run_teachers').get().n, 2);
  // Saving the same existing conflict is permitted after enabling Hard.
  const unchanged = await app.request('/api/course-runs/' + second.run_id, {
    ...withCookie(cookie, json(second)), method: 'PUT'
  });
  assert.equal(unchanged.status, 200, await unchanged.text());
  const cleared = await app.request('/api/course-runs/' + second.run_id, {
    ...withCookie(cookie, json({ ...second, teachers: [] })), method: 'PUT'
  });
  assert.equal(cleared.status, 200, await cleared.text());
  // The bulk-save path used by the frontend must reject and roll back the same new conflict.
  const bulk = await app.request('/api/bulk/save', withCookie(cookie, json({
    _delta: true, changed: ['courseRuns'],
    courses: [{ course_id: 1, name: 'Long course', code: 'LONG', credits: 15 },
      { course_id: 2, name: 'Short course', code: 'SHORT', credits: 7.5 }],
    slots: [{ slot_id: 1, start_date: '2027-01-01', end_date: '2027-01-31' },
      { slot_id: 2, start_date: '2027-02-01', end_date: '2027-02-28' }],
    courseRuns: [first, second]
  })));
  assert.equal(bulk.status, 409, await bulk.text());
  assert.equal(database.prepare('SELECT count(*) AS n FROM joint_course_run_teachers').get().n, 1);
  assert.equal(database.prepare('SELECT kursansvarig_id FROM joint_course_runs WHERE id=?').get(first.run_id).kursansvarig_id, 7);
  await saveRule(false, 'hard');
  const disabled = await app.request('/api/course-runs/' + second.run_id, {
    ...withCookie(cookie, json(second)), method: 'PUT'
  });
  assert.equal(disabled.status, 200, await disabled.text());
  await app.stop();
  await app.start();
  assert.equal(database.prepare('SELECT count(*) AS n FROM joint_course_run_teachers').get().n, 2);
});
