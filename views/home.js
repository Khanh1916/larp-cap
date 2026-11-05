// Student home page: profile card, latest news, quick-access menu.
// Rendered inside the shared layout. Data is HTML-escaped by the caller.

// [href, icon, Vietnamese label, English label]
const QUICK_MENU = [
  ['Học tập', 'Academics', [
    ['/WeeklyTimetable', 'ri-calendar-2-line', 'Thời khóa biểu', 'Weekly timetable'],
    ['/ExamSchedule', 'ri-calendar-todo-line', 'Lịch thi', 'Exam schedule'],
    ['/Report/Attendance', 'ri-user-follow-line', 'Báo cáo điểm danh', 'Attendance report'],
    ['/Report/Grade', 'ri-bar-chart-box-line', 'Báo cáo điểm', 'Grade report'],
    ['/Report/Transcript', 'ri-file-list-2-line', 'Bảng điểm', 'Transcript'],
    ['/Report/OjtConditions', 'ri-briefcase-line', 'Điều kiện OJT', 'OJT conditions'],
    ['/Report/ThesisConditions', 'ri-graduation-cap-line', 'Điều kiện KLTN', 'Thesis conditions'],
    ['/Subject', 'ri-book-2-line', 'Môn học', 'Course catalog'],
    ['/Curriculum', 'ri-road-map-line', 'Khung chương trình', 'Curriculum'],
    ['/MyCertificates', 'ri-award-line', 'Chứng chỉ', 'Certificates'],
    ['/News', 'ri-newspaper-line', 'Tin tức', 'News'],
    ['/Document', 'ri-folder-3-line', 'Tài liệu', 'Documents'],
    ['/Document/DrivePdf', 'ri-question-line', 'Hướng dẫn sử dụng', 'User guide']
  ]],
  ['Đơn từ', 'Applications', [
    ['/Application', 'ri-file-list-3-line', 'Xem đơn', 'My applications'],
    ['/Application/Catalog', 'ri-file-edit-line', 'Gửi đơn', 'Submit application'],
    ['/CrossClassChange', 'ri-exchange-line', 'Đơn đổi lớp chéo', 'Class transfer'],
    ['/StartupGroup', 'ri-lightbulb-line', 'Danh sách đơn khởi nghiệp', 'Startup proposals'],
    ['/StartupGroup/Add', 'ri-lightbulb-flash-line', 'Gửi đơn khởi nghiệp', 'Submit startup proposal']
  ]],
  ['Tài chính', 'Finance', [
    ['/ShoppingCart', 'ri-shopping-cart-2-line', 'Thanh toán các khoản phí', 'Pay fees'],
    ['/CoursePendingPayment', 'ri-money-dollar-circle-line', 'Phí xếp lớp', 'Course placement fee'],
    ['/Transaction', 'ri-history-line', 'Lịch sử giao dịch', 'Transactions'],
    ['/Finance/Topup', 'ri-wallet-3-line', 'Nạp tiền ví CAP', 'Top up wallet']
  ]],
  ['Wishlist', 'Wishlist', [
    ['/Wishlist', 'ri-list-check-2', 'Danh sách chờ lớp', 'Waitlist'],
    ['/Wishlist/Register', 'ri-heart-add-line', 'Đăng ký wishlist', 'Register wishlist']
  ]],
  ['Hoạt động sinh viên', 'Student activities', [
    ['/FyeCheckInLog', 'ri-map-pin-user-line', 'Check-in Log', 'Check-in log'],
    ['/FyeMentorFeedback', 'ri-chat-smile-2-line', 'Feedback Mentor', 'Mentor feedback']
  ]],
  ['Tài khoản', 'Account', [
    ['/Account', 'ri-user-star-line', 'Thông tin cá nhân', 'Profile'],
    ['/StudentProfile', 'ri-edit-box-line', 'Cập nhật hồ sơ', 'Update profile'],
    ['/Auth/ChangePassword', 'ri-lock-password-line', 'Đổi mật khẩu', 'Change password']
  ]]
];

function metric(tone, icon, labelText, value, valueClass = '') {
  return `
              <div class="col-sm-6 col-xl">
                <div class="fap-home-student-card__metric">
                  <div class="fap-home-student-card__label fap-home-student-card__label--${tone}"><i class="${icon}"></i>${labelText}</div>
                  <div class="fap-home-student-card__value ${valueClass}">${value}</div>
                </div>
              </div>`;
}

