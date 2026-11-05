// Staff area: academic office (admin) approves student requests, lecturers enter grades.
// All data is HTML-escaped by the caller (safe() in server.js).

const REQUEST_LABELS = {
  applications: ['Đơn từ', 'Applications', 'ri-file-list-3-line'],
  cross_class: ['Đổi lớp chéo', 'Class transfers', 'ri-exchange-line'],
  wishlist: ['Wishlist', 'Wishlist', 'ri-heart-add-line'],
  startup: ['Khởi nghiệp', 'Startup proposals', 'ri-lightbulb-flash-line']
};

function label(type, isEn) {
  const l = REQUEST_LABELS[type];
  return l ? l[isEn ? 1 : 0] : type;
}

function navItem(href, icon, text, active) {
  return `
                    <li class="side-nav-item ${active ? 'menuitem-active' : ''}">
                        <a href="${href}" class="side-nav-link ${active ? 'active' : ''}">
                            <i class="${icon}"></i>
                            <span>${text}</span>
                        </a>
                    </li>`;
}

// Sidebar items for staff (replaces the student menu).
function staffMenu({ role, currentPath, lang = 'vi' }) {
  const isEn = lang === 'en';
  let html = `
                    <li class="side-nav-title mt-1">${isEn ? 'Staff' : 'Cán bộ'}</li>`;
  html += navItem('/Staff', 'ri-dashboard-line', isEn ? 'Overview' : 'Tổng quan', currentPath === '/Staff');
  if (role === 'admin') {
    html += `
                    <li class="side-nav-title mt-1">${isEn ? 'Approvals' : 'Duyệt yêu cầu'}</li>`;
    for (const type of Object.keys(REQUEST_LABELS)) {
      const href = `/Staff/Requests?type=${type}`;
      html += navItem(href, REQUEST_LABELS[type][2], label(type, isEn), currentPath === href);
    }
  }
  html += `
                    <li class="side-nav-title mt-1">${isEn ? 'Teaching' : 'Giảng dạy'}</li>`;
  html += navItem('/Staff/Grades', 'ri-edit-2-line', isEn ? 'Grade entry' : 'Nhập điểm', currentPath.startsWith('/Staff/Grades'));
  html += navItem('/Staff/Attendance', 'ri-user-follow-line', isEn ? 'Attendance' : 'Điểm danh', currentPath.startsWith('/Staff/Attendance'));
  html += `
                    <li class="side-nav-title mt-1">${isEn ? 'Account' : 'Tài khoản'}</li>`;
  html += navItem('/Auth/ChangePassword', 'ri-lock-password-line', isEn ? 'Change Password' : 'Đổi mật khẩu', currentPath === '/Auth/ChangePassword');
  return html;
}

function flashBox(flash) {
  if (!flash) return '';
  return `<div class="alert alert-${flash.tone}"><i class="${flash.tone === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} me-1"></i>${flash.text}</div>`;
}

function renderStaffHome({ role, user, counts = {}, classes = [], lang = 'vi' }) {
  const isEn = lang === 'en';
  const cards = role === 'admin'
    ? Object.keys(REQUEST_LABELS).map(type => `
        <div class="col-sm-6 col-xl-3">
          <a href="/Staff/Requests?type=${type}" class="card text-decoration-none h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted fw-semibold">${label(type, isEn)}</div>
                  <div class="fs-2 fw-bold ${counts[type] ? 'text-warning' : 'text-success'}">${counts[type] || 0}</div>
                  <small class="text-muted">${isEn ? 'pending' : 'chờ duyệt'}</small>
                </div>
                <i class="${REQUEST_LABELS[type][2]} fs-1 text-primary opacity-50"></i>
              </div>
            </div>
          </a>
        </div>`).join('')
    : '';
  return `
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="m-0 text-primary fw-bold">${user.full_name}</h5>
        <small class="text-muted">${role === 'admin' ? (isEn ? 'Academic office' : 'Phòng Đào tạo') : (isEn ? 'Lecturer' : 'Giảng viên')} · ${user.email}</small>
      </div>
    </div>
    ${cards ? `<div class="row g-3 mb-3">${cards}</div>` : ''}
    <div class="card">
      <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
        <h5 class="card-title m-0"><i class="ri-edit-2-line text-primary me-2"></i>${role === 'admin' ? (isEn ? 'All classes' : 'Tất cả lớp học') : (isEn ? 'My classes' : 'Lớp tôi phụ trách')}</h5>
        <a href="/Staff/Grades" class="btn btn-sm btn-outline-primary">${isEn ? 'Grade entry' : 'Nhập điểm'} &rarr;</a>
      </div>
      <div class="card-body p-0">${classTable(classes, isEn)}</div>
    </div>
  `;
}

