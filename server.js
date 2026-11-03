const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const db = require('./db');
const i18n = require('./i18n');

const { renderLayout } = require('./views/layout');
const { renderTimetable } = require('./views/timetable');
const { renderExamSchedule } = require('./views/exam');
const { renderAttendance } = require('./views/attendance');
const { renderGradeReport, renderTranscript } = require('./views/grade');
const { renderNewsList, renderNewsDetail } = require('./views/news');
const { renderAccount } = require('./views/account');
const { renderApplications } = require('./views/application');
const { renderEditProfile } = require('./views/student_profile');

// Expanded modules
const {
  renderCurriculum,
  renderSubjects,
  renderCertificates,
  renderOjtConditions,
  renderThesisConditions
} = require('./views/academics');

const {
  renderShoppingCart,
  renderTransactions,
  renderTopup,
  renderCoursePendingPayment
} = require('./views/finance');

const {
  renderWishlist,
  renderWishlistRegister,
  renderCrossClass,
  renderStartup,
  renderStartupAdd,
  renderFyeLogs,
  renderMentorFeedback,
  renderDocuments,
  renderUserGuide,
  renderApplicationCatalog
} = require('./views/services');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser('cap_secret_session_2026'));

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/favicon.ico', express.static(path.join(__dirname, 'favicon.ico')));

// Multi-language Middleware (vi / en)
app.use((req, res, next) => {
  const lang = req.cookies?.cap_lang || req.query?.culture || req.query?.lang || 'vi';
  req.lang = (lang === 'en') ? 'en' : 'vi';
  next();
});

// Helper to get authenticated student/user
function getAuthenticatedStudent(req) {
  const roll = req.cookies?.cap_user || req.cookies?.fap_user;
  if (!roll) return null;
  const user = db.findUser(roll) || db.getUserByRoll(roll);
  if (!user) return null;
  const student = db.getStudent(user.roll_number || user.username) || {
    roll_number: user.roll_number || user.username,
    full_name: user.full_name,
    email: user.email,
    campus_id: 'HN',
    status: 'HD',
    program_code: 'BIT_IA_19A_AS',
    major_name: 'An toàn thông tin (Information Assurance)',
    cohort: 19,
    balance: 0,
    avatar: user.avatar || 'CTL'
  };
  return { user, student };
}

// Unified Render Helper with i18n
function renderPage(res, req, { title, currentPath, content, student }) {
  const translatedTitle = i18n.translateTitle(title, req.lang);
  let html = renderLayout({
    title: translatedTitle,
    currentPath,
    content,
    student,
    lang: req.lang
  });
  if (req.lang === 'en') {
    html = i18n.translateHtml(html, 'en');
  }
  res.send(html);
}

// ---------------- AUTH ROUTES (Public) ----------------

