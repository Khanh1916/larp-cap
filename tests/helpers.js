// Shared test harness: starts server.js on a free port with a throwaway SQLite
// database, so tests never touch the developer's own cap.db.
const http = require('http');
const net = require('net');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function request(port, { method = 'GET', path: urlPath = '/', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: urlPath, method, headers }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function startServer(env = {}) {
  const port = await freePort();
  const dbPath = path.join(os.tmpdir(), `cap-test-${process.pid}-${port}.db`);
  const proc = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: '', DEMO_LOGIN: '', ...env, PORT: String(port), CAP_DB_PATH: dbPath },
    stdio: ['ignore', 'ignore', 'inherit']
  });

  // Wait until the server answers (seeding a fresh database takes a moment).
  const deadline = Date.now() + 15000;
  for (;;) {
    try {
      await request(port, { path: '/Auth/Login' });
      break;
    } catch (err) {
      if (Date.now() > deadline || proc.exitCode !== null) {
        proc.kill();
        throw new Error('Server did not start: ' + err.message);
      }
      await new Promise(r => setTimeout(r, 150));
    }
  }

  return {
    port,
    dbPath,
    get: (urlPath, headers = {}) => request(port, { path: urlPath, headers }),
    post: (urlPath, body, headers = {}) => request(port, {
      method: 'POST',
      path: urlPath,
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), ...headers }
    }),
    async stop() {
      if (proc.exitCode === null) {
        await new Promise(resolve => { proc.once('exit', resolve); proc.kill(); });
      }
      for (const suffix of ['', '-wal', '-shm', '-journal']) {
        try { fs.unlinkSync(dbPath + suffix); } catch { /* not created */ }
      }
    }
  };
}

// "cap_user=<signed value>" from a login response, or ''.
function sessionCookie(res) {
  const raw = (res.headers['set-cookie'] || []).find(c => c.startsWith('cap_user='));
  return raw ? raw.split(';')[0] : '';
}

async function login(server, username, password = '123456') {
  const res = await server.post('/Auth/Login', `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
  return sessionCookie(res);
}

module.exports = { ROOT, startServer, sessionCookie, login };