function classTable(classes, isEn) {
  if (!classes.length) {
    return `<div class="text-center text-muted py-4">${isEn ? 'No classes assigned.' : 'Chưa được phân công lớp nào.'}</div>`;
  }
  const rows = classes.map(c => `
          <tr>
            <td><strong class="text-primary">${c.class_code}</strong></td>
            <td>${c.subject_code} - ${c.subject_name}</td>
            <td>${c.semester_name}</td>
            <td>${c.lecturer_name}</td>
            <td class="text-end text-nowrap">
              <a href="/Staff/Attendance/${c.id}" class="btn btn-sm btn-soft-info">${isEn ? 'Attendance' : 'Điểm danh'}</a>
              <a href="/Staff/Grades/${c.id}" class="btn btn-sm btn-soft-primary">${isEn ? 'Enter grades' : 'Nhập điểm'}</a>
            </td>
          </tr>`).join('');
  return `
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>${isEn ? 'Class' : 'Lớp'}</th><th>${isEn ? 'Subject' : 'Môn học'}</th><th>${isEn ? 'Semester' : 'Học kỳ'}</th><th>${isEn ? 'Lecturer' : 'Giảng viên'}</th><th></th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
}

function renderGradeClasses({ classes = [], lang = 'vi', heading = null }) {
  const isEn = lang === 'en';
  return `
    <div class="card">
      <div class="card-header bg-transparent border-bottom">
        <h5 class="card-title m-0"><i class="ri-edit-2-line text-primary me-2"></i>${heading || (isEn ? 'Choose a class' : 'Chọn lớp để nhập điểm')}</h5>
      </div>
      <div class="card-body p-0">${classTable(classes, isEn)}</div>
    </div>`;
}

function requestSummary(type, r) {
  switch (type) {
    case 'applications': return `<strong>${r.app_type}</strong><div class="small text-muted">${r.reason}</div>`;
    case 'cross_class': return `<strong>${r.subject_code}</strong>: ${r.from_class} &rarr; ${r.to_class}<div class="small text-muted">${r.reason}</div>`;
    case 'wishlist': return `<strong>${r.subject_code}</strong> (${r.semester_code}) · ${r.desired_slot}<div class="small text-muted">${r.note || ''}</div>`;
    case 'startup': return `<strong>${r.project_name}</strong> · ${r.field} · ${r.member_count}<div class="small text-muted">${r.description}</div>`;
    default: return '';
  }
}

function renderRequests({ type, rows = [], counts = {}, flash = null, lang = 'vi' }) {
  const isEn = lang === 'en';
  const tabs = Object.keys(REQUEST_LABELS).map(t => `
        <li class="nav-item">
          <a class="nav-link ${t === type ? 'active' : ''}" href="/Staff/Requests?type=${t}">
            ${label(t, isEn)} ${counts[t] ? `<span class="badge bg-warning ms-1">${counts[t]}</span>` : ''}
          </a>
        </li>`).join('');
  const body = rows.length ? rows.map(r => `
          <tr>
            <td class="text-nowrap"><strong>${r.student_roll}</strong><div class="small text-muted">${r.student_name || ''}</div></td>
            <td>${requestSummary(type, r)}</td>
            <td class="text-nowrap small text-muted">${r.created_at}</td>
            <td class="text-center"><span class="badge ${r.is_pending ? 'badge-soft-warning' : 'badge-soft-info'}">${r.status}</span></td>
            <td class="text-end text-nowrap">${r.is_pending ? `
              <form method="post" action="/Staff/Requests/${type}/${r.id}" class="d-inline">
                <button type="submit" name="decision" value="approve" class="btn btn-sm btn-success"><i class="ri-check-line"></i> ${isEn ? 'Approve' : 'Duyệt'}</button>
                <button type="submit" name="decision" value="reject" class="btn btn-sm btn-outline-danger"><i class="ri-close-line"></i> ${isEn ? 'Reject' : 'Từ chối'}</button>
              </form>` : ''}</td>
          </tr>`).join('')
    : `<tr><td colspan="5" class="text-center text-muted py-4">${isEn ? 'No requests.' : 'Không có yêu cầu nào.'}</td></tr>`;
  return `
    ${flashBox(flash)}
    <ul class="nav nav-tabs mb-3">${tabs}</ul>
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr><th>${isEn ? 'Student' : 'Sinh viên'}</th><th>${isEn ? 'Request' : 'Nội dung'}</th><th>${isEn ? 'Submitted' : 'Ngày gửi'}</th><th class="text-center">${isEn ? 'Status' : 'Trạng thái'}</th><th></th></tr>
            </thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

// students: [{ roll_number, full_name, components: [{id, component_name, weight, value}], score, status }]
function renderGradeEntry({ cls, students = [], flash = null, lang = 'vi' }) {
  const isEn = lang === 'en';
  const statusText = { Passed: isEn ? 'Passed' : 'Đạt', Failed: isEn ? 'Failed' : 'Không đạt', InProgress: isEn ? 'In progress' : 'Đang học' };
  const cards = students.map(st => {
    const inputs = st.components.length ? st.components.map(c => `
            <div class="col-sm-6 col-lg-4">
              <label class="form-label small fw-semibold mb-1" for="g_${c.id}">${c.component_name} <span class="text-muted">(${Math.round(Number(c.weight) * 100)}%)</span></label>
              <input type="number" class="form-control form-control-sm" id="g_${c.id}" name="g_${c.id}" min="0" max="10" step="0.1"
                     value="${c.value === null || c.value === undefined ? '' : Number(c.value)}" placeholder="${isEn ? 'not graded' : 'chưa có'}">
            </div>`).join('')
      : `<div class="col-12 text-muted small">${isEn ? 'No grade components set up for this student.' : 'Sinh viên chưa có cấu trúc đầu điểm cho môn này.'}</div>`;
    return `
        <div class="card mb-3">
          <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
            <div><strong class="text-primary">${st.roll_number}</strong> · ${st.full_name}</div>
            <div class="text-end"><span class="fw-bold">${st.score === null ? '-' : Number(st.score).toFixed(1)}</span>
              <span class="badge ${st.status === 'Passed' ? 'badge-soft-success' : st.status === 'Failed' ? 'badge-soft-danger' : 'badge-soft-warning'} ms-1">${statusText[st.status] || '-'}</span></div>
          </div>
          <div class="card-body"><div class="row g-2">${inputs}</div></div>
        </div>`;
  }).join('');
  return `
    ${flashBox(flash)}
    <div class="card mb-3">
      <div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h5 class="m-0 text-primary fw-bold">${cls.class_code} · ${cls.subject_code} - ${cls.subject_name}</h5>
          <small class="text-muted">${cls.semester_name} · ${cls.lecturer_name} · ${cls.room}</small>
        </div>
        <a href="/Staff/Grades" class="btn btn-sm btn-outline-secondary">&larr; ${isEn ? 'All classes' : 'Danh sách lớp'}</a>
      </div>
    </div>
    ${students.length ? `
    <form method="post" action="/Staff/Grades/${cls.id}">
      ${cards}
      <div class="d-flex align-items-center gap-2 mb-3">
        <button type="submit" class="btn btn-primary"><i class="ri-save-line me-1"></i>${isEn ? 'Save grades' : 'Lưu điểm'}</button>
        <small class="text-muted">${isEn ? 'Scores 0–10, one decimal. Leave empty if not graded yet. Students are notified of changes.' : 'Điểm từ 0 đến 10, một chữ số thập phân. Để trống nếu chưa có điểm. Sinh viên sẽ nhận thông báo khi điểm thay đổi.'}</small>
      </div>
    </form>` : `<div class="card text-center text-muted py-4">${isEn ? 'No students in this class.' : 'Lớp chưa có sinh viên.'}</div>`}
  `;
}

// sessions: [{ date, slot, room, locked, rows: [{ id, student_roll, full_name, status }] }]
function renderAttendanceEntry({ cls, sessions = [], today, flash = null, lang = 'vi' }) {
  const isEn = lang === 'en';
  const options = [
    ['Attended', isEn ? 'Present' : 'Có mặt'],
    ['Absent', isEn ? 'Absent' : 'Vắng'],
    ['Not yet', isEn ? 'Not held yet' : 'Chưa diễn ra']
  ];
  const cards = sessions.map(sess => `
        <div class="card mb-3">
          <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
            <div><strong>${sess.date}</strong> · Slot ${sess.slot} · ${sess.room}</div>
            ${sess.locked ? `<span class="badge bg-secondary-subtle text-secondary">${isEn ? 'Future session' : 'Buổi chưa tới'}</span>` : ''}
          </div>
          <div class="card-body p-0">
            <table class="table table-sm mb-0 align-middle">
              <tbody>${sess.rows.map(r => `
                <tr>
                  <td class="ps-3"><strong class="text-primary">${r.student_roll}</strong> · ${r.full_name}</td>
                  <td class="cap-w-220 text-end pe-3">
                    <select name="a_${r.id}" class="form-select form-select-sm" ${sess.locked ? 'disabled' : ''}>
                      ${options.map(([v, t]) => `<option value="${v}" ${r.status === v ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`).join('');
  return `
    ${flashBox(flash)}
    <div class="card mb-3">
      <div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h5 class="m-0 text-primary fw-bold">${cls.class_code} · ${cls.subject_code} - ${cls.subject_name}</h5>
          <small class="text-muted">${cls.semester_name} · ${cls.lecturer_name} · ${isEn ? 'today' : 'hôm nay'} ${today}</small>
        </div>
        <a href="/Staff/Attendance" class="btn btn-sm btn-outline-secondary">&larr; ${isEn ? 'All classes' : 'Danh sách lớp'}</a>
      </div>
    </div>
    ${sessions.length ? `
    <form method="post" action="/Staff/Attendance/${cls.id}">
      ${cards}
      <div class="d-flex align-items-center gap-2 mb-3">
        <button type="submit" class="btn btn-primary"><i class="ri-save-line me-1"></i>${isEn ? 'Save attendance' : 'Lưu điểm danh'}</button>
        <small class="text-muted">${isEn ? 'Future sessions cannot be marked. Absent students are notified; more than 20% absences bars them from the exam.' : 'Không thể điểm danh buổi chưa tới. Sinh viên bị ghi vắng sẽ nhận thông báo; vắng quá 20% sẽ bị cấm thi.'}</small>
      </div>
    </form>` : `<div class="card text-center text-muted py-4">${isEn ? 'No sessions scheduled for this class.' : 'Lớp chưa có buổi học nào.'}</div>`}
  `;
}

module.exports = { staffMenu, renderStaffHome, renderGradeClasses, renderRequests, renderGradeEntry, renderAttendanceEntry, REQUEST_LABELS };
