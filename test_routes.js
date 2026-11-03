const routes = [
  '/',
  '/WeeklyTimetable',
  '/ExamSchedule',
  '/Report/Attendance',
  '/Report/Grade',
  '/Report/Transcript',
  '/Report/OjtConditions',
  '/Report/ThesisConditions',
  '/Curriculum',
  '/Subject',
  '/MyCertificates',
  '/ShoppingCart',
  '/Transaction',
  '/Finance/Topup',
  '/Application/Catalog',
  '/Application',
  '/CrossClassChange',
  '/Wishlist',
  '/StartupGroup',
  '/FyeCheckInLog',
  '/FyeMentorFeedback',
  '/Document',
  '/News',
  '/Account',
  '/StudentProfile',
  '/Auth/Login',
  '/Notification/UnreadCount'
];

async function main() {
  let ok = 0;
  for (const r of routes) {
    try {
      const res = await fetch('http://localhost:3000' + r);
      if (res.status === 200) {
        ok++;
        console.log('[OK]', r.padEnd(28), '-> 200');
      } else {
        console.error('[FAIL]', r, '->', res.status);
      }
    } catch(err) {
      console.error('[ERR]', r, err.message);
    }
  }
  console.log(`Verified ${ok}/${routes.length} routes successfully!`);
}

main();
