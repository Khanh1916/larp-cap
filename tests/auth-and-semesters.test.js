// Login flow, multi-semester data and language switching.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, sessionCookie, login } = require('./helpers');

let server;
let ctCookie;
let seCookie;

before(async () => {
  server = await startServer();
  ctCookie = await login(server, 'CT193667');
  seCookie = await login(server, 'SE180123');
});
after(() => server.stop());

test('unauthenticated / redirects to login', async () => {
  const res = await server.get('/');
  assert.equal(res.statusCode, 302);
  assert.match(res.headers.location, /\/Auth\/Login/);
});

test('unauthenticated page keeps returnUrl', async () => {
  const res = await server.get('/WeeklyTimetable');
  assert.equal(res.statusCode, 302);
  assert.ok(res.headers.location.includes('/Auth/Login?returnUrl=%2FWeeklyTimetable'));
});

test('login page renders form and demo accounts (dev mode)', async () => {
  const res = await server.get('/Auth/Login');
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.includes('CỔNG ĐÀO TẠO CTL'));
  assert.ok(res.body.includes('CT193667'));
});

test('wrong password is rejected', async () => {
  const res = await server.post('/Auth/Login', 'username=CT193667&password=wrongpassword');
  assert.equal(res.statusCode, 302);
  assert.ok(res.headers.location.includes('error=invalid_credentials'));
});

test('valid login sets a signed httpOnly session cookie', async () => {
  const res = await server.post('/Auth/Login', 'username=CT193667&password=123456');
  const raw = (res.headers['set-cookie'] || []).join(';');
  assert.equal(res.statusCode, 302);
  // value "<username>:<session version>:<issued at>", signed
  assert.match(raw, /cap_user=s%3ACT193667%3A0%3A\d+\.[^;]+/);
  assert.match(raw, /HttpOnly/i);
  assert.ok(sessionCookie(res));
});

test('dashboard is personalised for CT193667', async () => {
  const res = await server.get('/', { Cookie: ctCookie });
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.includes('Cao Thanh Lâm'));
  assert.ok(res.body.includes('CT193667'));
  // Seeded wallet balance is 1,500,000 VND
  assert.match(res.body, /wallet-amount">\s*1\.500\.000\s*<span/);
  // News newest first (dates are stored as dd/mm/yyyy text): 02/11 before 28/10
  const newer = res.body.indexOf('02/11/2026 23:27');
  const older = res.body.indexOf('28/10/2026 11:27');
  assert.ok(newer > 0 && older > 0 && newer < older, 'news sorted by date');
});

for (const [semester, subject] of [
  ['Spring2025', 'PRF192'],
  ['Summer2025', 'PRO192'],
  ['Fall2025', 'CSD201'],
  ['Spring2026', 'PRN211'],
  ['Fall2026', 'KRG301']
]) {
  test(`timetable ${semester} contains ${subject}`, async () => {
    const res = await server.get(`/WeeklyTimetable?semester=${semester}`, { Cookie: ctCookie });
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.includes(subject));
  });
}

test('exam schedule, attendance and grades for Spring 2025', async () => {
  const exam = await server.get('/ExamSchedule?semester=Spring2025', { Cookie: ctCookie });
  assert.ok(exam.body.includes('PRF192'));
  const att = await server.get('/Report/Attendance?semester=Spring2025', { Cookie: ctCookie });
  assert.ok(att.body.includes('PRF192'));
  const grade = await server.get('/Report/Grade?semester=Spring2025', { Cookie: ctCookie });
  assert.ok(grade.body.includes('PRF192') && grade.body.includes('MAE101'));
});

test('cumulative transcript lists all semesters', async () => {
  const res = await server.get('/Report/Transcript', { Cookie: ctCookie });
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.includes('Bảng điểm chi tiết toàn khóa học'));
  assert.ok(res.body.includes('PRF192') && res.body.includes('SWP391'));
  // Seed data: 13 graded subjects, 3 credits each (Vovinam excluded, IAE301 failed once)
  assert.ok(res.body.includes('7.83'), 'GPA 10-point');
  assert.ok(res.body.includes('3.23'), 'GPA 4-point');
  assert.ok(res.body.includes('36 / 145'), 'credits earned');
  assert.ok(res.body.includes('Giỏi'), 'academic standing');
});

test('grade report computes scores and marks unfinished subjects', async () => {
  const past = await server.get('/Report/Grade?semester=Spring2025', { Cookie: ctCookie });
  assert.match(past.body, />8\.6<\/span>/, 'PRF192 = 8.6 computed from components');

  const current = await server.get('/Report/Grade?semester=Fall2026', { Cookie: ctCookie });
  assert.ok(current.body.includes('Đang học'), 'in-progress badge');
  assert.ok(current.body.includes('Chưa có điểm'), 'pending component');
});

test('second student sees own dashboard and OJT schedule', async () => {
  const home = await server.get('/', { Cookie: seCookie });
  assert.ok(home.body.includes('Trần Hoàng Long') && home.body.includes('SE180123'));
  const tt = await server.get('/WeeklyTimetable?semester=Fall2026', { Cookie: seCookie });
  assert.ok(tt.body.includes('OJT401') && tt.body.includes('CTL Hi-Tech Campus'));
});

test('top-up page uses CAP branding', async () => {
  const res = await server.get('/Finance/Topup', { Cookie: ctCookie });
  assert.ok(res.body.includes('Nạp tiền ví CAP'));
  assert.ok(!res.body.includes('ví FAP'));
});

test('language switcher sets cap_lang and English renders', async () => {
  const res = await server.get('/Language/SetLanguage?culture=en&returnUrl=/');
  assert.equal(res.statusCode, 302);
  assert.ok((res.headers['set-cookie'] || []).join(';').includes('cap_lang=en'));

  const short = await server.get('/lang/en?returnUrl=/News');
  assert.equal(short.headers.location, '/News');

  const home = await server.get('/', { Cookie: `${ctCookie}; cap_lang=en` });
  assert.ok(home.body.includes('Student Information'));
  assert.ok(home.body.includes('Version: 1.0.0.0'));
});

test('logout clears the session cookie', async () => {
  const res = await server.get('/Auth/Logout', { Cookie: ctCookie });
  assert.equal(res.statusCode, 302);
  assert.ok(res.headers.location.includes('/Auth/Login?logged_out=1'));
  assert.ok((res.headers['set-cookie'] || []).join(';').includes('cap_user=;'));
});