function studentCard(student, isEn) {
  const balance = (Number(student.balance) || 0).toLocaleString('vi-VN');
  return `
  <div class="row mb-3">
    <div class="col-12">
      <div class="card fap-home-student-card">
        <div class="card-body p-0">
          <div class="row g-0 align-items-stretch">
            <div class="col-lg-3 fap-home-student-card__left p-4 d-flex flex-column justify-content-center">
              <div class="d-flex align-items-center gap-3">
                <div class="fap-home-student-card__avatar"><i class="ri-graduation-cap-line"></i></div>
                <div class="min-w-0">
                  <div class="text-white-50 small text-uppercase fw-semibold mb-1">${isEn ? 'Student Information' : 'Thông tin sinh viên'}</div>
                  <div class="fap-home-student-card__name mb-1">${student.full_name}</div>
                  <div class="fap-home-student-card__roll">${student.roll_number}</div>
                </div>
              </div>
            </div>
            <div class="col-lg-9 p-4">
              <div class="row g-3">
                ${metric('primary', 'ri-shield-check-line', isEn ? 'Status' : 'Trạng thái', student.status)}
                ${metric('info', 'ri-book-open-line', isEn ? 'Program code' : 'Mã chương trình', student.program_code, 'text-primary')}
                ${metric('warning', 'ri-mail-line', 'Email', student.email, 'text-break')}
                ${metric('secondary', 'ri-calendar-line', isEn ? 'Cohort' : 'Khóa', student.cohort)}
                <div class="col-sm-6 col-xl">
                  <div class="fap-home-student-card__metric fap-home-student-card__metric--wallet">
                    <div class="fap-home-student-card__label fap-home-student-card__label--success"><i class="ri-wallet-3-line"></i>${isEn ? 'Balance' : 'Số dư'}</div>
                    <div class="fap-home-student-card__wallet-amount">${balance} <span class="fs-6 fw-medium">VND</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function newsCard(news, categories, isEn) {
  const filters = categories.map(c =>
    `<a class="badge bg-light text-dark border fap-home-news-card__filter-btn" href="/News?CAPNewsTypeId=${encodeURIComponent(c.id)}">${c.name}</a>`
  ).join('\n            ');
  const items = news.length ? news.map(n => `
          <a class="fap-home-news-item" href="/News/Detail/${encodeURIComponent(n.id)}">
            <span class="fap-home-news-item__icon"><i class="ri-article-line"></i></span>
            <span class="fap-home-news-item__body">
              <span class="fap-home-news-item__title">${n.title}</span>
              <span class="fap-home-news-item__meta">
                <span><i class="ri-folder-2-line"></i>${n.category_name}</span>
                <span><i class="ri-calendar-line"></i>${n.published_at}</span>
              </span>
            </span>
            <i class="ri-arrow-right-s-line fap-home-news-item__arrow align-self-center"></i>
          </a>`).join('')
    : `<div class="text-center text-muted py-4">${isEn ? 'No announcements yet.' : 'Chưa có tin tức.'}</div>`;
  return `
      <div class="card fap-home-news-card">
        <div class="d-flex card-header justify-content-between align-items-center flex-wrap gap-2">
          <h4 class="header-title m-0 fap-home-news-card__header-title"><i class="ri-newspaper-line me-1 text-primary"></i>${isEn ? 'Latest Announcements' : 'Tin tức mới nhất'}</h4>
          <a class="btn btn-sm btn-soft-primary" href="/News">${isEn ? 'View all' : 'Xem tất cả'} <i class="ri-arrow-right-line ms-1"></i></a>
        </div>
        <div class="fap-home-news-card__filter">
          <div class="d-flex flex-wrap gap-1 align-items-center">
            <span class="fap-home-news-card__filter-label me-1">${isEn ? 'Category:' : 'Loại tin:'}</span>
            <a class="badge bg-primary fap-home-news-card__filter-btn" href="/News">${isEn ? 'All' : 'Tất cả'}</a>
            ${filters}
          </div>
        </div>
        <div class="card-body p-0">
          <div class="fap-home-news-list">${items}
          </div>
        </div>
      </div>`;
}

function quickMenu(isEn) {
  const groups = QUICK_MENU.map(([vi, en, links]) => `
        <div class="fap-home-quick-menu__group">
          <span class="fap-home-quick-menu__group-label">${isEn ? en : vi}</span>
        </div>${links.map(([href, icon, lvi, len]) => `
        <a class="fap-home-quick-menu__link" href="${href}">
          <span class="fap-home-quick-menu__link-icon" aria-hidden="true"><i class="${icon}"></i></span>
          <span class="fap-home-quick-menu__link-text">${isEn ? len : lvi}</span>
          <i class="ri-arrow-right-s-line fap-home-quick-menu__chevron" aria-hidden="true"></i>
        </a>`).join('')}`).join('');
  return `
      <aside class="fap-home-quick-menu" aria-labelledby="homeQuickMenuTitle">
        <div class="fap-home-quick-menu__accent" aria-hidden="true"></div>
        <div class="fap-home-quick-menu__header">
          <span class="fap-home-quick-menu__icon" aria-hidden="true"><i class="ri-apps-2-line"></i></span>
          <div class="fap-home-quick-menu__heading">
            <h4 class="fap-home-quick-menu__title" id="homeQuickMenuTitle">${isEn ? 'Quick Access' : 'Menu nhanh'}</h4>
            <p class="fap-home-quick-menu__subtitle">${isEn ? 'Frequently used features' : 'Truy cập nhanh các chức năng thường dùng'}</p>
          </div>
        </div>
        <nav class="fap-home-quick-menu__nav" aria-label="${isEn ? 'Quick access' : 'Menu nhanh'}">${groups}
        </nav>
      </aside>`;
}

function renderHome({ student, news = [], categories = [], lang = 'vi' }) {
  const isEn = lang === 'en';
  return `
  ${studentCard(student, isEn)}
  <div class="row g-3">
    <div class="col-lg-8">${newsCard(news, categories, isEn)}
    </div>
    <div class="col-lg-4">${quickMenu(isEn)}
    </div>
  </div>`;
}

module.exports = { renderHome, QUICK_MENU };
