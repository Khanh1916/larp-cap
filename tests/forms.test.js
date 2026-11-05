// Form submissions are saved and shown back; invalid values are rejected or clamped.
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

const form = obj => new URLSearchParams(obj).toString();
const query = (sql, ...args) => {
  const db = new DatabaseSync(server.dbPath);
  try { return db.prepare(sql).get(...args); } finally { db.close(); }
};

test('wishlist registration is saved and listed', async () => {
  const res = await server.post('/Wishlist/Register', form({ subject_code: 'PRN211', semester_code: 'Spring2027', desired_slot: 'Slot 1', note: 'Đăng ký học vượt' }), { Cookie: cookie });
  assert.equal(res.headers.location, '/Wishlist/Register?success=1');
  const page = await server.get('/Wishlist', { Cookie: cookie });
  assert.ok(page.body.includes('Đăng ký học vượt'));
});

test('invalid semester code falls back to the current semester', async () => {
  await server.post('/Wishlist/Register', form({ subject_code: 'CSD201', semester_code: '<bad>', desired_slot: 'Slot 2', note: 'fallback-check' }), { Cookie: cookie });
  const row = query("SELECT semester_code FROM wishlist WHERE note = 'fallback-check'");
  assert.equal(row.semester_code, 'Fall2026');
});

test('profile update keeps stored values when input is invalid', async () => {
  await server.post('/StudentProfile/Update', form({ phone: '0988776655', address: 'Hà Nội (Updated)', gender: 'Nam', dob: '2005-08-15' }), { Cookie: cookie });
  let row = query("SELECT phone, address, gender, dob FROM students WHERE roll_number = 'CT193667'");
  assert.deepEqual({ ...row }, { phone: '0988776655', address: 'Hà Nội (Updated)', gender: 'Nam', dob: '2005-08-15' });

  await server.post('/StudentProfile/Update', form({ phone: '<script>', address: '', gender: 'X', dob: 'not-a-date' }), { Cookie: cookie });
  row = query("SELECT phone, address, gender, dob FROM students WHERE roll_number = 'CT193667'");
  assert.deepEqual({ ...row }, { phone: '0988776655', address: 'Hà Nội (Updated)', gender: 'Nam', dob: '2005-08-15' });
});

test('cross-class request is saved', async () => {
  await server.post('/CrossClassChange/Submit', form({ subject_code: 'KRG301', from_class: 'IA1901', to_class: 'IA1902', reason: 'trùng lịch' }), { Cookie: cookie });
  const page = await server.get('/CrossClassChange', { Cookie: cookie });
  assert.ok(page.body.includes('IA1902'));
});

test('startup proposal member count is clamped to 1-20', async () => {
  await server.post('/StartupGroup/Add', form({ project_name: 'Clamp test', field: 'AI', member_count: '999', description: 'x' }), { Cookie: cookie });
  const row = query("SELECT member_count FROM startup_groups WHERE project_name = 'Clamp test'");
  assert.equal(row.member_count, 20);
});

test('mentor rating is clamped to 1-5', async () => {
  await server.post('/FyeMentorFeedback/Submit', form({ mentor_name: 'Clamp Mentor', semester_code: 'Fall2026', rating: '42', comment: 'ok' }), { Cookie: cookie });
  const row = query("SELECT rating FROM mentor_feedback WHERE mentor_name = 'Clamp Mentor'");
  assert.equal(row.rating, 5);
});

test('notifications can only be marked read by their owner', async () => {
  const other = query("SELECT id FROM notifications WHERE user_id = 'SE180123' AND is_read = 0");
  await server.post('/Notification/MarkRead', 'id=' + other.id, { Cookie: cookie });
  assert.equal(query('SELECT is_read FROM notifications WHERE id = ?', other.id).is_read, 0);
});

test('the topbar bell lists real notifications and clears after "mark all read"', async () => {
  const page = await server.get('/Report/Grade', { Cookie: cookie });
  assert.ok(page.body.includes('Lịch thi mới'), 'seeded notification title');
  assert.ok(page.body.indexOf('Lịch thi mới') < page.body.indexOf('Nhắc nhở học tập'), 'newest notification first');
  assert.ok(!page.body.includes('Lịch thi kỳ Fall 2026 đã được cập nhật'), 'old hard-coded item is gone');
  assert.match(page.body, /class="noti-icon-badge "\s+data-cap-bell-badge/, 'badge visible while unread');

  const res = await server.post('/Notification/MarkReadAll', '', { Cookie: cookie });
  assert.equal(res.statusCode, 200);
  const after = await server.get('/Report/Grade', { Cookie: cookie });
  assert.match(after.body, /class="noti-icon-badge d-none"\s+data-cap-bell-badge/, 'badge hidden when all read');
});
