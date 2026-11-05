// Regression tests for the security fixes (sessions, XSS, CSRF, redirects, payments).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { startServer, login } = require('./helpers');

let server;
let cookie;

before(async () => {
  server = await startServer();
  cookie = await login(server, 'CT193667');
});
after(() => server.stop());

const MOMO = encodeURIComponent('Ví MoMo');

test('unsigned or legacy cookies do not authenticate', async () => {
  for (const forged of ['cap_user=SE180123', 'fap_user=SE180123']) {
    const res = await server.get('/Account', { Cookie: forged });
    assert.equal(res.statusCode, 302, forged);
    assert.match(res.headers.location, /\/Auth\/Login/);
  }
});

test('external returnUrl after login is replaced by /', async () => {
  for (const target of ['https://evil.example', '//evil.example', '/\\evil.example']) {
    const res = await server.post('/Auth/Login', 'username=CT193667&password=123456&returnUrl=' + encodeURIComponent(target));
    assert.equal(res.headers.location, '/', target);
  }
});

test('returnUrl is not reflected as raw HTML on the login page', async () => {
  const res = await server.get('/Auth/Login?returnUrl=' + encodeURIComponent('/"><script>alert(1)</script>'));
  assert.equal(res.statusCode, 200);
  assert.ok(!res.body.includes('<script>alert(1)</script>'));
});

test('stored user text is HTML-escaped', async () => {
  const payload = '<img src=x onerror=alert(1)>';
  await server.post('/Application/Submit', 'app_type=Test&reason=' + encodeURIComponent(payload), { Cookie: cookie });
  const res = await server.get('/Application', { Cookie: cookie });
  assert.ok(!res.body.includes(payload));
  assert.ok(res.body.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('cart error text from the URL is never rendered', async () => {
  const res = await server.get('/ShoppingCart?error=' + encodeURIComponent('<script>x()</script>'), { Cookie: cookie });
  assert.equal(res.statusCode, 200);
  assert.ok(!res.body.includes('<script>x()</script>'));
});

test('cross-origin POST is rejected (CSRF)', async () => {
  const res = await server.post('/Finance/Topup', 'amount=500000&method=' + MOMO, { Cookie: cookie, Origin: 'https://evil.example' });
  assert.equal(res.statusCode, 403);
});

test('top-up limits and method whitelist are enforced', async () => {
  const big = await server.post('/Finance/Topup', 'amount=1e12&method=' + MOMO, { Cookie: cookie });
  assert.equal(big.headers.location, '/Finance/Topup?error=invalid');
  const badMethod = await server.post('/Finance/Topup', 'amount=500000&method=' + encodeURIComponent('<b>x</b>'), { Cookie: cookie });
  assert.equal(badMethod.headers.location, '/Finance/Topup?error=invalid');
  const ok = await server.post('/Finance/Topup', 'amount=50000000&method=' + MOMO, { Cookie: cookie });
  assert.equal(ok.headers.location, '/Finance/Topup?success=1');
});

test('paying the same cart item twice at once charges only once', async () => {
  const db = new DatabaseSync(server.dbPath);
  try {
    const item = db.prepare("SELECT id, amount FROM shopping_cart WHERE student_roll='CT193667' AND status='Chưa thanh toán' ORDER BY amount LIMIT 1").get();
    const balance = () => db.prepare("SELECT balance FROM students WHERE roll_number='CT193667'").get().balance;
    const before = balance();
    const pay = () => server.post('/ShoppingCart/Pay', 'item_id=' + item.id, { Cookie: cookie }).then(r => r.headers.location);
    const results = await Promise.all([pay(), pay()]);
    assert.equal(results.filter(l => l === '/ShoppingCart?success=1').length, 1, results.join(', '));
    assert.equal(before - balance(), item.amount);
  } finally {
    db.close();
  }
});

test('passwords are stored hashed', () => {
  const db = new DatabaseSync(server.dbPath);
  try {
    const rows = db.prepare('SELECT password FROM users').all();
    assert.ok(rows.length > 0);
    assert.ok(rows.every(r => r.password.startsWith('scrypt$')));
  } finally {
    db.close();
  }
});

test('login is locked after 10 failures', async () => {
  for (let i = 0; i < 10; i++) {
    await server.post('/Auth/Login', `username=SE180123&password=bad${i}`);
  }
  const res = await server.post('/Auth/Login', 'username=SE180123&password=123456');
  assert.ok(res.headers.location.includes('too_many_attempts'));
});

test('security headers are set and x-powered-by is hidden', async () => {
  const res = await server.get('/Auth/Login');
  assert.equal(res.headers['x-frame-options'], 'DENY');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-powered-by'], undefined);
});

test('Content-Security-Policy forbids inline and third-party script', async () => {
  const csp = (await server.get('/Auth/Login')).headers['content-security-policy'] || '';
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /form-action 'self'/);
});

test('unknown route returns 404', async () => {
  const res = await server.get('/does-not-exist', { Cookie: cookie });
  assert.equal(res.statusCode, 404);
});
