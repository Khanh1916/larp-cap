// Staff roles: role separation, request approval (admin), grade entry (lecturer).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { startServer, login } = require('./helpers');

let server;
let student;
let lecturer;
let admin;

before(async () => {
  // Pin "today" so the attendance tests do not depend on the real date.
  server = await startServer({ CAP_TODAY: '2026-11-04' });
  student = await login(server, 'CT193667');
  lecturer = await login(server, 'GV001');
  admin = await login(server, 'AD001');
});
after(() => server.stop());

const query = (sql, ...args) => {
  const db = new DatabaseSync(server.dbPath);
  try { return db.prepare(sql).all(...args); } finally { db.close(); }
};
const one = (sql, ...args) => query(sql, ...args)[0];

test('staff are sent to /Staff and never see student pages', async () => {
  for (const path of ['/', '/Report/Grade', '/ShoppingCart', '/Account']) {
    const res = await server.get(path, { Cookie: lecturer });
    assert.equal(res.statusCode, 302, path);
    assert.equal(res.headers.location, '/Staff', path);
  }
  const home = await server.get('/Staff', { Cookie: lecturer });
  assert.equal(home.statusCode, 200);
  assert.ok(home.body.includes('ThS. Hoàng Quốc Khánh'));
  assert.ok(!home.body.includes('sidebar-lich-hoc'), 'student menu is not shown to staff');
  assert.ok(!home.body.includes(' VND'), 'no wallet in the staff topbar');
});

test('students cannot open staff pages', async () => {
  for (const path of ['/Staff', '/Staff/Grades', '/Staff/Requests', '/Staff/Grades/21']) {
    assert.equal((await server.get(path, { Cookie: student })).statusCode, 403, path);
  }
  const res = await server.post('/Staff/Requests/applications/1', 'decision=approve', { Cookie: student });
  assert.equal(res.statusCode, 403);
});

test('a lecturer only sees and grades their own classes', async () => {
  const list = await server.get('/Staff/Grades', { Cookie: lecturer });
  assert.ok(list.body.includes('IA1901_SWP'), 'own class');
  assert.ok(!list.body.includes('IA1901_KRG'), 'class of another lecturer');

  const krg = one("SELECT id FROM classes WHERE class_code = 'IA1901_KRG'").id;
  assert.equal((await server.get(`/Staff/Grades/${krg}`, { Cookie: lecturer })).statusCode, 403);
  assert.equal((await server.post(`/Staff/Grades/${krg}`, 'g_1=1', { Cookie: lecturer })).statusCode, 403);
});

test('lecturer enters a missing grade; the student sees it and is notified', async () => {
  const swp = one("SELECT id FROM classes WHERE class_code = 'IA1901_SWP'").id;
  const page = await server.get(`/Staff/Grades/${swp}`, { Cookie: lecturer });
  assert.ok(page.body.includes('CT193667'));
  const pending = one("SELECT id FROM grades WHERE student_roll='CT193667' AND subject_code='SWP391' AND semester_code='Fall2026' AND value IS NULL");
  assert.ok(pending, 'seed has an ungraded component');

  const bad = await server.post(`/Staff/Grades/${swp}`, `g_${pending.id}=11`, { Cookie: lecturer });
  assert.ok(bad.headers.location.endsWith('error=invalid_score'));
  assert.equal(one('SELECT value FROM grades WHERE id = ?', pending.id).value, null, 'invalid input saves nothing');

  const ok = await server.post(`/Staff/Grades/${swp}`, `g_${pending.id}=9.04`, { Cookie: lecturer });
  assert.ok(ok.headers.location.endsWith('ok=saved'));
  assert.equal(one('SELECT value FROM grades WHERE id = ?', pending.id).value, 9);

  const report = await server.get('/Report/Grade?semester=Fall2026', { Cookie: student });
  assert.match(report.body, /SWP391[\s\S]*?>8\.8<\/span>/, 'SWP391 now complete: 8.5*.2 + 9*.2 + 8.5*.2 + 9*.4 = 8.8');
  assert.ok(one("SELECT COUNT(*) AS n FROM notifications WHERE user_id='CT193667' AND title='Điểm số cập nhật'").n >= 1);
});

test('grade fields of other classes are ignored', async () => {
  const swp = one("SELECT id FROM classes WHERE class_code = 'IA1901_SWP'").id;
  const other = one("SELECT id, value FROM grades WHERE student_roll='CT193667' AND subject_code='PRF192' LIMIT 1");
  await server.post(`/Staff/Grades/${swp}`, `g_${other.id}=0`, { Cookie: lecturer });
  assert.equal(one('SELECT value FROM grades WHERE id = ?', other.id).value, other.value);
});

