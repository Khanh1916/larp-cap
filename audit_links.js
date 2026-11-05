const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const regex = /(?:href|action)=["']([^"'#]+)["']/g;
const links = new Set();
let m;
while ((m = regex.exec(html)) !== null) {
  const url = m[1].split('?')[0];
  if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/assets') && !url.startsWith('/css') && !url.startsWith('/js') && url !== '/favicon.ico') {
    links.add(url);
  }
}

async function audit() {
  const loginRes = await fetch('http://localhost:3000/Auth/Login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=CT193667&password=123456',
    redirect: 'manual'
  });
  const sessionCookie = loginRes.headers.getSetCookie().find(c => c.startsWith('cap_user=')).split(';')[0];
  console.log(`Auditing ${links.size} unique internal app links:`);
  let authenticatedPassed = 0;
  let unauthenticatedRedirects = 0;
  const sorted = Array.from(links).sort();

  for (const url of sorted) {
    try {
      // 1. Authenticated test
      const resAuth = await fetch('http://localhost:3000' + url, {
        headers: { 'Cookie': sessionCookie },
        redirect: 'manual'
      });
      if (resAuth.status >= 200 && resAuth.status < 400) {
        authenticatedPassed++;
      } else {
        console.error(`[FAIL AUTH] ${url} -> ${resAuth.status}`);
      }

      // 2. Unauthenticated test (except /Auth/Login, /Language/SetLanguage, /Auth/Logout)
      if (url !== '/Auth/Login' && url !== '/Auth/Logout' && url !== '/Language/SetLanguage') {
        const resUnauth = await fetch('http://localhost:3000' + url, {
          redirect: 'manual'
        });
        if (resUnauth.status === 302 && resUnauth.headers.get('location').includes('/Auth/Login')) {
          unauthenticatedRedirects++;
        }
      }
    } catch(err) {
      console.error(`[ERR] ${url} -> ${err.message}`);
    }
  }

  console.log(`\n========================================`);
  console.log(` Authenticated routes working (200/302): ${authenticatedPassed} / ${links.size}`);
  console.log(` Unauthenticated routes protected:      ${unauthenticatedRedirects}`);
  console.log(`========================================\n`);
}

// Start server child process
const { spawn } = require('child_process');
const serverProc = spawn('node', ['server.js'], { stdio: 'inherit' });
setTimeout(async () => {
  try {
    await audit();
  } finally {
    serverProc.kill();
  }
}, 1500);