app.get('/Auth/Login', (req, res) => {
  const currentAuth = getAuthenticatedStudent(req);
  const returnUrl = req.query.returnUrl || '/';
  if (currentAuth && !req.query.force) {
    return res.redirect(returnUrl);
  }

  const isEn = req.lang === 'en';
  const error = req.query.error;
  const loggedOut = req.query.logged_out;

  let alertHtml = '';
  if (error === 'invalid_credentials') {
    alertHtml = `<div class="alert alert-danger py-2 small mb-3"><i class="ri-error-warning-line me-1"></i>${isEn ? 'Invalid username or password!' : 'Tên đăng nhập hoặc mật khẩu không chính xác!'}</div>`;
  } else if (loggedOut) {
    alertHtml = `<div class="alert alert-success py-2 small mb-3"><i class="ri-check-line me-1"></i>${isEn ? 'You have been successfully logged out.' : 'Bạn đã đăng xuất khỏi hệ thống thành công.'}</div>`;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="${isEn ? 'en' : 'vi'}" data-bs-theme="dark">
    <head>
      <meta charset="utf-8">
      <title>${isEn ? 'Login - CAP - CTL Education' : 'Đăng nhập - CAP - CTL Education'}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="icon" type="image/svg+xml" href="/assets/images/logo-ctl.svg">
      <link href="/assets/vendor/jidox/css/app.min.css" rel="stylesheet" type="text/css">
      <link href="/assets/vendor/jidox/css/icons.min.css" rel="stylesheet" type="text/css">
      <style>
        body {
          background: radial-gradient(circle at 50% 20%, #21153b 0%, #0c0a1a 75%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #f8fafc;
        }
        .login-card {
          width: 100%;
          max-width: 460px;
          border-radius: 16px;
          background: #15122a;
          border: 1px solid rgba(168, 85, 247, 0.25);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(124, 58, 237, 0.2);
          padding: 2.25rem;
        }
        .brand-logo {
          height: 52px;
          display: block;
          margin: 0 auto 1.5rem auto;
        }
        .btn-ctl-primary {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          color: #fff;
          border: none;
        }
        .btn-ctl-primary:hover {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          color: #fff;
        }
        .account-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          color: inherit;
        }
        .account-pill:hover {
          background: rgba(124, 58, 237, 0.18);
          border-color: #a855f7;
          color: #fff;
        }
        .badge-soft-primary { background: rgba(124, 58, 237, 0.2); color: #c084fc; }
        .badge-soft-success { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .badge-soft-warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
      </style>
    </head>
    <body>
      <div class="login-card">
        <div class="text-center">
          <img src="/assets/images/logo-ctlu.svg" alt="CTL University" class="brand-logo">
          <h4 class="text-white fw-bold mb-1">${isEn ? 'CTL ACADEMIC PORTAL (CAP)' : 'CỔNG ĐÀO TẠO CTL (CAP)'}</h4>
          <p class="text-muted small">${isEn ? 'CTL University Academic Management System' : 'CTL University Academic Portal'}</p>
        </div>

        ${alertHtml}

        <!-- One-click Google CTL Login -->
        <div class="mb-3">
          <a href="/Auth/QuickLogin/CT193667" class="btn btn-ctl-primary btn-lg w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 py-2">
            <i class="ri-google-fill fs-20"></i> ${isEn ? 'Sign in with Google CTL (@ctl.edu.vn)' : 'Đăng nhập với tài khoản Google CTL (@ctl.edu.vn)'}
          </a>
        </div>

        <div class="position-relative my-4 text-center">
          <hr class="border-secondary m-0">
          <span class="position-absolute top-50 start-50 translate-middle px-3 bg-dark text-muted small">${isEn ? 'or enter credentials' : 'hoặc nhập tài khoản'}</span>
        </div>

        <!-- Form Login -->
        <form method="post" action="/Auth/Login" class="mb-4">
          <input type="hidden" name="returnUrl" value="${returnUrl}">
          <div class="mb-3">
            <label class="form-label text-muted small fw-semibold">${isEn ? 'Username / Student ID / Email' : 'Tên đăng nhập / Mã sinh viên'}</label>
            <div class="input-group">
              <span class="input-group-text bg-transparent border-secondary text-muted"><i class="ri-user-line"></i></span>
              <input type="text" name="username" class="form-control bg-dark border-secondary text-white" placeholder="VD: CT193667 hoặc SE180123" required>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label text-muted small fw-semibold">${isEn ? 'Password' : 'Mật khẩu'}</label>
            <div class="input-group">
              <span class="input-group-text bg-transparent border-secondary text-muted"><i class="ri-lock-line"></i></span>
              <input type="password" name="password" class="form-control bg-dark border-secondary text-white" placeholder="${isEn ? 'Default: 123456' : 'Mật khẩu mặc định: 123456'}" value="123456" required>
            </div>
          </div>
          <button type="submit" class="btn btn-outline-info w-100 fw-semibold py-2">
            <i class="ri-login-box-line me-1"></i> ${isEn ? 'Sign In to Portal' : 'Đăng nhập hệ thống'}
          </button>
        </form>

        <!-- Quick 1-Click Test Accounts -->
        <div class="pt-2 border-top border-secondary">
          <div class="text-muted small fw-semibold mb-2"><i class="ri-group-line me-1"></i>${isEn ? 'Select quick test account:' : 'Chọn nhanh tài khoản thử nghiệm:'}</div>
          <div class="d-flex flex-column gap-2">
            <a href="/Auth/QuickLogin/CT193667" class="account-pill">
              <div>
                <div class="fw-bold text-primary">CT193667 - Cao Thanh Lâm</div>
                <div class="small text-muted">K19 | An toàn thông tin (BIT_IA)</div>
              </div>
              <span class="badge badge-soft-primary">${isEn ? 'Enter &rarr;' : 'Vào ngay &rarr;'}</span>
            </a>
            <a href="/Auth/QuickLogin/SE180123" class="account-pill">
              <div>
                <div class="fw-bold text-success">SE180123 - Trần Hoàng Long</div>
                <div class="small text-muted">K18 | Kỹ thuật phần mềm (BIT_SE)</div>
              </div>
              <span class="badge badge-soft-success">${isEn ? 'Enter &rarr;' : 'Vào ngay &rarr;'}</span>
            </a>
            <a href="/Auth/QuickLogin/GV001" class="account-pill">
              <div>
                <div class="fw-bold text-warning">GV001 - ThS. Hoàng Quốc Khánh</div>
                <div class="small text-muted">${isEn ? 'Lecturer | Faculty of IT' : 'Giảng viên | Khoa CNTT'}</div>
              </div>
              <span class="badge badge-soft-warning">${isEn ? 'Enter &rarr;' : 'Vào ngay &rarr;'}</span>
            </a>
          </div>
        </div>

        <div class="text-center text-muted small mt-4">
          CAP &copy; 2026 - ${isEn ? 'CTL University Academic Portal (CAP) | Version: 1.0.0.0' : 'Cổng Đào Tạo Trực Tuyến Đại Học CTL (CAP) | Phiên bản: 1.0.0.0'}
        </div>
      </div>
    </body>
    </html>
  `);
});

app.post('/Auth/Login', (req, res) => {
  const { username, password, returnUrl } = req.body;
  const targetUrl = returnUrl && returnUrl !== '' ? returnUrl : '/';

  if (!username) {
    return res.redirect(`/Auth/Login?error=invalid_credentials&returnUrl=${encodeURIComponent(targetUrl)}`);
  }

  const user = db.findUser(username.trim());
  if (!user) {
    return res.redirect(`/Auth/Login?error=invalid_credentials&returnUrl=${encodeURIComponent(targetUrl)}`);
  }

  // Password verify (accept matching pass or default 123456)
  if (user.password !== password && password !== '123456') {
    return res.redirect(`/Auth/Login?error=invalid_credentials&returnUrl=${encodeURIComponent(targetUrl)}`);
  }

  // Set cookies for genuine authentication
  const cookieVal = user.roll_number || user.username;
  res.cookie('cap_user', cookieVal, {
    httpOnly: true,
    maxAge: 7 * 24 * 3600 * 1000,
    sameSite: 'lax'
  });
  res.cookie('fap_user', cookieVal, {
    httpOnly: true,
    maxAge: 7 * 24 * 3600 * 1000,
    sameSite: 'lax'
  });

  res.redirect(targetUrl);
});

// Quick 1-click login endpoint
app.get('/Auth/QuickLogin/:roll', (req, res) => {
  const roll = req.params.roll;
  const user = db.findUser(roll);
  if (user) {
    const cookieVal = user.roll_number || user.username;
    res.cookie('cap_user', cookieVal, {
      httpOnly: true,
      maxAge: 7 * 24 * 3600 * 1000,
      sameSite: 'lax'
    });
    res.cookie('fap_user', cookieVal, {
      httpOnly: true,
      maxAge: 7 * 24 * 3600 * 1000,
      sameSite: 'lax'
    });
  }
  res.redirect('/');
});

// Switch user helper
app.get('/Auth/SwitchUser/:roll', (req, res) => {
  const roll = req.params.roll;
  const user = db.findUser(roll);
  if (user) {
    const cookieVal = user.roll_number || user.username;
    res.cookie('cap_user', cookieVal, {
      httpOnly: true,
      maxAge: 7 * 24 * 3600 * 1000,
      sameSite: 'lax'
    });
    res.cookie('fap_user', cookieVal, {
      httpOnly: true,
      maxAge: 7 * 24 * 3600 * 1000,
      sameSite: 'lax'
    });
  }
  res.redirect(req.headers.referer || '/');
});

// 100% genuine Logout (GET & POST)
app.all('/Auth/Logout', (req, res) => {
  res.clearCookie('cap_user');
  res.clearCookie('fap_user');
  res.redirect('/Auth/Login?logged_out=1');
});

// Language switcher (vi / en)
app.all('/Language/SetLanguage', (req, res) => {
  const culture = (req.body?.culture || req.query?.culture || req.body?.lang || req.query?.lang || 'vi') === 'en' ? 'en' : 'vi';
  const returnUrl = req.body?.returnUrl || req.query?.returnUrl || req.headers.referer || '/';
  res.cookie('cap_lang', culture, {
    maxAge: 365 * 24 * 3600 * 1000,
    httpOnly: false,
    path: '/'
  });
  res.redirect(returnUrl);
});

app.all('/Notification/SyncWebDevice', (req, res) => {
  res.json({ ok: true, status: 'synced', token: 'mock_token_cap' });
});

// ---------------- AUTH GUARD MIDDLEWARE ----------------
app.use((req, res, next) => {
  const auth = getAuthenticatedStudent(req);
  if (!auth) {
    const returnUrl = encodeURIComponent(req.originalUrl || '/');
    return res.redirect(`/Auth/Login?returnUrl=${returnUrl}`);
  }
  req.user = auth.user;
  req.student = auth.student;
  next();
});

// ---------------- PROTECTED APPLICATION ROUTES ----------------

// 1. Home Dashboard
app.get('/', (req, res) => {
  const student = req.student;
  const htmlPath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Dynamically personalize index.html with the logged-in student's details
  const balanceStr = (Number(student.balance) || 0).toLocaleString('vi-VN');
  const avatar = student.avatar || (student.full_name ? student.full_name.split(' ').map(n => n[0]).join('').slice(0, 3) : 'CTL');

  html = html
    .replace(/Cao Thanh Lâm/g, student.full_name)
    .replace(/CT193667/g, student.roll_number)
    .replace(/lamctct193667@ctl\.edu\.vn/g, student.email)
    .replace(/BIT_IA_19A_AS/g, student.program_code)
    .replace(/1\.500\.000/g, balanceStr)
    .replace(/>CTL</g, `>${avatar}<`);

  // Translate to English if requested
  html = i18n.translateHtml(html, req.lang);

  res.send(html);
});

// Dynamic student content partial for home page
app.get('/Home/StudentContentPartial', (req, res) => {
  const student = req.student;
  const isEn = req.lang === 'en';
  const news = db.getNews();

  const newsItems = news.map(n => `
    <a class="fap-home-news-item" href="/News/Detail/${n.id}">
      <span class="fap-home-news-item__icon"><i class="ri-article-line"></i></span>
      <span class="fap-home-news-item__body">
        <span class="fap-home-news-item__title">${n.title}</span>
        <span class="fap-home-news-item__meta">
          <span class="badge bg-soft-primary text-primary">${n.author}</span>
          <span class="text-muted small ms-2"><i class="ri-time-line me-1"></i>${n.created_at}</span>
        </span>
      </span>
      <i class="ri-arrow-right-s-line fap-home-news-item__arrow align-self-center"></i>
    </a>
  `).join('');

  const html = `
    <div class="row g-3">
      <div class="col-12">
        <div class="card cap-home-student-card fap-home-student-card">
          <div class="row g-0">
            <div class="col-lg-3 fap-home-student-card__left p-4 d-flex flex-column justify-content-center">
              <div class="d-flex align-items-center gap-3">
                <div class="fap-home-student-card__avatar">
                  ${student.avatar || 'CTL'}
                </div>
                <div>
                  <div class="text-white-50 small text-uppercase fw-semibold mb-1">
                    ${isEn ? 'Student Information' : 'Thông tin sinh viên'}
                  </div>
                  <div class="fap-home-student-card__name mb-1">${student.full_name}</div>
                  <div class="fap-home-student-card__roll">${student.roll_number}</div>
                </div>
              </div>
            </div>
            <div class="col-lg-9 p-4">
              <div class="row g-3">
                <div class="col-sm-6 col-xl">
                  <div class="fap-home-student-card__metric">
                    <div class="fap-home-student-card__label fap-home-student-card__label--primary"><i class="ri-shield-check-line"></i>${isEn ? 'Status' : 'Trạng thái'}</div>
                    <div class="fap-home-student-card__value">${student.status}</div>
                  </div>
                </div>
                <div class="col-sm-6 col-xl">
                  <div class="fap-home-student-card__metric">
                    <div class="fap-home-student-card__label fap-home-student-card__label--info"><i class="ri-book-open-line"></i>${isEn ? 'Program Code' : 'Mã chương trình'}</div>
                    <div class="fap-home-student-card__value text-primary">${student.program_code}</div>
                  </div>
                </div>
                <div class="col-sm-6 col-xl">
                  <div class="fap-home-student-card__metric">
                    <div class="fap-home-student-card__label fap-home-student-card__label--warning"><i class="ri-mail-line"></i>Email</div>
                    <div class="fap-home-student-card__value text-break">${student.email}</div>
                  </div>
                </div>
                <div class="col-sm-6 col-xl">
                  <div class="fap-home-student-card__metric">
                    <div class="fap-home-student-card__label fap-home-student-card__label--secondary"><i class="ri-calendar-line"></i>${isEn ? 'Cohort' : 'Khóa'}</div>
                    <div class="fap-home-student-card__value">${student.cohort}</div>
                  </div>
                </div>
                <div class="col-sm-6 col-xl">
                  <div class="fap-home-student-card__metric fap-home-student-card__metric--wallet">
                    <div class="fap-home-student-card__label fap-home-student-card__label--success"><i class="ri-wallet-3-line"></i>${isEn ? 'Balance' : 'Số dư'}</div>
                    <div class="fap-home-student-card__wallet-amount">${(Number(student.balance) || 0).toLocaleString('vi-VN')} <span class="fs-6 fw-medium">VND</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card fap-home-news-card">
          <div class="card-header border-bottom bg-transparent d-flex justify-content-between align-items-center">
            <h4 class="header-title m-0 fap-home-news-card__header-title"><i class="ri-newspaper-line me-1 text-primary"></i>${isEn ? 'Latest Announcements' : 'Tin tức mới nhất'}</h4>
            <a href="/News" class="btn btn-sm btn-outline-primary">${isEn ? 'View all' : 'Xem tất cả'} &rarr;</a>
          </div>
          <div class="card-body p-0">
            <div class="fap-home-news-list">
              ${newsItems}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  res.send(req.lang === 'en' ? i18n.translateHtml(html, 'en') : html);
});

// 2. Weekly Timetable (Multi-Semester)
app.get('/WeeklyTimetable', (req, res) => {
  const student = req.student;
  const semester = req.query.semester || 'Fall2026';
  const schedules = db.getSchedules(student.roll_number, semester);
  const semesters = db.getSemesters();
  const content = renderTimetable({ schedules, semesters, currentSemester: semester });
  renderPage(res, req, { title: 'Thời khóa biểu', currentPath: '/WeeklyTimetable', content, student });
});

// 3. Exam Schedule (Multi-Semester)
app.get('/ExamSchedule', (req, res) => {
  const student = req.student;
  const semester = req.query.semester || 'Fall2026';
  const exams = db.getExamSchedules(student.roll_number, semester);
  const semesters = db.getSemesters();
  const content = renderExamSchedule({ exams, semesters, currentSemester: semester, lang: req.lang });
  renderPage(res, req, { title: req.lang === 'en' ? 'My Exam Schedule' : 'Lịch thi của tôi', currentPath: '/ExamSchedule', content, student });
});

// 4. Attendance Report (Multi-Semester)
app.get('/Report/Attendance', (req, res) => {
  const student = req.student;
  const semester = req.query.semester || 'Fall2026';
  const summary = db.getAttendanceSummary(student.roll_number, semester);
  const semesters = db.getSemesters();
  const content = renderAttendance({ summary, semesters, currentSemester: semester });
  renderPage(res, req, { title: 'Báo cáo điểm danh', currentPath: '/Report/Attendance', content, student });
});

// 5. Grade Report (Multi-Semester)
app.get('/Report/Grade', (req, res) => {
  const student = req.student;
  const semester = req.query.semester || 'Fall2026';
  const grades = db.getGrades(student.roll_number, semester);
  const semesters = db.getSemesters();
  const content = renderGradeReport({ grades, semesters, currentSemester: semester });
  renderPage(res, req, { title: 'Báo cáo điểm', currentPath: '/Report/Grade', content, student });
});

// 6. Cumulative Transcript (Calculated from all past semesters)
app.get('/Report/Transcript', (req, res) => {
  const student = req.student;
  const transcriptGrades = db.getAllGradesForTranscript(student.roll_number);
  const content = renderTranscript({ student, transcriptGrades });
  renderPage(res, req, { title: 'Bảng điểm tích lũy', currentPath: '/Report/Transcript', content, student });
});

// 7. OJT Conditions
app.get('/Report/OjtConditions', (req, res) => {
  const student = req.student;
  const content = renderOjtConditions({ student });
  renderPage(res, req, { title: 'Điều kiện OJT', currentPath: '/Report/OjtConditions', content, student });
});

// 8. Thesis Conditions
app.get('/Report/ThesisConditions', (req, res) => {
  const student = req.student;
  const content = renderThesisConditions({ student });
  renderPage(res, req, { title: 'Điều kiện KLTN', currentPath: '/Report/ThesisConditions', content, student });
});

// 9. Curriculum
app.get('/Curriculum', (req, res) => {
  const student = req.student;
  const curriculum = db.getCurriculum(student.program_code);
  const content = renderCurriculum({ curriculum, majorCode: student.program_code });
  renderPage(res, req, { title: 'Khung chương trình', currentPath: '/Curriculum', content, student });
});

// 10. Subjects
app.get('/Subject', (req, res) => {
  const student = req.student;
  const subjects = db.getSubjects();
  const content = renderSubjects({ subjects });
  renderPage(res, req, { title: 'Danh mục môn học', currentPath: '/Subject', content, student });
});

// 11. Certificates
app.get('/MyCertificates', (req, res) => {
  const student = req.student;
  const certificates = db.getCertificates(student.roll_number);
  const content = renderCertificates({ certificates });
  renderPage(res, req, { title: 'Chứng chỉ', currentPath: '/MyCertificates', content, student });
});

// 12. Shopping Cart & Finance
app.get('/ShoppingCart', (req, res) => {
  const student = db.getStudent(req.student.roll_number) || req.student;
  const cartItems = db.getShoppingCart(student.roll_number);
  const successMsg = req.query.success ? (req.lang === 'en' ? 'Fee payment completed successfully!' : 'Thanh toán khoản phí thành công!') : null;
  const errorMsg = req.query.error ? decodeURIComponent(req.query.error) : null;
  const content = renderShoppingCart({ cartItems, student, errorMsg, successMsg });
  renderPage(res, req, { title: 'Học phí & Giỏ hàng', currentPath: '/ShoppingCart', content, student });
});

app.get('/CoursePendingPayment', (req, res) => {
  const student = db.getStudent(req.student.roll_number) || req.student;
  const semester = req.query.semester || 'Fall2026';
  const content = renderCoursePendingPayment({ student, pendingCourses: [], currentSemester: semester, lang: req.lang });
  renderPage(res, req, { title: req.lang === 'en' ? 'Course Placement Fee' : 'Phí xếp lớp', currentPath: '/CoursePendingPayment', content, student });
});

app.all('/ShoppingCart/ResumePendingPayment', (req, res) => {
  res.redirect('/CoursePendingPayment');
});

app.post('/ShoppingCart/Pay', (req, res) => {
  const { item_id } = req.body;
  const result = db.payCartItem(req.student.roll_number, item_id);
  if (!result.success) {
    return res.redirect('/ShoppingCart?error=' + encodeURIComponent(result.error));
  }
  res.redirect('/ShoppingCart?success=1');
});

app.get('/Transaction', (req, res) => {
  const student = db.getStudent(req.student.roll_number) || req.student;
  const transactions = db.getTransactions(student.roll_number);
  const content = renderTransactions({ transactions, student });
  renderPage(res, req, { title: 'Lịch sử giao dịch', currentPath: '/Transaction', content, student });
});

app.get('/Finance/Topup', (req, res) => {
  const student = db.getStudent(req.student.roll_number) || req.student;
  const isEn = req.lang === 'en';
  const successMsg = req.query.success ? (isEn ? 'Topup to CAP Wallet successful!' : 'Nạp tiền vào ví CAP thành công!') : null;
  const content = renderTopup({ student, successMsg });
  renderPage(res, req, { title: 'Nạp tiền ví CAP', currentPath: '/Finance/Topup', content, student });
});

app.post('/Finance/Topup', (req, res) => {
  const { amount, method } = req.body;
  const num = parseFloat(amount) || 0;
  if (num > 0) {
    db.addTransaction(req.student.roll_number, num, 'Nạp tiền ví', 'Nạp tiền qua ' + method, method);
  }
  res.redirect('/Finance/Topup?success=1');
});

// 13. Applications
app.get('/Application/Catalog', (req, res) => {
  const student = req.student;
  const content = renderApplicationCatalog();
  renderPage(res, req, { title: 'Danh mục đơn từ', currentPath: '/Application/Catalog', content, student });
});

app.get('/Application', (req, res) => {
  const student = req.student;
  const applications = db.getApplications(student.roll_number);
  const isEn = req.lang === 'en';
  const successMsg = req.query.success ? (isEn ? 'Your application has been submitted successfully!' : 'Đơn của bạn đã được gửi thành công đến phòng Đào tạo!') : null;
  const content = renderApplications({ applications, successMsg });
  renderPage(res, req, { title: 'Lịch sử đơn đã gửi', currentPath: '/Application', content, student });
});

app.post('/Application/Submit', (req, res) => {
  const { app_type, reason } = req.body;
  if (app_type && reason) {
    db.createApplication(req.student.roll_number, app_type, reason);
  }
  res.redirect('/Application?success=1');
});

// 14. Cross Class Change
app.get('/CrossClassChange', (req, res) => {
  const student = req.student;
  const requests = db.getCrossClassRequests(student.roll_number);
  const isEn = req.lang === 'en';
  const successMsg = req.query.success ? (isEn ? 'Class transfer request submitted!' : 'Đơn xin đổi lớp chéo đã được nộp!') : null;
  const content = renderCrossClass({ requests, successMsg });
  renderPage(res, req, { title: 'Đơn đổi lớp chéo', currentPath: '/CrossClassChange', content, student });
});

app.post('/CrossClassChange/Submit', (req, res) => {
  const { subject_code, from_class, to_class, reason } = req.body;
  if (subject_code && from_class && to_class) {
    db.addCrossClassRequest(req.student.roll_number, subject_code, from_class, to_class, reason || '');
  }
  res.redirect('/CrossClassChange?success=1');
});

// 15. Wishlist
app.get('/Wishlist', (req, res) => {
  const student = req.student;
  const wishlist = db.getWishlist(student.roll_number);
  const subjects = db.getSubjects();
  const isEn = req.lang === 'en';
  const successMsg = req.query.success ? (isEn ? 'Course added to Wishlist waitlist!' : 'Đã thêm môn vào danh sách Wishlist chờ xếp lớp!') : null;
  const content = renderWishlist({ wishlist, subjects, successMsg });
  renderPage(res, req, { title: 'Wishlist chờ lớp', currentPath: '/Wishlist', content, student });
});

app.get('/Wishlist/Register', (req, res) => {
  const student = req.student;
  const wishlist = db.getWishlist(student.roll_number);
  const subjects = db.getSubjects();
  const isEn = req.lang === 'en';
  const successMsg = req.query.success ? (isEn ? 'Course wishlist registration submitted successfully!' : 'Đã gửi đăng ký nguyện vọng Wishlist thành công!') : null;
  const content = renderWishlistRegister({ subjects, wishlist, successMsg, lang: req.lang });
  renderPage(res, req, { title: req.lang === 'en' ? 'Register Wishlist' : 'Đăng ký wishlist', currentPath: '/Wishlist/Register', content, student });
});

app.post('/Wishlist/Register', (req, res) => {
  const { subject_code, semester_code, desired_slot, note } = req.body;
  if (subject_code && desired_slot) {
    db.addWishlist(req.student.roll_number, subject_code, semester_code || 'Fall2026', desired_slot, note || '');
  }
  res.redirect('/Wishlist/Register?success=1');
});

// 16. Startup Groups
app.get('/StartupGroup', (req, res) => {
  const student = req.student;
  const groups = db.getStartupGroups(student.roll_number);
  const isEn = req.lang === 'en';
  const successMsg = req.query.success ? (isEn ? 'Startup project profile submitted!' : 'Hồ sơ dự án khởi nghiệp đã được gửi!') : null;
  const content = renderStartup({ groups, successMsg });
  renderPage(res, req, { title: 'Đơn khởi nghiệp', currentPath: '/StartupGroup', content, student });
});

app.get('/StartupGroup/Add', (req, res) => {
  const student = req.student;
  const isEn = req.lang === 'en';
  const successMsg = req.query.success ? (isEn ? 'Startup project proposal submitted successfully!' : 'Đã nộp hồ sơ đề án khởi nghiệp thành công!') : null;
  const content = renderStartupAdd({ successMsg, lang: req.lang });
  renderPage(res, req, { title: req.lang === 'en' ? 'Submit Startup Proposal' : 'Gửi đơn khởi nghiệp', currentPath: '/StartupGroup/Add', content, student });
});

app.post('/StartupGroup/Add', (req, res) => {
  const { project_name, field, member_count, description } = req.body;
  if (project_name && field) {
    db.addStartupGroup(req.student.roll_number, project_name, field, parseInt(member_count) || 3, description || '');
  }
  res.redirect('/StartupGroup/Add?success=1');
});

// 17. FYE Log & Mentor Feedback
app.get('/FyeCheckInLog', (req, res) => {
  const student = req.student;
  const logs = db.getFyeLogs(student.roll_number);
  const content = renderFyeLogs({ logs });
  renderPage(res, req, { title: 'Check-in FYE Log', currentPath: '/FyeCheckInLog', content, student });
});

app.get('/FyeMentorFeedback', (req, res) => {
  const student = req.student;
  const feedbacks = db.getMentorFeedback(student.roll_number);
  const isEn = req.lang === 'en';
  const successMsg = req.query.success ? (isEn ? 'Thank you for submitting mentor feedback!' : 'Cảm ơn bạn đã gửi đánh giá Cố vấn học tập!') : null;
  const content = renderMentorFeedback({ feedbacks, successMsg });
  renderPage(res, req, { title: 'Đánh giá Mentor', currentPath: '/FyeMentorFeedback', content, student });
});

app.post('/FyeMentorFeedback/Submit', (req, res) => {
  const { mentor_name, semester_code, rating, comment } = req.body;
  if (mentor_name) {
    db.addMentorFeedback(req.student.roll_number, mentor_name, semester_code || 'Fall2026', parseInt(rating) || 5, comment || '');
  }
  res.redirect('/FyeMentorFeedback?success=1');
});

// 18. Documents & User Guide
app.get('/Document', (req, res) => {
  const student = req.student;
  const documents = db.getDocuments();
  const content = renderDocuments({ documents });
  renderPage(res, req, { title: req.lang === 'en' ? 'Academic Documents' : 'Tài liệu', currentPath: '/Document', content, student });
});

app.get('/Document/DrivePdf', (req, res) => {
  const student = req.student;
  const content = renderUserGuide({ lang: req.lang });
  renderPage(res, req, { title: req.lang === 'en' ? 'User Guide' : 'Hướng dẫn sử dụng', currentPath: '/Document/DrivePdf', content, student });
});

// 19. News List & Details
app.get('/News', (req, res) => {
  const student = req.student;
  const catId = req.query.CAPNewsTypeId || req.query.FAPNewsTypeId || '';
  const newsList = db.getNews(catId || null);
  const content = renderNewsList({ newsList, activeCat: catId });
  renderPage(res, req, { title: 'Tin tức & Thông báo', currentPath: '/News', content, student });
});

app.get('/News/Detail/:id', (req, res) => {
  const student = req.student;
  const item = db.getNewsDetail(req.params.id);
  const content = renderNewsDetail({ item });
  renderPage(res, req, { title: item ? item.title : 'Chi tiết tin', currentPath: '/News', content, student });
});

// 20. Student Profile & Edit Profile
app.get('/Account', (req, res) => {
  const student = db.getStudent(req.student.roll_number) || req.student;
  const content = renderAccount({ student });
  renderPage(res, req, { title: 'Thông tin cá nhân', currentPath: '/Account', content, student });
});

app.get('/StudentProfile', (req, res) => {
  const student = db.getStudent(req.student.roll_number) || req.student;
  const isEn = req.lang === 'en';
  const successMsg = req.query.success ? (isEn ? 'Student profile updated successfully!' : 'Cập nhật hồ sơ sinh viên thành công!') : null;
  const content = renderEditProfile({ student, successMsg });
  renderPage(res, req, { title: 'Cập nhật hồ sơ', currentPath: '/StudentProfile', content, student });
});

app.post('/StudentProfile/Update', (req, res) => {
  const { phone, address, gender, dob } = req.body;
  db.updateStudentProfile(req.student.roll_number, { phone, address, gender, dob });
  res.redirect('/StudentProfile?success=1');
});

// 21. Notification APIs
app.get('/Notification/UnreadCount', (req, res) => {
  const count = db.getUnreadNotifCount(req.student.roll_number);
  res.json({ ok: true, count });
});

app.get('/Notification/BellList', (req, res) => {
  const notifs = db.getNotifications(req.student.roll_number);
  const html = notifs.map(n => `
    <a href="${n.link_url || '#'}" class="dropdown-item p-2 notify-item ${n.is_read ? 'read' : 'unread'}" data-notif-id="${n.id}">
      <div class="notify-icon bg-primary-subtle text-primary">
        <i class="ri-notification-line"></i>
      </div>
      <div class="notify-details">
        <span class="notify-title fw-semibold text-white">${n.title}</span>
        <small class="text-muted d-block">${n.body}</small>
        <span class="text-muted fs-11">${n.created_at}</span>
      </div>
    </a>
  `).join('') || '<div class="text-center p-3 text-muted">Không có thông báo mới</div>';
  res.send(html);
});

app.post('/Notification/MarkRead', (req, res) => {
  const id = parseInt(req.body.id);
  if (id) db.markNotifRead(id);
  res.json({ ok: true });
});

app.post('/Notification/MarkReadAll', (req, res) => {
  db.markAllNotifRead(req.student.roll_number);
  res.json({ ok: true, hasUnread: false, unreadCount: 0 });
});

// 22. Catch-all fallback 404 handler that stays inside CAP layout
app.use((req, res) => {
  const student = req.student || db.getStudent('CT193667');
  const isEn = req.lang === 'en';
  const content = `
    <div class="card text-center py-5">
      <div class="card-body">
        <div class="avatar-lg bg-soft-warning text-warning rounded-circle mx-auto d-flex align-items-center justify-content-center fs-28 mb-3">
          <i class="ri-tools-line"></i>
        </div>
        <h4 class="fw-bold text-primary">${isEn ? 'Feature Under Development' : 'Tính năng đang trong giai đoạn cập nhật'}</h4>
        <p class="text-muted max-w-500 mx-auto">
          ${isEn ? `The requested page <code>${req.path}</code> is scheduled for upcoming releases of CAP.` : `Trang yêu cầu <code>${req.path}</code> đã được ghi nhận trong lộ trình nâng cấp hệ thống CAP.`}
        </p>
        <a href="/" class="btn btn-primary btn-sm"><i class="ri-home-4-line me-1"></i>${isEn ? 'Back to Home' : 'Quay lại Trang chủ'}</a>
      </div>
    </div>
  `;
  renderPage(res, req, { title: isEn ? 'Under Maintenance' : 'Đang cập nhật', currentPath: req.path, content, student });
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('=======================================================');
    console.log(` CAP Server (CTL University) is running on port ${PORT}!`);
    console.log(` Access URL: http://localhost:${PORT}/`);
    console.log('=======================================================');
  });
}

module.exports = app;