test('only the admin approves requests; the student is notified', async () => {
  assert.equal((await server.get('/Staff/Requests', { Cookie: lecturer })).statusCode, 403);

  await server.post('/Application/Submit', 'app_type=Xin+bảo+lưu&reason=Lý+do+sức+khỏe', { Cookie: student });
  const app = one("SELECT id FROM applications WHERE student_roll='CT193667' AND app_type='Xin bảo lưu'");

  const list = await server.get('/Staff/Requests?type=applications', { Cookie: admin });
  assert.ok(list.body.includes('Xin bảo lưu'));

  const res = await server.post(`/Staff/Requests/applications/${app.id}`, 'decision=approve', { Cookie: admin });
  assert.ok(res.headers.location.endsWith('ok=approved'));
  assert.equal(one('SELECT status FROM applications WHERE id = ?', app.id).status, 'Đã duyệt');

  const again = await server.post(`/Staff/Requests/applications/${app.id}`, 'decision=reject', { Cookie: admin });
  assert.ok(again.headers.location.endsWith('error=not_pending'), 'a decided request cannot be changed');
  assert.equal(one('SELECT status FROM applications WHERE id = ?', app.id).status, 'Đã duyệt');

  const notes = await server.get('/Notification/BellList', { Cookie: student });
  assert.ok(notes.body.includes('Đơn đã được xử lý'));
});

test('admin rejects a wishlist request', async () => {
  const w = one("SELECT id FROM wishlist WHERE student_roll='CT193667' ORDER BY id LIMIT 1");
  const res = await server.post(`/Staff/Requests/wishlist/${w.id}`, 'decision=reject', { Cookie: admin });
  assert.ok(res.headers.location.endsWith('ok=rejected'));
  assert.equal(one('SELECT status FROM wishlist WHERE id = ?', w.id).status, 'Không mở lớp');
});

test('unknown request type or decision is refused', async () => {
  const res = await server.post('/Staff/Requests/users/1', 'decision=approve', { Cookie: admin });
  assert.ok(res.headers.location.includes('error=not_pending'));
  const res2 = await server.post('/Staff/Requests/applications/1', 'decision=maybe', { Cookie: admin });
  assert.ok(res2.headers.location.includes('error=not_pending'));
});

test('lecturer takes attendance; summary, timetable and notification follow', async () => {
  const swp = one("SELECT id FROM classes WHERE class_code = 'IA1901_SWP'").id;
  const past = one("SELECT id FROM schedules WHERE class_id = ? AND study_date = '2026-11-03'", swp);
  const future = one("SELECT id FROM schedules WHERE class_id = ? AND study_date = '2026-11-05'", swp);
  const before = one("SELECT absent_slots, total_slots FROM attendance_summary WHERE student_roll='CT193667' AND subject_code='SWP391' AND semester_code='Fall2026'");

  const page = await server.get(`/Staff/Attendance/${swp}`, { Cookie: lecturer });
  assert.equal(page.statusCode, 200);
  assert.match(page.body, new RegExp(`name="a_${future.id}"[^>]*disabled`), 'future session is locked');

  const locked = await server.post(`/Staff/Attendance/${swp}`, `a_${future.id}=Attended`, { Cookie: lecturer });
  assert.ok(locked.headers.location.endsWith('error=invalid_attendance'));
  const bogus = await server.post(`/Staff/Attendance/${swp}`, `a_${past.id}=Sleeping`, { Cookie: lecturer });
  assert.ok(bogus.headers.location.endsWith('error=invalid_attendance'));

  const ok = await server.post(`/Staff/Attendance/${swp}`, `a_${past.id}=Absent`, { Cookie: lecturer });
  assert.ok(ok.headers.location.endsWith('ok=attendance_saved'));
  assert.equal(one('SELECT status FROM schedules WHERE id = ?', past.id).status, 'Absent');
  const after = one("SELECT absent_slots, absent_percentage FROM attendance_summary WHERE student_roll='CT193667' AND subject_code='SWP391' AND semester_code='Fall2026'");
  assert.equal(after.absent_slots, before.absent_slots + 1);
  assert.equal(after.absent_percentage, Math.round(((before.absent_slots + 1) / before.total_slots) * 10000) / 100);

  const tt = await server.get('/WeeklyTimetable?semester=Fall2026', { Cookie: student });
  assert.ok(tt.body.includes('Vắng mặt'), 'timetable shows the absence');
  const bell = await server.get('/Notification/BellList', { Cookie: student });
  assert.ok(bell.body.includes('Bạn bị ghi vắng buổi 2026-11-03'));

  // Correcting it back restores the summary
  await server.post(`/Staff/Attendance/${swp}`, `a_${past.id}=Attended`, { Cookie: lecturer });
  assert.equal(one("SELECT absent_slots FROM attendance_summary WHERE student_roll='CT193667' AND subject_code='SWP391' AND semester_code='Fall2026'").absent_slots, before.absent_slots);
});

test("a lecturer cannot take attendance for another lecturer's class", async () => {
  const krg = one("SELECT id FROM classes WHERE class_code = 'IA1901_KRG'").id;
  assert.equal((await server.get(`/Staff/Attendance/${krg}`, { Cookie: lecturer })).statusCode, 403);
  assert.equal((await server.post(`/Staff/Attendance/${krg}`, 'a_1=Absent', { Cookie: lecturer })).statusCode, 403);
  assert.equal((await server.get('/Staff/Attendance', { Cookie: student })).statusCode, 403);
});
