// Behaviour with NODE_ENV=production: demo shortcuts off, secure cookies.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers');

let server;

before(async () => {
  server = await startServer({ NODE_ENV: 'production', SESSION_SECRET: 'test-secret-for-ci' });
});
after(() => server.stop());

test('QuickLogin and SwitchUser are disabled', async () => {
  assert.equal((await server.get('/Auth/QuickLogin/CT193667')).statusCode, 404);
  assert.equal((await server.get('/Auth/SwitchUser/SE180123')).statusCode, 404);
});

test('login page hides demo shortcuts and default password', async () => {
  const res = await server.get('/Auth/Login');
  assert.ok(!res.body.includes('value="123456"'));
  assert.ok(!res.body.includes('/Auth/QuickLogin/'));
});

test('session cookie is Secure and HttpOnly; topbar has no switch-account links', async () => {
  const res = await server.post('/Auth/Login', 'username=CT193667&password=123456');
  const raw = (res.headers['set-cookie'] || []).find(c => c.startsWith('cap_user=')) || '';
  assert.match(raw, /;\s*Secure/i);
  assert.match(raw, /HttpOnly/i);

  const page = await server.get('/Account', { Cookie: raw.split(';')[0] });
  assert.equal(page.statusCode, 200);
  assert.ok(!page.body.includes('/Auth/SwitchUser/'));
});
