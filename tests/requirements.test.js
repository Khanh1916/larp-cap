// OJT / thesis eligibility and curriculum status come from the real record.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, login } = require('./helpers');
const requirements = require('../requirements');

let server;
let ct;
let se;

before(async () => {
  server = await startServer();
  ct = await login(server, 'CT193667');
  se = await login(server, 'SE180123');
});
after(() => server.stop());

test('subjectStatuses keeps the best status of retaken subjects', () => {
  const map = requirements.subjectStatuses([
    { subject_code: 'A', status: 'Failed' }, { subject_code: 'A', status: 'InProgress' },
    { subject_code: 'B', status: 'Passed' }, { subject_code: 'B', status: 'Failed' }
  ]);
  assert.equal(map.get('A'), 'InProgress');
  assert.equal(map.get('B'), 'Passed');
});

test('OJT page for a semester-5 student lists what is still in progress', async () => {
  const res = await server.get('/Report/OjtConditions', { Cookie: ct });
  assert.equal(res.statusCode, 200);
  // Everything still missing is being studied this semester.
  assert.ok(res.body.includes('Sắp đủ điều kiện'));
  assert.ok(res.body.includes('ITE302 (đang học)'), 'semester-5 subject in progress');
  assert.ok(res.body.includes('IAE301 (đang học)'), 'failed core subject being retaken');
  assert.ok(res.body.includes('Level 5 (B2)'), 'English certificate from the record');
  assert.ok(!res.body.includes('65 tín chỉ'), 'old hardcoded text is gone');
});

test('OJT page for a student already on OJT', async () => {
  const res = await server.get('/Report/OjtConditions', { Cookie: se });
  assert.ok(res.body.includes('Đang thực tập doanh nghiệp'));
  assert.ok(res.body.includes('Fall 2026'));
});

test('thesis page uses real credits and GPA', async () => {
  const res = await server.get('/Report/ThesisConditions', { Cookie: ct });
  assert.ok(res.body.includes('36 tín chỉ'));
  assert.ok(res.body.includes('7.83 / 10 (3.23 / 4)'));
  assert.ok(res.body.includes('Chưa tham gia'), 'OJT not started');
  assert.ok(!res.body.includes('8.42'), 'old hardcoded GPA is gone');

  const seRes = await server.get('/Report/ThesisConditions', { Cookie: se });
  assert.ok(seRes.body.includes('Đang thực tập'));
});

test('curriculum shows the student programme, status per subject and current semester', async () => {
  const res = await server.get('/Curriculum', { Cookie: se });
  assert.ok(res.body.includes('BIT_SE_18A_AS'));
  assert.ok(res.body.includes('Kỹ thuật phần mềm'));
  assert.ok(res.body.includes('Khóa 18'));
  assert.match(res.body, /Học kỳ 6<\/strong> <span class="badge bg-primary ms-2">Học kỳ hiện tại/);

  const ctRes = await server.get('/Curriculum', { Cookie: ct });
  assert.match(ctRes.body, /Học kỳ 5<\/strong> <span class="badge bg-primary ms-2">Học kỳ hiện tại/);
  assert.ok(ctRes.body.includes('badge-soft-success">Đạt'), 'passed subjects are marked');
});
