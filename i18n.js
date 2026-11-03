// i18n translation system for CAP (CTL Academic Portal)
// Supports Vietnamese ('vi') and English ('en')

const translations = {
  vi: {
    appName: 'CỔNG ĐÀO TẠO CTL (CAP)',
    appSub: 'Hệ thống quản lý đào tạo trường đại học CTL',
    portalTitle: 'Trang chủ - CAP - CTL Education',
    campusHanoi: 'Cơ sở Hà Nội (HN)',
    version: 'Phiên bản: 1.0.0.0',
    footerCopy: '2026 © CAP - CTL University Academic Portal',
    footerSub: 'Hệ thống quản lý đào tạo CTL Education',
    langTitle: 'Chọn ngôn ngữ',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    notifications: 'Thông báo',
    markAllRead: 'Đã đọc tất cả',
    myAccount: 'Hồ sơ cá nhân',
    switchAccount: 'Chuyển tài khoản',
    logout: 'Đăng xuất',
    loginTitle: 'Đăng nhập hệ thống',
    loginGoogle: 'Đăng nhập với tài khoản Google CTL (@ctl.edu.vn)',
    loginOr: 'hoặc nhập tài khoản',
    loginUsername: 'Tên đăng nhập / Mã sinh viên',
    loginPassword: 'Mật khẩu',
    quickTestAcc: 'Chọn nhanh tài khoản thử nghiệm:',
    loginBtn: 'Đăng nhập hệ thống',
    navHome: 'Trang chủ',
    navAcademics: 'Học tập',
    navTimetable: 'Thời khóa biểu',
    navExams: 'Lịch thi',
    studentInfo: 'Thông tin sinh viên',
    studentStatus: 'Trạng thái',
    programCode: 'Mã chương trình',
    email: 'Email',
    cohort: 'Khóa',
    balance: 'Số dư ví',
    walletAmount: 'VND',
    shortcuts: 'Lối tắt truy cập nhanh',
    latestNews: 'Tin tức mới nhất',
    readMore: 'Xem chi tiết',
    allNews: 'Xem tất cả'
  },
  en: {
    appName: 'CTL ACADEMIC PORTAL (CAP)',
    appSub: 'Academic Management System - CTL University',
    portalTitle: 'Home - CAP - CTL Education',
    campusHanoi: 'Hanoi Campus (HN)',
    version: 'Version: 1.0.0.0',
    footerCopy: '2026 © CAP - CTL University Academic Portal',
    footerSub: 'CTL Education Academic Management System',
    langTitle: 'Select Language',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    myAccount: 'My Profile',
    switchAccount: 'Switch Account',
    logout: 'Logout',
    loginTitle: 'System Login',
    loginGoogle: 'Sign in with Google CTL (@ctl.edu.vn)',
    loginOr: 'or enter credentials',
    loginUsername: 'Username / Student ID',
    loginPassword: 'Password',
    quickTestAcc: 'Quick Test Accounts:',
    loginBtn: 'Sign In',
    navHome: 'Home',
    navAcademics: 'Academics',
    navTimetable: 'Weekly Timetable',
    navExams: 'Exam Schedule',
    studentInfo: 'Student Information',
    studentStatus: 'Status',
    programCode: 'Program Code',
    email: 'Email',
    cohort: 'Cohort',
    balance: 'Wallet Balance',
    walletAmount: 'VND',
    shortcuts: 'Quick Shortcuts',
    latestNews: 'Latest Announcements',
    readMore: 'Read details',
    allNews: 'View all'
  }
};

