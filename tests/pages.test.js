// Every page renders in both languages, every internal link works,
// and every static file a page references actually exists.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, startServer, login } = require('./helpers');

const ROUTES = [
  '/', '/Home/StudentContentPartial', '/WeeklyTimetable', '/ExamSchedule', '/Report/Attendance',
  '/Report/Grade', '/Report/Transcript', '/Report/OjtConditions', '/Report/ThesisConditions',
  '/Curriculum', '/Subject', '/MyCertificates', '/ShoppingCart', '/CoursePendingPayment',
  '/Transaction', '/Finance/Topup', '/Application/Catalog', '/Application', '/CrossClassChange',
  '/Wishlist', '/Wishlist/Register', '/StartupGroup', '/StartupGroup/Add', '/FyeCheckInLog',
  '/FyeMentorFeedback', '/Document', '/Document/DrivePdf', '/News',
  '/News/Detail/01a19d16-7dae-7b7e-adbb-3a86d4b7b3bf', '/Account', '/StudentProfile',
  '/Notification/BellList', '/Notification/UnreadCount',
  '/WeeklyTimetable?semester=Spring2025', '/Report/Grade?semester=%3Cx%3E'
];

// Signs that a template interpolated something it should not have.
const BROKEN_OUTPUT = ['&amp;amp;', '[object Object]', '>undefined<', '>null<', 'NaN VND'];

let server;
let cookie;

before(async () => {
  server = await startServer();
  cookie = await login(server, 'CT193667');
});
after(() => server.stop());

for (const lang of ['vi', 'en']) {
  test(`all pages render cleanly (${lang})`, async () => {
    for (const route of ROUTES) {
      const res = await server.get(route, { Cookie: `${cookie}; cap_lang=${lang}` });
      assert.equal(res.statusCode, 200, `${route} -> ${res.statusCode}`);
      for (const bad of BROKEN_OUTPUT) {
        assert.ok(!res.body.includes(bad), `${route} contains "${bad}"`);
      }
    }
  });
}

// Internal links found in the dashboard page.
function dashboardLinks() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const links = new Set();
  for (const m of html.matchAll(/(?:href|action)=["']([^"'#]+)["']/g)) {
    const url = m[1].split('?')[0];
    if (url.startsWith('/') && !url.startsWith('//') && !/^\/(assets|css|js)\//.test(url) && url !== '/favicon.ico') {
      links.add(url);
    }
  }
  return [...links].sort();
}

test('every dashboard link works when logged in and is protected when not', async () => {
  const publicPaths = new Set(['/Auth/Login', '/Auth/Logout', '/Language/SetLanguage']);
  const links = dashboardLinks();
  assert.ok(links.length > 20, `only ${links.length} links found`);
  for (const url of links) {
    if (url === '/Auth/Logout') continue; // would end the session used by the loop
    const authed = await server.get(url, { Cookie: cookie });
    assert.ok(authed.statusCode >= 200 && authed.statusCode < 400, `${url} -> ${authed.statusCode}`);
    if (!publicPaths.has(url)) {
      const anon = await server.get(url);
      assert.equal(anon.statusCode, 302, `${url} reachable without login`);
      assert.match(anon.headers.location, /\/Auth\/Login/);
    }
  }
});

test('every static file referenced by the pages exists', async () => {
  const pages = ['/', '/Report/Grade', '/Auth/Login'];
  const assets = new Set();
  for (const page of pages) {
    const res = await server.get(page, { Cookie: cookie });
    for (const m of res.body.matchAll(/(?:src|href)=["']((?:\.\/|\/)(?:assets|css|js)\/[^"'?#]+)/g)) {
      assets.add(m[1].replace(/^\.\//, '/'));
    }
  }
  assert.ok(assets.size > 5, `only ${assets.size} assets found`);
  for (const asset of assets) {
    const res = await server.get(asset);
    assert.equal(res.statusCode, 200, `${asset} -> ${res.statusCode}`);
    assert.ok(!String(res.headers['content-type']).startsWith('text/html'), `${asset} served as HTML`);
  }
  const icon = await server.get('/favicon.ico');
  assert.equal(icon.statusCode, 200, '/favicon.ico');
});
