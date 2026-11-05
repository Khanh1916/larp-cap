// Change password, session revocation and logout protection.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const signature = require('cookie-signature');
const { startServer, sessionCookie, login } = require('./helpers');

const DEV_SECRET = 'cap-dev-only-insecure-secret'; // security.getSessionSecret() outside production
let server;

before(async () => { server = await startServer(); });
after(() => server.stop());

const form = obj => new URLSearchParams(obj).toString();
// /Auth/ChangePassword is open to every signed-in role (students and staff).
const isLoggedIn = async cookie => (await server.get('/Auth/ChangePassword', { Cookie: cookie })).statusCode === 200;
const signedCookie = value => 'cap_user=' + encodeURIComponent('s:' + signature.sign(value, DEV_SECRET));

test('change password page is reachable from the menu', async () => {
  const cookie = await login(server, 'SE180123');
  const res = await server.get('/Auth/ChangePassword', { Cookie: cookie });
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.includes('name="current_password"'));
  assert.ok(res.body.includes('href="/Auth/ChangePassword"'));
});

test('change password validates input', async () => {
  const cookie = await login(server, 'SE180123');
  const post = body => server.post('/Auth/ChangePassword', form(body), { Cookie: cookie }).then(r => r.headers.location);
  assert.equal(await post({ current_password: 'nope', new_password: 'abcdefgh', confirm_password: 'abcdefgh' }), '/Auth/ChangePassword?error=wrong_current');
  assert.equal(await post({ current_password: '123456', new_password: 'short', confirm_password: 'short' }), '/Auth/ChangePassword?error=too_short');
  assert.equal(await post({ current_password: '123456', new_password: 'abcdefgh', confirm_password: 'abcdefgX' }), '/Auth/ChangePassword?error=mismatch');
  assert.equal(await post({ current_password: '123456', new_password: '123456', confirm_password: '123456' }), '/Auth/ChangePassword?error=too_short');
  assert.ok(await isLoggedIn(cookie), 'failed attempts keep the session');
});

test('changing the password signs out other devices but keeps this one', async () => {
  const laptop = await login(server, 'CT193667');
  const phone = await login(server, 'CT193667');
  const res = await server.post('/Auth/ChangePassword', form({ current_password: '123456', new_password: 'new-pass-2026', confirm_password: 'new-pass-2026' }), { Cookie: laptop });
  assert.equal(res.headers.location, '/Auth/ChangePassword?success=changed');

  const laptopNew = sessionCookie(res);
  assert.ok(laptopNew, 'this device gets a fresh cookie');
  assert.ok(await isLoggedIn(laptopNew));
  assert.equal(await isLoggedIn(laptop), false, 'old cookie of this device is revoked');
  assert.equal(await isLoggedIn(phone), false, 'other device is signed out');

  const oldPw = await server.post('/Auth/Login', 'username=CT193667&password=123456');
  assert.ok(oldPw.headers.location.includes('error=invalid_credentials'), 'old password no longer works');
  assert.ok(await login(server, 'CT193667', 'new-pass-2026'), 'new password works');
});

test('"sign out other devices" revokes every other session', async () => {
  const a = await login(server, 'GV001');
  const b = await login(server, 'GV001');
  const res = await server.post('/Auth/LogoutOtherDevices', '', { Cookie: a });
  assert.equal(res.headers.location, '/Auth/ChangePassword?success=logged_out_others');
  assert.ok(await isLoggedIn(sessionCookie(res)));
  assert.equal(await isLoggedIn(b), false);
});

test('validly signed but expired or malformed session values are rejected', async () => {
  const eightDaysAgo = Math.floor(Date.now() / 1000) - 8 * 24 * 3600;
  assert.equal(await isLoggedIn(signedCookie(`SE180123:0:${eightDaysAgo}`)), false, 'expired');
  assert.equal(await isLoggedIn(signedCookie('SE180123')), false, 'old cookie format');
  assert.equal(await isLoggedIn(signedCookie(`SE180123:99:${Math.floor(Date.now() / 1000)}`)), false, 'wrong version');
  assert.ok(await isLoggedIn(signedCookie(`SE180123:0:${Math.floor(Date.now() / 1000)}`)), 'control: a fresh valid value works');
});

test('a cross-site link cannot log the user out', async () => {
  const cookie = await login(server, 'SE180123');
  const res = await server.get('/Auth/Logout', { Cookie: cookie, 'Sec-Fetch-Site': 'cross-site' });
  assert.equal(res.headers.location, '/');
  assert.ok(!(res.headers['set-cookie'] || []).join(';').includes('cap_user=;'));
  assert.ok(await isLoggedIn(cookie));
});