const titleTranslations = {
  'Thời khóa biểu': 'Weekly Timetable',
  'Lịch thi': 'Exam Schedule',
  'Lịch thi của tôi': 'My Exam Schedule',
  'Báo cáo điểm danh': 'Attendance Report',
  'Báo cáo điểm': 'Grade Report',
  'Báo cáo điểm số': 'Grade Report',
  'Bảng điểm tích lũy': 'Cumulative Transcript',
  'Điều kiện OJT': 'OJT Requirements',
  'Điều kiện KLTN': 'Graduation Thesis Requirements',
  'Khung chương trình': 'Curriculum Roadmap',
  'Danh mục môn học': 'Course Catalog',
  'Chứng chỉ': 'Certificates',
  'Học phí & Giỏ hàng': 'Tuition & Shopping Cart',
  'Phí xếp lớp': 'Course Placement Fee',
  'Lịch sử giao dịch': 'Transaction History',
  'Nạp tiền ví CAP': 'Topup CAP Wallet',
  'Danh mục đơn từ': 'Application Catalog',
  'Lịch sử đơn đã gửi': 'Application History',
  'Xem đơn': 'View Applications',
  'Gửi đơn': 'Submit Application',
  'Đơn đổi lớp chéo': 'Class Transfer Request',
  'Wishlist': 'Wishlist',
  'Wishlist chờ lớp': 'Course Wishlist',
  'Đăng ký wishlist': 'Register Wishlist',
  'Đăng ký nguyện vọng Wishlist': 'Course Wishlist Registration',
  'Đơn khởi nghiệp': 'Startup Applications',
  'Danh sách đơn khởi nghiệp': 'Startup Proposals',
  'Gửi đơn khởi nghiệp': 'Submit Startup Proposal',
  'Check-in FYE Log': 'FYE Check-in Log',
  'Đánh giá Mentor': 'Mentor Feedback',
  'Tài liệu quy chế & Hướng dẫn': 'Academic Regulations & Guides',
  'Tài liệu': 'Documents',
  'Hướng dẫn sử dụng': 'User Guide',
  'Tin tức & Thông báo': 'News & Announcements',
  'Chi tiết tin': 'News Detail',
  'Thông tin cá nhân': 'Personal Information',
  'Cập nhật hồ sơ': 'Update Profile',
  'Đang cập nhật': 'Under Maintenance'
};

function t(key, lang = 'vi') {
  const currentLang = (lang === 'en') ? 'en' : 'vi';
  return translations[currentLang][key] || translations['vi'][key] || key;
}

function getDictionary(lang = 'vi') {
  const currentLang = (lang === 'en') ? 'en' : 'vi';
  return translations[currentLang];
}

function translateTitle(title, lang = 'vi') {
  if (lang !== 'en') return title;
  return titleTranslations[title] || title;
}

