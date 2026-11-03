const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  const PORT = 3000;
  console.log('--- STARTING COMPREHENSIVE AUTH & MULTI-SEMESTER AUDIT ---');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Unauthenticated root access
  const res1 = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/',
    method: 'GET'
  });
  assert(res1.statusCode === 302 && res1.headers.location.includes('/Auth/Login'), 'Unauthenticated / redirects to /Auth/Login');

  // 2. Unauthenticated /WeeklyTimetable access
  const res2 = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/WeeklyTimetable',
    method: 'GET'
  });
  assert(res2.statusCode === 302 && res2.headers.location.includes('/Auth/Login?returnUrl=%2FWeeklyTimetable'), 'Unauthenticated /WeeklyTimetable redirects with returnUrl');

  // 3. GET /Auth/Login returns 200 with login form
  const res3 = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/Auth/Login',
    method: 'GET'
  });
  assert(res3.statusCode === 200 && res3.body.includes('CỔNG ĐÀO TẠO CTL') && res3.body.includes('CT193667'), 'GET /Auth/Login renders login form and accounts');

  // 4. POST /Auth/Login with invalid credentials
  const badLoginData = 'username=CT193667&password=wrongpassword';
  const res4 = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/Auth/Login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(badLoginData)
    }
  }, badLoginData);
  assert(res4.statusCode === 302 && res4.headers.location.includes('error=invalid_credentials'), 'Invalid login rejected and redirects with error');

  // 5. POST /Auth/Login with valid credentials
  const goodLoginData = 'username=CT193667&password=123456';
  const res5 = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/Auth/Login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(goodLoginData)
    }
  }, goodLoginData);
  const setCookie = res5.headers['set-cookie'] ? res5.headers['set-cookie'].join(';') : '';
  assert(res5.statusCode === 302 && setCookie.includes('fap_user=CT193667'), 'Valid login sets fap_user cookie and redirects');

  const heCookie = 'fap_user=CT193667';

  // 6. Access / with CT193667 cookie
  const res6 = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/',
    method: 'GET',
    headers: { 'Cookie': heCookie }
  });
  assert(res6.statusCode === 200 && res6.body.includes('Cao Thanh Lâm') && res6.body.includes('CT193667'), 'Access / with CT193667 cookie personalizes student name');

  // 7. Multi-semester Timetables for CT193667
  const sems = [
    { code: 'Spring2025', subject: 'PRF192' },
    { code: 'Summer2025', subject: 'PRO192' },
    { code: 'Fall2025', subject: 'CSD201' },
    { code: 'Spring2026', subject: 'PRN211' },
    { code: 'Fall2026', subject: 'KRG301' }
  ];

  for (const s of sems) {
    const resSem = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/WeeklyTimetable?semester=${s.code}`,
      method: 'GET',
      headers: { 'Cookie': heCookie }
    });
    assert(resSem.statusCode === 200 && resSem.body.includes(s.subject), `WeeklyTimetable for semester ${s.code} contains ${s.subject}`);
  }

  // 8. ExamSchedule for multiple semesters
  const resExam = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/ExamSchedule?semester=Spring2025',
    method: 'GET',
    headers: { 'Cookie': heCookie }
  });
  assert(resExam.statusCode === 200 && resExam.body.includes('PRF192'), 'ExamSchedule for Spring 2025 contains PRF192');

  // 9. Attendance for multiple semesters
  const resAtt = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/Report/Attendance?semester=Spring2025',
    method: 'GET',
    headers: { 'Cookie': heCookie }
  });
  assert(resAtt.statusCode === 200 && resAtt.body.includes('PRF192'), 'Attendance for Spring 2025 contains PRF192');

  // 10. Grade report for multiple semesters
  const resGrade = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/Report/Grade?semester=Spring2025',
    method: 'GET',
    headers: { 'Cookie': heCookie }
  });
  assert(resGrade.statusCode === 200 && resGrade.body.includes('PRF192') && resGrade.body.includes('MAE101'), 'Grade report for Spring 2025 contains PRF192 & MAE101');

  // 11. Cumulative Transcript
  const resTrans = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/Report/Transcript',
    method: 'GET',
    headers: { 'Cookie': heCookie }
  });
  assert(resTrans.statusCode === 200 && resTrans.body.includes('Bảng điểm chi tiết toàn khóa học') && resTrans.body.includes('PRF192') && resTrans.body.includes('SWP391'), 'Cumulative Transcript calculates and lists all passed subjects');

  // 12. Switch to Student 2 (SE180123 - Trần Hoàng Long)
  const seCookie = 'fap_user=SE180123';
  const resSE = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/',
    method: 'GET',
    headers: { 'Cookie': seCookie }
  });
  assert(resSE.statusCode === 200 && resSE.body.includes('Trần Hoàng Long') && resSE.body.includes('SE180123'), 'Student SE180123 is displayed on dashboard');

  // 13. SE180123 Fall 2026 OJT schedule
  const resSE_OJT = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/WeeklyTimetable?semester=Fall2026',
    method: 'GET',
    headers: { 'Cookie': seCookie }
  });
  assert(resSE_OJT.statusCode === 200 && resSE_OJT.body.includes('OJT401') && resSE_OJT.body.includes('CTL Hi-Tech Campus'), 'SE180123 has OJT schedule at CTL Hi-Tech Campus');

  // 14. Version and CAP branding audit
  const resTopup = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/Finance/Topup',
    method: 'GET',
    headers: { 'Cookie': heCookie }
  });
  assert(resTopup.statusCode === 200 && resTopup.body.includes('Nạp tiền ví CAP') && !resTopup.body.includes('ví FAP'), 'Finance Topup uses CAP branding without any FAP references');

  // 15. English Language switcher audit
  const resLang = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/Language/SetLanguage?culture=en&returnUrl=/',
    method: 'GET'
  });
  const langCookie = resLang.headers['set-cookie'] ? resLang.headers['set-cookie'].join(';') : '';
  assert(resLang.statusCode === 302 && langCookie.includes('cap_lang=en'), 'Language switcher sets cap_lang=en cookie');

  const resEnHome = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/',
    method: 'GET',
    headers: { 'Cookie': 'cap_user=CT193667; cap_lang=en' }
  });
  assert(resEnHome.statusCode === 200 && resEnHome.body.includes('Student Information') && resEnHome.body.includes('Version: 1.0.0.0'), 'English version renders translated student information and Version: 1.0.0.0');

  // 16. Logout test
  const resLogout = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/Auth/Logout',
    method: 'GET',
    headers: { 'Cookie': heCookie }
  });
  const logoutCookie = resLogout.headers['set-cookie'] ? resLogout.headers['set-cookie'].join(';') : '';
  assert(resLogout.statusCode === 302 && resLogout.headers.location.includes('/Auth/Login?logged_out=1') && logoutCookie.includes('cap_user=;'), 'Logout clears cookies and redirects to /Auth/Login');

  console.log(`\n========================================`);
  console.log(` AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Start server first if needed
const serverProc = require('child_process').spawn('node', ['server.js'], { stdio: 'inherit' });
setTimeout(async () => {
  try {
    await runTests();
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    serverProc.kill();
  }
}, 1500);
