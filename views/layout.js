const fs = require('fs');
const path = require('path');
const i18n = require('../i18n');

// NOTE: `title` and `student` must already be HTML-escaped by the caller (see renderPage in server.js).
// staffMenu: sidebar HTML for staff accounts (replaces the student menu and hides wallet/profile items).
// notifications: [{ id, title, body, href, created_at, is_read }] (escaped); unreadCount: number.
function renderLayout({ title, currentPath = '/', content = '', student, lang = 'vi', demoMode = false, staffMenu = '', notifications = [], unreadCount = 0 }) {
  const isStaff = Boolean(staffMenu);
  const dict = i18n.getDictionary(lang);
  const isEn = lang === 'en';
  const roll = student ? student.roll_number : 'CT193667';
  const name = student ? student.full_name : 'Cao Thanh Lâm';
  const avatar = student ? (student.avatar || (name.split(' ').map(n => n[0]).join('').slice(0, 3))) : 'CTL';
  const balance = student ? (Number(student.balance) || 0).toLocaleString('vi-VN') : '0';

  // Group active states based on currentPath matching the web gốc structure
  const isLichHocActive = ['/WeeklyTimetable', '/ExamSchedule'].includes(currentPath);
  const isBaoCaoActive = ['/Report/Attendance', '/Report/Grade', '/Report/Transcript', '/Report/OjtConditions', '/Report/ThesisConditions', '/Attendance', '/Transcript'].includes(currentPath);
  const isMonHocActive = ['/Subject', '/Curriculum'].includes(currentPath);
  const isTinTucActive = ['/News', '/Document', '/Document/DrivePdf'].includes(currentPath);
  const isKhoiNghiepActive = ['/StartupGroup', '/StartupGroup/Add', '/Services/Startup'].includes(currentPath);
  const isThanhToanActive = ['/ShoppingCart', '/CoursePendingPayment', '/Transaction', '/Finance/Topup'].includes(currentPath);
  const isFyeActive = ['/FyeCheckInLog', '/FyeMentorFeedback', '/Services/FYE', '/Mentor/Feedback'].includes(currentPath);
  const isCaNhanActive = ['/Account', '/StudentProfile', '/StudentProfile/Edit', '/Auth/ChangePassword'].includes(currentPath);

  return `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'vi'}" data-bs-theme="dark" data-layout-mode="fluid" data-menu-color="dark" data-topbar-color="dark" data-layout-position="fixed" data-sidenav-size="default" data-sidenav-user="true">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="description" content="${dict.appSub}">
    <meta http-equiv="Content-Language" content="${isEn ? 'en' : 'vi'}">
    <title>${title} - CAP - CTL Education</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#0a0f1d">
    <link rel="icon" type="image/svg+xml" href="/assets/images/logo-ctl.svg">

    <!-- Theme config -->
    <script src="/assets/vendor/jidox/js/config.js"></script>

    <link href="/assets/vendor/jidox/css/app.min.css" rel="stylesheet" type="text/css" id="app-style">
    <link href="/assets/vendor/jidox/css/icons.min.css" rel="stylesheet" type="text/css">
    <link href="/assets/vendor/flatpickr/flatpickr.min.css" rel="stylesheet">
    <link href="/assets/vendor/jquery-toast-plugin/jquery.toast.min.css" rel="stylesheet">
    <link href="/css/style.css" rel="stylesheet">
    <link href="/css/home.css" rel="stylesheet">
    <!-- CTL University Royal Amethyst & Violet Theme -->
    <link href="/css/cap-theme.css" rel="stylesheet">
    <script src="/js/theme.js"></script>
</head>
<body>
    <div class="d-none" id="preloader">
        <div class="d-none" id="status">
            <div class="bouncing-loader"><div></div><div></div><div></div></div>
        </div>
    </div>

    <div class="wrapper">
        <!-- Topbar -->
        <div class="navbar-custom">
            <div class="topbar container-fluid cap-topbar fap-topbar">
                <div class="d-flex align-items-center gap-lg-2 gap-1 fap-topbar__brand">
                    <div class="logo-topbar">
                        <a class="logo-light" href="/">
                            <span class="logo-lg"><img src="/assets/images/logo-ctlu.svg" alt="CTL University" width="180" height="48"></span>
                            <span class="logo-sm"><img src="/assets/images/logo-ctl.svg" alt="CTL" width="36" height="36"></span>
                        </a>
                        <a class="logo-dark" href="/">
                            <span class="logo-lg"><img src="/assets/images/logo-ctlu.svg" alt="CTL University" width="180" height="48"></span>
                            <span class="logo-sm"><img src="/assets/images/logo-ctl.svg" alt="CTL" width="36" height="36"></span>
                        </a>
                    </div>
                    <button class="button-toggle-menu">
                        <i class="ri-menu-2-line"></i>
                    </button>
                </div>

                <ul class="topbar-menu d-flex align-items-center gap-2">
                    <!-- Campus Selector -->
                    <li class="dropdown jidox-campus-topbar">
                        <a class="nav-link dropdown-toggle arrow-none" data-bs-toggle="dropdown" href="#" role="button" aria-haspopup="false" aria-expanded="false">
                            <i class="ri-map-pin-line fs-18 align-middle me-1"></i>
                            <span class="align-middle d-none d-lg-inline-block">${dict.campusHanoi}</span>
                            <i class="ri-arrow-down-s-line align-middle ms-1"></i>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end jidox-campus-topbar__menu">
                            <a href="#" class="dropdown-item active"><i class="ri-map-pin-2-fill me-1 text-primary"></i>Cơ sở Hà Nội (HN)</a>
                            <a href="#" class="dropdown-item"><i class="ri-map-pin-line me-1"></i>Cơ sở TP. Hồ Chí Minh (HCM)</a>
                            <a href="#" class="dropdown-item"><i class="ri-map-pin-line me-1"></i>Cơ sở Đà Nẵng (DN)</a>
                            <a href="#" class="dropdown-item"><i class="ri-map-pin-line me-1"></i>Cơ sở Quy Nhơn (QN)</a>
                            <a href="#" class="dropdown-item"><i class="ri-map-pin-line me-1"></i>Cơ sở Cần Thơ (CT)</a>
                        </div>
                    </li>

                    <!-- Language Switcher -->
                    <li class="dropdown">
                        <a class="nav-link dropdown-toggle arrow-none" data-bs-toggle="dropdown" href="#" role="button" aria-haspopup="false" aria-expanded="false">
                            <img src="${isEn ? '/assets/images/flags/gb.jpg' : '/assets/images/flags/vn.jpg'}" alt="flag" class="me-0 me-sm-1" height="12">
                            <span class="align-middle d-none d-lg-inline-block">${isEn ? 'English' : 'Tiếng Việt'}</span>
                            <i class="ri-arrow-down-s-line align-middle ms-1"></i>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end dropdown-menu-animated">
                            <a href="/lang/vi?returnUrl=${encodeURIComponent(currentPath)}" class="dropdown-item ${!isEn ? 'active' : ''}">
                                <img src="/assets/images/flags/vn.jpg" alt="vn" class="me-1" height="12">
                                <span class="align-middle">Tiếng Việt</span>
                            </a>
                            <a href="/lang/en?returnUrl=${encodeURIComponent(currentPath)}" class="dropdown-item ${isEn ? 'active' : ''}">
                                <img src="/assets/images/flags/gb.jpg" alt="en" class="me-1" height="12">
                                <span class="align-middle">English</span>
                            </a>
                        </div>
                    </li>

                    <!-- Notification (rendered server-side; js/cap-ui.js marks items read) -->
                    <li class="dropdown notification-list" data-cap-bell>
                        <a class="nav-link dropdown-toggle arrow-none fap-topbar-icon" data-bs-toggle="dropdown" href="#" role="button" aria-haspopup="false" aria-expanded="false">
                            <i class="ri-notification-3-line fs-22"></i>
                            <span class="noti-icon-badge ${unreadCount ? '' : 'd-none'}" data-cap-bell-badge></span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end dropdown-menu-animated dropdown-lg py-0">
                            <div class="p-2 border-top-0 border-start-0 border-end-0 border-dashed border">
                                <div class="row align-items-center">
                                    <div class="col">
                                        <h6 class="m-0 fs-16 fw-semibold">${dict.notifications}</h6>
                                    </div>
                                    <div class="col-auto">
                                        <a href="#" role="button" data-cap-bell-markall class="text-dark text-decoration-underline ${unreadCount ? '' : 'd-none'}">
                                            <small>${dict.markAllRead}</small>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="cap-maxh-250" data-simplebar>
                                ${notifications.length ? notifications.map(n => `
                                <a href="${n.href}" data-cap-notification="${n.id}" data-unread="${n.is_read ? '0' : '1'}" class="dropdown-item p-0 notify-item ${n.is_read ? 'read-noti' : 'unread-noti'} card m-0 shadow-none">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center">
                                            <div class="flex-shrink-0">
                                                <div class="notify-icon ${n.is_read ? 'bg-secondary' : 'bg-primary'}"><i class="ri-notification-2-line"></i></div>
                                            </div>
                                            <div class="flex-grow-1 text-truncate ms-2">
                                                <h5 class="noti-item-title fw-semibold fs-14 m-0">${n.title}</h5>
                                                <small class="noti-item-subtitle text-muted d-block text-truncate">${n.body}</small>
                                                <small class="text-muted">${n.created_at}</small>
                                            </div>
                                        </div>
                                    </div>
                                </a>`).join('') : `<div class="text-center text-muted small p-3">${isEn ? 'No notifications' : 'Không có thông báo'}</div>`}
                            </div>
                        </div>
                    </li>

                    <!-- Light / Dark Mode Toggle -->
                    <li class="d-none d-sm-inline-block">
                        <div class="nav-link fap-topbar-icon" id="light-dark-mode">
                            <i class="ri-sun-line fs-22"></i>
                        </div>
                    </li>

                    <!-- Fullscreen Toggle -->
                    <li class="d-none d-md-inline-block">
                        <a class="nav-link fap-topbar-icon" href="" data-toggle="fullscreen">
                            <i class="ri-fullscreen-line fs-22"></i>
                        </a>
                    </li>

                    <!-- User Dropdown -->
                    <li class="dropdown me-md-2">
                        <a class="nav-link dropdown-toggle arrow-none nav-user px-2 fap-topbar-user" data-bs-toggle="dropdown" href="#">
                            <span class="account-user-avatar cap-topbar-avatar fap-topbar-avatar">${avatar}</span>
                            <span class="d-lg-flex flex-column gap-1 d-none">
                                <h5 class="my-0">${name}</h5>
                                <h6 class="my-0 fw-normal">${roll}</h6>
                            </span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end dropdown-menu-animated profile-dropdown">
                            <div class="dropdown-header noti-title">
                                <h6 class="text-overflow m-0">${name}</h6>
                                <small class="text-muted">${roll}${isStaff ? '' : ` | ${dict.balance}: ${balance} VND`}</small>
                            </div>
${isStaff ? '' : `                            <a class="dropdown-item" href="/Account">
                                <i class="ri-account-circle-fill align-middle me-1"></i>
                                <span>${dict.myAccount}</span>
                            </a>
                            <a class="dropdown-item" href="/StudentProfile">
                                <i class="ri-user-settings-line align-middle me-1"></i>
                                <span>${isEn ? 'Update Profile' : 'Cập nhật hồ sơ'}</span>
                            </a>`}
                            <a class="dropdown-item" href="/Auth/ChangePassword">
                                <i class="ri-lock-password-line align-middle me-1"></i>
                                <span>${isEn ? 'Change Password' : 'Đổi mật khẩu'}</span>
                            </a>
                            ${demoMode ? `<div class="dropdown-divider my-1"></div>
                            <div class="dropdown-header noti-title py-1">
                                <small class="text-muted text-uppercase fw-bold">${dict.switchAccount}</small>
                            </div>
                            <a class="dropdown-item py-1 ${roll === 'CT193667' ? 'active' : ''}" href="/Auth/SwitchUser/CT193667">
                                <i class="ri-user-shared-line me-1 text-primary"></i>CT193667 (${isEn ? 'Thanh Lam' : 'Thanh Lâm'} - K19 IA)
                            </a>
                            <a class="dropdown-item py-1 ${roll === 'SE180123' ? 'active' : ''}" href="/Auth/SwitchUser/SE180123">
                                <i class="ri-user-shared-line me-1 text-success"></i>SE180123 (${isEn ? 'Hoang Long' : 'Hoàng Long'} - K18 SE)
                            </a>` : ''}
                            <div class="dropdown-divider my-1"></div>
                            <a class="dropdown-item text-danger" href="/Auth/Logout">
                                <i class="ri-logout-box-fill align-middle me-1"></i>
                                <span>${dict.logout}</span>
                            </a>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Left Sidebar (Full Web Gốc 6 Categories with Collapsible Navigation) -->
        <aside class="leftside-menu cap-sidebar fap-sidebar" aria-label="Main navigation">
            <a class="logo logo-light" href="/">
                <span class="logo-lg"><img src="/assets/images/logo-ctlu.svg" alt="CTL University" width="180" height="60"></span>
                <span class="logo-sm"><img src="/assets/images/logo-ctl.svg" alt="CTL" width="36" height="36"></span>
            </a>

            <div class="cap-sidebar__scroll fap-sidebar__scroll" id="leftside-menu-container" data-simplebar>
                <ul class="side-nav">
${staffMenu || `
                    <!-- ==================== CATEGORY 1: HỌC TẬP ==================== -->
                    <li class="side-nav-title mt-1">${isEn ? 'Academics' : 'Học tập'}</li>

                    <!-- 1.1 Lịch học -->
                    <li class="side-nav-item ${isLichHocActive ? 'menuitem-active' : ''}">
                        <a data-bs-toggle="collapse" href="#sidebar-lich-hoc" aria-expanded="${isLichHocActive ? 'true' : 'false'}" aria-controls="sidebar-lich-hoc" class="side-nav-link ${isLichHocActive ? 'active' : ''}">
                            <i class="ri-calendar-2-line"></i>
                            <span>${isEn ? 'Schedule' : 'Lịch học'}</span>
                            <span class="menu-arrow"></span>
                        </a>
                        <div class="collapse ${isLichHocActive ? 'show' : ''}" id="sidebar-lich-hoc">
                            <ul class="side-nav-second-level">
                                <li class="side-nav-item ${currentPath === '/WeeklyTimetable' ? 'menuitem-active' : ''}">
                                    <a href="/WeeklyTimetable" class="side-nav-link ${currentPath === '/WeeklyTimetable' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Timetable' : 'Thời khóa biểu'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/ExamSchedule' ? 'menuitem-active' : ''}">
                                    <a href="/ExamSchedule" class="side-nav-link ${currentPath === '/ExamSchedule' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Exam Schedule' : 'Lịch thi'}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>

                    <!-- 1.2 Báo cáo học tập -->
                    <li class="side-nav-item ${isBaoCaoActive ? 'menuitem-active' : ''}">
                        <a data-bs-toggle="collapse" href="#sidebar-bao-cao" aria-expanded="${isBaoCaoActive ? 'true' : 'false'}" aria-controls="sidebar-bao-cao" class="side-nav-link ${isBaoCaoActive ? 'active' : ''}">
                            <i class="ri-bar-chart-box-line"></i>
                            <span>${isEn ? 'Academic Reports' : 'Báo cáo học tập'}</span>
                            <span class="menu-arrow"></span>
                        </a>
                        <div class="collapse ${isBaoCaoActive ? 'show' : ''}" id="sidebar-bao-cao">
                            <ul class="side-nav-second-level">
                                <li class="side-nav-item ${currentPath === '/Report/Attendance' || currentPath === '/Attendance' ? 'menuitem-active' : ''}">
                                    <a href="/Report/Attendance" class="side-nav-link ${currentPath === '/Report/Attendance' || currentPath === '/Attendance' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Attendance Report' : 'Báo cáo điểm danh'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/Report/Grade' ? 'menuitem-active' : ''}">
                                    <a href="/Report/Grade" class="side-nav-link ${currentPath === '/Report/Grade' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Grade Report' : 'Báo cáo điểm'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/Report/Transcript' || currentPath === '/Transcript' ? 'menuitem-active' : ''}">
                                    <a href="/Report/Transcript" class="side-nav-link ${currentPath === '/Report/Transcript' || currentPath === '/Transcript' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Transcript' : 'Bảng điểm'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/Report/OjtConditions' ? 'menuitem-active' : ''}">
                                    <a href="/Report/OjtConditions" class="side-nav-link ${currentPath === '/Report/OjtConditions' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'OJT Conditions' : 'Điều kiện OJT'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/Report/ThesisConditions' ? 'menuitem-active' : ''}">
                                    <a href="/Report/ThesisConditions" class="side-nav-link ${currentPath === '/Report/ThesisConditions' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Thesis Conditions' : 'Điều kiện KLTN'}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>

                    <!-- 1.3 Môn học & chương trình -->
                    <li class="side-nav-item ${isMonHocActive ? 'menuitem-active' : ''}">
                        <a data-bs-toggle="collapse" href="#sidebar-mon-hoc" aria-expanded="${isMonHocActive ? 'true' : 'false'}" aria-controls="sidebar-mon-hoc" class="side-nav-link ${isMonHocActive ? 'active' : ''}">
                            <i class="ri-book-mark-line"></i>
                            <span>${isEn ? 'Courses & Programs' : 'Môn học & chương trình'}</span>
                            <span class="menu-arrow"></span>
                        </a>
                        <div class="collapse ${isMonHocActive ? 'show' : ''}" id="sidebar-mon-hoc">
                            <ul class="side-nav-second-level">
                                <li class="side-nav-item ${currentPath === '/Subject' ? 'menuitem-active' : ''}">
                                    <a href="/Subject" class="side-nav-link ${currentPath === '/Subject' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Course Catalog' : 'Môn học'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/Curriculum' ? 'menuitem-active' : ''}">
                                    <a href="/Curriculum" class="side-nav-link ${currentPath === '/Curriculum' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Curriculum Roadmap' : 'Khung chương trình'}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>

                    <!-- 1.4 Chứng chỉ (Single item) -->
                    <li class="side-nav-item ${currentPath === '/MyCertificates' || currentPath === '/Certificates' ? 'menuitem-active' : ''}">
                        <a href="/MyCertificates" class="side-nav-link ${currentPath === '/MyCertificates' || currentPath === '/Certificates' ? 'active' : ''}">
                            <i class="ri-award-line"></i>
                            <span>${isEn ? 'Certificates' : 'Chứng chỉ'}</span>
                        </a>
                    </li>

                    <!-- 1.5 Tin tức & tài liệu -->
                    <li class="side-nav-item ${isTinTucActive ? 'menuitem-active' : ''}">
                        <a data-bs-toggle="collapse" href="#sidebar-tin-tuc" aria-expanded="${isTinTucActive ? 'true' : 'false'}" aria-controls="sidebar-tin-tuc" class="side-nav-link ${isTinTucActive ? 'active' : ''}">
                            <i class="ri-newspaper-line"></i>
                            <span>${isEn ? 'News & Documents' : 'Tin tức & tài liệu'}</span>
                            <span class="menu-arrow"></span>
                        </a>
                        <div class="collapse ${isTinTucActive ? 'show' : ''}" id="sidebar-tin-tuc">
                            <ul class="side-nav-second-level">
                                <li class="side-nav-item ${currentPath === '/News' ? 'menuitem-active' : ''}">
                                    <a href="/News" class="side-nav-link ${currentPath === '/News' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'News & Notices' : 'Tin tức'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/Document' ? 'menuitem-active' : ''}">
                                    <a href="/Document" class="side-nav-link ${currentPath === '/Document' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Academic Regulations' : 'Tài liệu'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/Document/DrivePdf' ? 'menuitem-active' : ''}">
                                    <a href="/Document/DrivePdf" class="side-nav-link ${currentPath === '/Document/DrivePdf' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'User Guide' : 'Hướng dẫn sử dụng'}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>

                    <!-- ==================== CATEGORY 2: ĐƠN TỪ ==================== -->
                    <li class="side-nav-title mt-1">${isEn ? 'Applications' : 'Đơn từ'}</li>

                    <!-- 2.1 Xem đơn -->
                    <li class="side-nav-item ${currentPath === '/Application' ? 'menuitem-active' : ''}">
                        <a href="/Application" class="side-nav-link ${currentPath === '/Application' ? 'active' : ''}">
                            <i class="ri-file-list-3-line"></i>
                            <span>${isEn ? 'View Applications' : 'Xem đơn'}</span>
                        </a>
                    </li>

                    <!-- 2.2 Gửi đơn -->
                    <li class="side-nav-item ${currentPath === '/Application/Catalog' ? 'menuitem-active' : ''}">
                        <a href="/Application/Catalog" class="side-nav-link ${currentPath === '/Application/Catalog' ? 'active' : ''}">
                            <i class="ri-file-edit-line"></i>
                            <span>${isEn ? 'Submit Application' : 'Gửi đơn'}</span>
                        </a>
                    </li>

                    <!-- 2.3 Đơn đổi lớp chéo -->
                    <li class="side-nav-item ${currentPath === '/CrossClassChange' || currentPath === '/Class/ChangeRequest' ? 'menuitem-active' : ''}">
                        <a href="/CrossClassChange" class="side-nav-link ${currentPath === '/CrossClassChange' || currentPath === '/Class/ChangeRequest' ? 'active' : ''}">
                            <i class="ri-exchange-line"></i>
                            <span>${isEn ? 'Class Transfer Request' : 'Đơn đổi lớp chéo'}</span>
                        </a>
                    </li>

                    <!-- 2.4 Đơn khởi nghiệp (Collapsible) -->
                    <li class="side-nav-item ${isKhoiNghiepActive ? 'menuitem-active' : ''}">
                        <a data-bs-toggle="collapse" href="#sidebar-don-khoi-nghiep" aria-expanded="${isKhoiNghiepActive ? 'true' : 'false'}" aria-controls="sidebar-don-khoi-nghiep" class="side-nav-link ${isKhoiNghiepActive ? 'active' : ''}">
                            <i class="ri-lightbulb-line"></i>
                            <span>${isEn ? 'Startup Applications' : 'Đơn khởi nghiệp'}</span>
                            <span class="menu-arrow"></span>
                        </a>
                        <div class="collapse ${isKhoiNghiepActive ? 'show' : ''}" id="sidebar-don-khoi-nghiep">
                            <ul class="side-nav-second-level">
                                <li class="side-nav-item ${currentPath === '/StartupGroup' || currentPath === '/Services/Startup' ? 'menuitem-active' : ''}">
                                    <a href="/StartupGroup" class="side-nav-link ${currentPath === '/StartupGroup' || currentPath === '/Services/Startup' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Startup Projects' : 'Danh sách đơn khởi nghiệp'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/StartupGroup/Add' ? 'menuitem-active' : ''}">
                                    <a href="/StartupGroup/Add" class="side-nav-link ${currentPath === '/StartupGroup/Add' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Submit Startup Request' : 'Gửi đơn khởi nghiệp'}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>

                    <!-- ==================== CATEGORY 3: TÀI CHÍNH ==================== -->
                    <li class="side-nav-title mt-1">${isEn ? 'Finance' : 'Tài chính'}</li>

                    <!-- 3.1 Thanh toán (Collapsible) -->
                    <li class="side-nav-item ${isThanhToanActive ? 'menuitem-active' : ''}">
                        <a data-bs-toggle="collapse" href="#sidebar-thanh-toan" aria-expanded="${isThanhToanActive ? 'true' : 'false'}" aria-controls="sidebar-thanh-toan" class="side-nav-link ${isThanhToanActive ? 'active' : ''}">
                            <i class="ri-bank-card-line"></i>
                            <span>${isEn ? 'Payments' : 'Thanh toán'}</span>
                            <span class="menu-arrow"></span>
                        </a>
                        <div class="collapse ${isThanhToanActive ? 'show' : ''}" id="sidebar-thanh-toan">
                            <ul class="side-nav-second-level">
                                <li class="side-nav-item ${currentPath === '/ShoppingCart' ? 'menuitem-active' : ''}">
                                    <a href="/ShoppingCart" class="side-nav-link ${currentPath === '/ShoppingCart' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Tuition & Fee Payment' : 'Thanh toán các khoản phí'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/CoursePendingPayment' ? 'menuitem-active' : ''}">
                                    <a href="/CoursePendingPayment" class="side-nav-link ${currentPath === '/CoursePendingPayment' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Course Placement Fee' : 'Phí xếp lớp'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/Transaction' ? 'menuitem-active' : ''}">
                                    <a href="/Transaction" class="side-nav-link ${currentPath === '/Transaction' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>${isEn ? 'Transaction History' : 'Lịch sử giao dịch'}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>

                    <!-- ==================== CATEGORY 4: WISHLIST ==================== -->
                    <li class="side-nav-title mt-1">Wishlist</li>
                    <li class="side-nav-item ${currentPath === '/Wishlist' ? 'menuitem-active' : ''}">
                        <a href="/Wishlist" class="side-nav-link ${currentPath === '/Wishlist' ? 'active' : ''}">
                            <i class="ri-menu-line"></i>
                            <span>${isEn ? 'Waitlist' : 'Danh sách chờ lớp'}</span>
                        </a>
                    </li>
                    <li class="side-nav-item ${currentPath === '/Wishlist/Register' ? 'menuitem-active' : ''}">
                        <a href="/Wishlist/Register" class="side-nav-link ${currentPath === '/Wishlist/Register' ? 'active' : ''}">
                            <i class="ri-menu-line"></i>
                            <span>${isEn ? 'Register Wishlist' : 'Đăng ký wishlist'}</span>
                        </a>
                    </li>

                    <!-- ==================== CATEGORY 5: HOẠT ĐỘNG SINH VIÊN ==================== -->
                    <li class="side-nav-title mt-1">${isEn ? 'Student Activities' : 'Hoạt động sinh viên'}</li>

                    <!-- 5.1 FYE (Collapsible) -->
                    <li class="side-nav-item ${isFyeActive ? 'menuitem-active' : ''}">
                        <a data-bs-toggle="collapse" href="#sidebar-fye" aria-expanded="${isFyeActive ? 'true' : 'false'}" aria-controls="sidebar-fye" class="side-nav-link ${isFyeActive ? 'active' : ''}">
                            <i class="ri-heart-pulse-line"></i>
                            <span>FYE</span>
                            <span class="menu-arrow"></span>
                        </a>
                        <div class="collapse ${isFyeActive ? 'show' : ''}" id="sidebar-fye">
                            <ul class="side-nav-second-level">
                                <li class="side-nav-item ${currentPath === '/FyeCheckInLog' || currentPath === '/Services/FYE' ? 'menuitem-active' : ''}">
                                    <a href="/FyeCheckInLog" class="side-nav-link ${currentPath === '/FyeCheckInLog' || currentPath === '/Services/FYE' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>Check-in Log</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/FyeMentorFeedback' || currentPath === '/Mentor/Feedback' ? 'menuitem-active' : ''}">
                                    <a href="/FyeMentorFeedback" class="side-nav-link ${currentPath === '/FyeMentorFeedback' || currentPath === '/Mentor/Feedback' ? 'active' : ''}">
                                        <i class="ri-menu-line"></i>
                                        <span>Feedback Mentor</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>

                    <!-- ==================== CATEGORY 6: TÀI KHOẢN ==================== -->
                    <li class="side-nav-title mt-1">${isEn ? 'Account' : 'Tài khoản'}</li>

                    <!-- 6.1 Cá nhân (Collapsible) -->
                    <li class="side-nav-item ${isCaNhanActive ? 'menuitem-active' : ''}">
                        <a data-bs-toggle="collapse" href="#sidebar-ca-nhan" aria-expanded="${isCaNhanActive ? 'true' : 'false'}" aria-controls="sidebar-ca-nhan" class="side-nav-link ${isCaNhanActive ? 'active' : ''}">
                            <i class="ri-user-settings-line"></i>
                            <span>${isEn ? 'Personal Profile' : 'Cá nhân'}</span>
                            <span class="menu-arrow"></span>
                        </a>
                        <div class="collapse ${isCaNhanActive ? 'show' : ''}" id="sidebar-ca-nhan">
                            <ul class="side-nav-second-level">
                                <li class="side-nav-item ${currentPath === '/Account' ? 'menuitem-active' : ''}">
                                    <a href="/Account" class="side-nav-link ${currentPath === '/Account' ? 'active' : ''}">
                                        <i class="ri-user-star-line"></i>
                                        <span>${isEn ? 'Personal Information' : 'Thông tin cá nhân'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/StudentProfile' || currentPath === '/StudentProfile/Edit' ? 'menuitem-active' : ''}">
                                    <a href="/StudentProfile" class="side-nav-link ${currentPath === '/StudentProfile' || currentPath === '/StudentProfile/Edit' ? 'active' : ''}">
                                        <i class="ri-edit-box-line"></i>
                                        <span>${isEn ? 'Update Profile' : 'Cập nhật hồ sơ'}</span>
                                    </a>
                                </li>
                                <li class="side-nav-item ${currentPath === '/Auth/ChangePassword' ? 'menuitem-active' : ''}">
                                    <a href="/Auth/ChangePassword" class="side-nav-link ${currentPath === '/Auth/ChangePassword' ? 'active' : ''}">
                                        <i class="ri-lock-password-line"></i>
                                        <span>${isEn ? 'Change Password' : 'Đổi mật khẩu'}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>
`}
                </ul>
            </div>
        </aside>

        <!-- Page Content -->
        <div class="content-page">
            <div class="content">
                <div class="container-fluid">
                    <!-- Breadcrumb Header matching FPT/CTL: Trang chủ / Tiêu đề -->
                    <div class="row">
                        <div class="col-12">
                            <div class="page-title-box cap-page-title fap-page-title py-3 d-flex align-items-center">
                                <nav aria-label="breadcrumb">
                                    <ol class="breadcrumb m-0 d-flex align-items-center gap-2">
                                        <li class="breadcrumb-item">
                                            <a href="/" class="text-decoration-none d-inline-flex align-items-center text-muted hover-primary fs-14">
                                                <i class="ri-home-4-line me-1 fs-16"></i>${dict.navHome}
                                            </a>
                                        </li>
                                        <li class="breadcrumb-item active d-inline-flex align-items-center fs-14 fw-semibold" aria-current="page">
                                            ${title}
                                        </li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>

                    ${content}
                </div>
            </div>

            <!-- Footer -->
            <footer class="footer">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-md-6">
                            ${dict.footerCopy} | <span class="text-info">${dict.version}</span>
                        </div>
                        <div class="col-md-6 text-md-end">
                            ${dict.footerSub}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </div>

    <!-- Vendor Scripts -->
    <script src="/assets/vendor/jidox/vendor.min.js"></script>
    <script src="/assets/vendor/jidox/js/app.min.js"></script>
    <script src="/js/app-toast.js"></script>
    <script src="/js/base.js"></script>
    <script src="/js/sidebar-state.js"></script>
    <script src="/js/cap-ui.js"></script>
</body>
</html>`;
}

module.exports = { renderLayout };