// Master translation dictionary mapping Vietnamese phrases to English
const htmlReplacements = [
  // Topbar and meta
  ['lang="vi"', 'lang="en"'],
  ['content="vi"', 'content="en"'],
  ['Trang chủ - CAP - CTL Education', 'Home - CAP - CTL Education'],
  ['Hệ thống quản lý đào tạo trường đại học CTL', 'Academic Management System - CTL University'],
  ['Cơ sở Hà Nội (HN)', 'Hanoi Campus (HN)'],
  ['Chọn ngôn ngữ', 'Select Language'],
  ['<span class="align-middle d-none d-lg-inline-block">Tiếng Việt</span>', '<span class="align-middle d-none d-lg-inline-block">English</span>'],
  ['flags/vn.jpg', 'flags/gb.jpg'],
  ['>Tiếng Việt<', '>English<'],
  ['>Thông báo<', '>Notifications<'],
  ['Đã đọc tất cả', 'Mark all as read'],
  ['Xem chi tiết tất cả thông báo', 'View all notifications'],
  ['My Account', 'My Profile'],
  ['Đăng xuất', 'Logout'],
  ['Chào mừng', 'Welcome'],

  // Student Profile Card
  ['Thông tin sinh viên', 'Student Information'],
  ['<i class="ri-shield-check-line"></i>Trạng thái', '<i class="ri-shield-check-line"></i>Status'],
  ['<i class="ri-book-open-line"></i>Mã chương trình', '<i class="ri-book-open-line"></i>Program Code'],
  ['<i class="ri-calendar-line"></i>Khóa', '<i class="ri-calendar-line"></i>Cohort'],
  ['<i class="ri-wallet-3-line"></i>Số dư', '<i class="ri-wallet-3-line"></i>Balance'],
  ['HD (Hoạt động)', 'HD (Active)'],

  // Home News Card
  ['Tin tức mới nhất', 'Latest Announcements'],
  ['Xem tất cả', 'View all'],
  ['Loại tin:', 'Category:'],
  ['>Tất cả<', '>All<'],
  ['Thông báo tài chính', 'Financial Notices'],
  ['Thông tin chung', 'General Info'],
  ['Thông tin Đào tạo', 'Academic Affairs'],
  ['Thông tin Khảo Thí', 'Examinations'],

  // Quick Menu & Sidebar
  ['Menu nhanh', 'Quick Access Menu'],
  ['Truy cập nhanh các chức năng thường dùng', 'Quick access to frequently used features'],
  ['Thời khóa biểu', 'Weekly Timetable'],
  ['Lịch thi của tôi', 'My Exam Schedule'],
  ['Lịch thi', 'Exam Schedule'],
  ['Lịch học', 'Schedules'],
  ['Báo cáo học tập', 'Academic Reports'],
  ['Báo cáo điểm danh', 'Attendance Report'],
  ['Báo cáo điểm số', 'Grade Report'],
  ['Báo cáo điểm', 'Grade Report'],
  ['Bảng điểm tích lũy', 'Cumulative Transcript'],
  ['Bảng điểm', 'Transcript'],
  ['Điều kiện OJT', 'OJT Requirements'],
  ['Điều kiện KLTN', 'Graduation Thesis Requirements'],
  ['Môn học &amp; chương trình', 'Courses &amp; Curriculum'],
  ['Môn học & chương trình', 'Courses & Curriculum'],
  ['Khung chương trình', 'Curriculum Roadmap'],
  ['Môn học', 'Courses'],
  ['Chứng chỉ của tôi', 'My Certificates'],
  ['Chứng chỉ', 'Certificates'],
  ['Tin tức &amp; tài liệu', 'News &amp; Documents'],
  ['Tin tức & tài liệu', 'News & Documents'],
  ['Tin tức &amp; Thông báo', 'News &amp; Announcements'],
  ['Tin tức & Thông báo', 'News & Announcements'],
  ['Tin tức', 'News'],
  ['Tài liệu', 'Documents'],
  ['Hướng dẫn sử dụng', 'User Guide'],

  ['Đơn từ', 'Applications'],
  ['Xem đơn', 'View Applications'],
  ['Gửi đơn', 'Submit Application'],
  ['Đơn đổi lớp chéo', 'Class Transfer Request'],
  ['Đơn khởi nghiệp', 'Startup Applications'],
  ['Danh sách đơn khởi nghiệp', 'Startup Proposals'],
  ['Gửi đơn khởi nghiệp', 'Submit Startup Proposal'],

  ['Tài chính', 'Finance'],
  ['Thanh toán các khoản phí', 'Pay Fees & Tuition'],
  ['Phí xếp lớp', 'Course Placement Fee'],
  ['Lịch sử giao dịch', 'Transaction History'],
  ['Thanh toán', 'Payments'],

  ['Wishlist chờ lớp', 'Course Wishlist'],
  ['Danh sách chờ lớp', 'Waitlist Status'],
  ['Đăng ký wishlist', 'Register Wishlist'],
  ['Đăng ký nguyện vọng Wishlist', 'Course Wishlist Registration'],
  ['Đăng ký nguyện vọng mở lớp (Wishlist)', 'Course Wishlist Registration'],
  ['Đăng ký tham gia vườn ươm khởi nghiệp', 'Register for Startup Incubator'],

  ['Hoạt động sinh viên', 'Student Activities'],
  ['Check-in FYE Log', 'FYE Check-in Log'],
  ['Feedback Mentor', 'Mentor Feedback'],
  ['Đánh giá Mentor', 'Mentor Feedback'],
  ['Tài khoản', 'Account'],
  ['Cá nhân', 'Profile'],
  ['Thông tin cá nhân', 'Personal Information'],
  ['Cập nhật hồ sơ', 'Update Profile'],

  // Table headers & common terms
  ['Học kỳ:', 'Semester:'],
  ['Học kỳ', 'Semester'],
  ['Tổng số môn thi:', 'Total exams:'],
  ['Tổng số môn:', 'Total courses:'],
  ['Hình thức thi', 'Exam Format'],
  ['Loại thi', 'Exam Type'],
  ['Ngày công bố điểm', 'Result Date'],
  ['Ghi chú điểm danh', 'Attendance Note'],
  ['Ghi chú', 'Note'],
  ['Ngày thi', 'Exam Date'],
  ['Ngày', 'Date'],
  ['Thời gian', 'Time'],
  ['Phòng học', 'Classroom'],
  ['Phòng:', 'Room:'],
  ['Phòng', 'Room'],
  ['Giảng viên', 'Lecturer'],
  ['GV:', 'Lecturer:'],
  ['Mã môn', 'Course Code'],
  ['Tên môn học', 'Course Name'],
  ['Tên môn', 'Course Name'],
  ['Môn thi', 'Course / Exam'],
  ['Số tín chỉ', 'Credits'],
  ['Điểm tổng kết', 'Final Grade'],
  ['Trạng thái', 'Status'],
  ['Thao tác', 'Action'],
  ['Số tiền', 'Amount'],

  // Days of week
  ['Thứ Hai', 'Monday'],
  ['Thứ Ba', 'Tuesday'],
  ['Thứ Tư', 'Wednesday'],
  ['Thứ Năm', 'Thursday'],
  ['Thứ Sáu', 'Friday'],
  ['Thứ Bảy', 'Saturday'],
  ['Chủ Nhật', 'Sunday'],

  // Status badges
  ['Chưa diễn ra', 'Upcoming'],
  ['Đã điểm danh', 'Attended'],
  ['Vắng mặt', 'Absent'],
  ['Đạt', 'Passed'],
  ['Chưa đạt', 'Not Passed'],
  ['Chưa thanh toán', 'Unpaid'],
  ['Đã thanh toán', 'Paid'],
  ['Đang chờ duyệt', 'Pending Review'],
  ['Đã duyệt', 'Approved'],
  ['Từ chối', 'Rejected'],
  ['Đủ điều kiện', 'Eligible'],
  ['Chưa đủ điều kiện', 'Not Eligible'],
  ['Đã cấp', 'Issued'],
  ['Chờ cấp', 'Pending Issue'],

  // Actions & Buttons
  ['Thanh toán ngay', 'Pay Now'],
  ['Nạp tiền vào ví', 'Top up Wallet'],
  ['Nạp tiền ví CAP', 'Topup CAP Wallet'],
  ['Nộp đơn đổi lớp', 'Submit Transfer Request'],
  ['Nộp hồ sơ dự án', 'Submit Proposal'],
  ['Gửi phản hồi đánh giá', 'Submit Feedback'],
  ['Lưu thay đổi', 'Save Changes'],
  ['Xác nhận', 'Confirm'],
  ['Quay lại', 'Back'],
  ['Hủy bỏ', 'Cancel'],
  ['Tải về', 'Download'],
  ['Tải tài liệu', 'Download Document'],

  // Financial terms
  ['Số dư ví tài khoản CAP', 'CAP Wallet Balance'],
  ['Tổng số tiền cần thanh toán', 'Total Pending Payment'],
  ['Phương thức nạp tiền', 'Payment Method'],
  ['Xác nhận nạp tiền vào ví CAP', 'Confirm Topup to CAP Wallet'],
  ['Lịch sử các giao dịch phát sinh', 'Account Transaction History'],
  ['Mã GD', 'Txn ID'],
  ['Loại GD', 'Txn Type'],
  ['Thời gian GD', 'Txn Date'],
  ['Số dư sau GD', 'Balance After'],
  ['Nạp tiền ví', 'Wallet Topup'],
  ['Thanh toán học phí', 'Tuition Payment'],

  // Specific News Titles
  ['Thông báo lịch thi kết thúc học phần lần 1, lần 2 các môn học Block 1-4 học kỳ Fall 2026', 'Notification of Final Exam Schedule (1st & 2nd sittings) for Block 1-4, Fall 2026'],
  ['Thông báo danh sách thi kết thúc học phần lần 2 võ 1 VOV114 half 1 ngày 04/11/2026', 'Notification of Exam List for VOV114 Vovinam 1 (2nd sitting), Half 1 on Nov 04, 2026'],
  ['Thông báo điểm thi giữa kỳ môn KRG301 học kỳ Fall 2026', 'Midterm Exam Results for KRG301, Fall 2026 Semester'],
  ['Thông báo điểm thi giữa kỳ KOR411, KRL402, điểm thi kết thúc học phần lần 1 võ 1 VOV114, điểm thi kết thúc học phần lần 2 võ 2,3 VOV124, VOV134 half 1 học kỳ Fall 2026', 'Midterm & Final Exam Results for KOR411, KRL402, VOV114, VOV124, VOV134, Fall 2026'],

  // Version and footers
  ['Phiên bản: 1.0.0.0', 'Version: 1.0.0.0'],
  ['Phiên bản: 2.0.0.0', 'Version: 1.0.0.0'],
  ['Hệ thống quản lý đào tạo CTL Education', 'CTL Education Academic Management System']
];

function translateHtml(html, lang = 'vi') {
  if (lang !== 'en' || !html) return html;

  let out = html;
  for (const [search, replace] of htmlReplacements) {
    if (out.includes(search)) {
      out = out.split(search).join(replace);
    }
  }

  return out;
}

module.exports = {
  translations,
  t,
  getDictionary,
  translateTitle,
  translateHtml
};
