// Badge colour for request statuses set by the academic office.
const APPROVED_STATUSES = new Set(['Đã duyệt', 'Đã xếp lớp', 'Đã được duyệt hỗ trợ']);
const REJECTED_STATUSES = new Set(['Từ chối', 'Không mở lớp', 'Không được duyệt']);
function statusTone(status) {
  if (APPROVED_STATUSES.has(status)) return 'badge-soft-success';
  if (REJECTED_STATUSES.has(status)) return 'badge-soft-danger';
  return 'badge-soft-warning';
}

function renderWishlist({ wishlist, subjects, successMsg = null }) {
  let rows = wishlist.map((w, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong class="text-primary">${w.subject_code}</strong></td>
      <td>${w.semester_code}</td>
      <td>${w.desired_slot}</td>
      <td>${w.note || '-'}</td>
      <td class="text-center"><span class="badge ${statusTone(w.status)}">${w.status}</span></td>
      <td class="text-center text-muted small">${w.created_at}</td>
    </tr>
  `).join('');

  return `
    ${successMsg ? `<div class="alert alert-success"><i class="ri-checkbox-circle-line me-1"></i>${successMsg}</div>` : ''}

    <div class="row">
      <div class="col-lg-7">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-list-check-2 text-primary me-2"></i>Danh sách môn đăng ký Wishlist</h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-striped mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 50px;" class="text-center">STT</th>
                    <th>Mã môn</th>
                    <th>Học kỳ</th>
                    <th>Khung giờ mong muốn</th>
                    <th>Ghi chú</th>
                    <th class="text-center">Trạng thái</th>
                    <th class="text-center">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.length > 0 ? rows : '<tr><td colspan="7" class="text-center py-4 text-muted">Bạn chưa đăng ký môn nào trong wishlist.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-add-circle-fill text-primary me-2"></i>Đăng ký Wishlist môn học mới</h5>
          </div>
          <div class="card-body">
            <form action="/Wishlist/Register" method="post">
              <div class="mb-3">
                <label class="form-label fw-semibold">Chọn môn học cần đăng ký <span class="text-danger">*</span></label>
                <select name="subject_code" class="form-select" required>
                  <option value="" disabled selected>-- Chọn môn học --</option>
                  ${subjects.map(s => `<option value="${s.code}">${s.code} - ${s.name} (${s.credits} TC)</option>`).join('')}
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Học kỳ dự kiến <span class="text-danger">*</span></label>
                <select name="semester_code" class="form-select">
                  <option value="Fall2026" selected>Fall 2026</option>
                  <option value="Spring2027">Spring 2027</option>
                  <option value="Summer2027">Summer 2027</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Khung giờ / Slot mong muốn <span class="text-danger">*</span></label>
                <input type="text" name="desired_slot" class="form-control" placeholder="Ví dụ: Slot 1, 2 các ngày thứ 2, 4" required>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Ghi chú (Lý do đăng ký)</label>
                <textarea name="note" class="form-control" rows="2" placeholder="Học cải thiện điểm, học vượt..."></textarea>
              </div>

              <button type="submit" class="btn btn-primary w-100">
                <i class="ri-send-plane-line me-1"></i>Gửi nguyện vọng xếp lớp
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCrossClass({ requests, successMsg = null }) {
  let rows = requests.map((r, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong class="text-primary">${r.subject_code}</strong></td>
      <td><span class="badge bg-secondary">${r.from_class}</span></td>
      <td><span class="badge bg-primary">${r.to_class}</span></td>
      <td>${r.reason}</td>
      <td class="text-center"><span class="badge ${statusTone(r.status)}">${r.status}</span></td>
      <td class="text-center text-muted small">${r.created_at}</td>
    </tr>
  `).join('');

  return `
    ${successMsg ? `<div class="alert alert-success"><i class="ri-checkbox-circle-line me-1"></i>${successMsg}</div>` : ''}

    <div class="row">
      <div class="col-lg-7">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-shuffle-line text-primary me-2"></i>Lịch sử yêu cầu đổi lớp chéo</h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-striped mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 50px;" class="text-center">STT</th>
                    <th>Mã môn</th>
                    <th>Lớp hiện tại</th>
                    <th>Lớp muốn đổi</th>
                    <th>Lý do</th>
                    <th class="text-center">Trạng thái</th>
                    <th class="text-center">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.length > 0 ? rows : '<tr><td colspan="7" class="text-center py-4 text-muted">Chưa có yêu cầu đổi lớp nào.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-exchange-line text-primary me-2"></i>Gửi đơn xin đổi lớp chéo</h5>
          </div>
          <div class="card-body">
            <form action="/CrossClassChange/Submit" method="post">
              <div class="mb-3">
                <label class="form-label fw-semibold">Mã môn học <span class="text-danger">*</span></label>
                <input type="text" name="subject_code" class="form-control" placeholder="Ví dụ: SWP391" required>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Lớp đang học hiện tại <span class="text-danger">*</span></label>
                <input type="text" name="from_class" class="form-control" placeholder="Ví dụ: IA1901_SWP" required>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Lớp mong muốn chuyển sang <span class="text-danger">*</span></label>
                <input type="text" name="to_class" class="form-control" placeholder="Ví dụ: SE1902_SWP" required>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Lý do xin đổi lớp <span class="text-danger">*</span></label>
                <textarea name="reason" class="form-control" rows="3" placeholder="Trình bày lý do (trùng lịch, đổi nhóm dự án...)" required></textarea>
              </div>

              <button type="submit" class="btn btn-primary w-100">
                <i class="ri-send-plane-line me-1"></i>Nộp đơn đổi lớp
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStartup({ groups, successMsg = null }) {
  let cards = groups.map(g => `
    <div class="col-md-6 mb-3">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge badge-soft-info">${g.field}</span>
            <span class="badge ${statusTone(g.status)}">${g.status}</span>
          </div>
          <h5 class="text-primary fw-bold my-1">${g.project_name}</h5>
          <p class="text-muted small mb-2">${g.description}</p>
          <div class="d-flex justify-content-between text-muted small mt-3 pt-2 border-top">
            <span><i class="ri-team-line me-1"></i>Số thành viên: <strong>${g.member_count}</strong></span>
            <span><i class="ri-calendar-line me-1"></i>${g.created_at}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    ${successMsg ? `<div class="alert alert-success"><i class="ri-checkbox-circle-line me-1"></i>${successMsg}</div>` : ''}

    <div class="card mb-3">
      <div class="card-body d-flex justify-content-between align-items-center">
        <div>
          <h5 class="card-title m-0"><i class="ri-rocket-2-line text-primary me-2"></i>Dự án Khởi nghiệp Sinh viên CTL</h5>
          <small class="text-muted">Chính sách ươm mầm và hỗ trợ khởi nghiệp (CTL Startup Incubator)</small>
        </div>
        <button class="btn btn-primary btn-sm" data-bs-toggle="collapse" data-bs-target="#startupForm">
          <i class="ri-add-line me-1"></i>Đăng ký dự án mới
        </button>
      </div>
    </div>

    <div class="collapse mb-3" id="startupForm">
      <div class="card border-primary">
        <div class="card-header bg-primary text-white">
          <h5 class="card-title m-0 text-white">Đăng ký tham gia vườn ươm khởi nghiệp</h5>
        </div>
        <div class="card-body">
          <form action="/StartupGroup/Add" method="post">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Tên dự án khởi nghiệp <span class="text-danger">*</span></label>
                <input type="text" name="project_name" class="form-control" required placeholder="Ví dụ: SafeCampus AI">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Lĩnh vực <span class="text-danger">*</span></label>
                <input type="text" name="field" class="form-control" required placeholder="Ví dụ: AI, IoT, EdTech...">
              </div>
              <div class="col-md-2">
                <label class="form-label fw-semibold">Số TV <span class="text-danger">*</span></label>
                <input type="number" name="member_count" class="form-control" min="1" max="10" value="3" required>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Mô tả tóm tắt ý tưởng & mục tiêu <span class="text-danger">*</span></label>
                <textarea name="description" rows="3" class="form-control" required placeholder="Trình bày giải pháp, khách hàng mục tiêu và sản phẩm..."></textarea>
              </div>
              <div class="col-12">
                <button type="submit" class="btn btn-success"><i class="ri-send-plane-line me-1"></i>Nộp hồ sơ dự án</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="row">
      ${cards}
    </div>
  `;
}

function renderFyeLogs({ logs }) {
  let rows = logs.map((l, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong class="text-primary">${l.event_name}</strong></td>
      <td><i class="ri-map-pin-line text-danger me-1"></i>${l.location}</td>
      <td class="text-center text-muted">${l.checkin_time}</td>
      <td class="text-center"><span class="badge bg-success">+${l.points} Điểm rèn luyện</span></td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header border-bottom bg-transparent d-flex justify-content-between align-items-center">
        <h5 class="card-title m-0"><i class="ri-qr-scan-2-line text-primary me-2"></i>Nhật ký Check-in hoạt động trải nghiệm (FYE Log)</h5>
        <span class="badge badge-soft-success fs-13">Đã tích lũy: 25 Điểm rèn luyện</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 50px;" class="text-center">STT</th>
                <th>Tên sự kiện / Hoạt động</th>
                <th>Địa điểm</th>
                <th class="text-center">Thời gian Check-in</th>
                <th class="text-center">Điểm rèn luyện</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderMentorFeedback({ feedbacks, successMsg = null }) {
  let listHtml = feedbacks.map(f => `
    <div class="card mb-2 border-start border-3 border-warning">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong class="text-primary">${f.mentor_name}</strong>
          <span class="text-warning">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span>
        </div>
        <p class="text-muted small m-0 mb-1">${f.comment}</p>
        <small class="text-muted"><i class="ri-calendar-line me-1"></i>Học kỳ: ${f.semester_code} | Gửi lúc: ${f.submitted_at}</small>
      </div>
    </div>
  `).join('');

  return `
    ${successMsg ? `<div class="alert alert-success"><i class="ri-checkbox-circle-line me-1"></i>${successMsg}</div>` : ''}

    <div class="row">
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-feedback-line text-primary me-2"></i>Đánh giá Cố vấn học tập (Mentor)</h5>
          </div>
          <div class="card-body">
            <form action="/FyeMentorFeedback/Submit" method="post">
              <div class="mb-3">
                <label class="form-label fw-semibold">Họ tên Cố vấn học tập <span class="text-danger">*</span></label>
                <input type="text" name="mentor_name" class="form-control" value="ThS. Nguyễn Hoàng Long" required>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Học kỳ <span class="text-danger">*</span></label>
                <select name="semester_code" class="form-select">
                  <option value="Fall2026" selected>Fall 2026</option>
                  <option value="Summer2026">Summer 2026</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Mức độ hài lòng (1 - 5 sao) <span class="text-danger">*</span></label>
                <select name="rating" class="form-select">
                  <option value="5">★★★★★ - Rất hài lòng</option>
                  <option value="4">★★★★☆ - Hài lòng</option>
                  <option value="3">★★★☆☆ - Bình thường</option>
                  <option value="2">★★☆☆☆ - Chưa hài lòng</option>
                  <option value="1">★☆☆☆☆ - Không hài lòng</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Nhận xét chi tiết</label>
                <textarea name="comment" class="form-control" rows="3" placeholder="Đóng góp ý kiến cho thầy/cô cố vấn..."></textarea>
              </div>

              <button type="submit" class="btn btn-warning w-100 fw-bold">
                <i class="ri-star-line me-1"></i>Gửi phản hồi đánh giá
              </button>
            </form>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-history-line text-primary me-2"></i>Lịch sử các phản hồi đã gửi</h5>
          </div>
          <div class="card-body p-3">
            ${listHtml.length > 0 ? listHtml : '<div class="text-muted text-center py-4">Chưa có phản hồi nào.</div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDocuments({ documents }) {
  let rows = documents.map((d, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>
        <i class="ri-file-pdf-fill text-danger fs-18 me-1 align-middle"></i>
        <strong class="text-body">${d.title}</strong>
      </td>
      <td><span class="badge badge-soft-info">${d.category}</span></td>
      <td class="text-center">${d.file_size}</td>
      <td class="text-center text-muted small">${d.updated_at}</td>
      <td class="text-center">
        <a href="#" role="button" data-alert-message="Đang tải tài liệu: ${d.title}" class="btn btn-sm btn-outline-primary">
          <i class="ri-download-2-line me-1"></i>Tải về
        </a>
      </td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header border-bottom bg-transparent">
        <h5 class="card-title m-0"><i class="ri-folder-open-line text-primary me-2"></i>Văn bản, Quy chế & Biểu mẫu Hướng dẫn</h5>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 50px;" class="text-center">STT</th>
                <th>Tên tài liệu / Văn bản</th>
                <th>Danh mục</th>
                <th class="text-center">Dung lượng</th>
                <th class="text-center">Ngày ban hành</th>
                <th class="text-center" style="width: 140px;">Hành động</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderApplicationCatalog() {
  const categories = [
    {
      title: 'Đơn Học tập & Khảo thí',
      items: [
        { name: 'Đơn xin nghỉ học có phép', desc: 'Dành cho sinh viên ốm đau, việc gia đình đột xuất', url: '/Application' },
        { name: 'Đơn xin đổi lớp chéo', desc: 'Đổi sang lớp học phần khác cùng môn học', url: '/CrossClassChange' },
        { name: 'Đơn phúc khảo bài thi', desc: 'Khiếu nại kiểm tra lại điểm thi kết thúc học phần', url: '/Application' },
        { name: 'Đơn hoãn thi kết thúc môn', desc: 'Xin dời lịch thi sang đợt thi tiếp theo', url: '/Application' }
      ]
    },
    {
      title: 'Đơn Hành chính & Giấy tờ',
      items: [
        { name: 'Đơn xin cấp bảng điểm song ngữ', desc: 'Cấp bảng điểm chính thức phục vụ xin việc, du học', url: '/Application' },
        { name: 'Đơn xin cấp lại thẻ sinh viên', desc: 'Cấp lại thẻ sinh viên khi bị mất hoặc hỏng', url: '/Application' },
        { name: 'Đơn xin giấy xác nhận sinh viên', desc: 'Xác nhận để làm thủ tục tạm hoãn NVQS, vé xe buýt', url: '/Application' }
      ]
    },
    {
      title: 'Đơn Quy chế & Học vụ',
      items: [
        { name: 'Đơn xin bảo lưu kết quả học tập', desc: 'Tạm dừng học kỳ để đi làm, chữa bệnh', url: '/Application' },
        { name: 'Đơn xin chuyển ngành đào tạo', desc: 'Chuyển đổi chuyên ngành sang ngành khác trong trường', url: '/Application' },
        { name: 'Đơn xin chuyển cơ sở đào tạo', desc: 'Chuyển cơ sở giữa Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ', url: '/Application' }
      ]
    }
  ];

  let catHtml = categories.map(cat => `
    <div class="col-12 mb-4">
      <h5 class="text-primary fw-bold mb-3 border-bottom pb-2">${cat.title}</h5>
      <div class="row g-3">
        ${cat.items.map(item => `
          <div class="col-md-4">
            <div class="card h-100 border hover-shadow transition-all">
              <div class="card-body">
                <h6 class="fw-bold my-1"><a href="${item.url}" class="text-primary">${item.name}</a></h6>
                <p class="text-muted small mb-3">${item.desc}</p>
                <a href="${item.url}" class="btn btn-sm btn-soft-primary w-100">
                  <i class="ri-pencil-line me-1"></i>Viết đơn ngay
                </a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title m-0"><i class="ri-draft-line text-primary me-2"></i>Danh mục toàn bộ thủ tục & đơn từ sinh viên</h5>
        <small class="text-muted">Chọn loại thủ tục bạn cần để điền biểu mẫu gửi trực tiếp lên phòng chức năng.</small>
      </div>
    </div>
    <div class="row">
      ${catHtml}
    </div>
  `;
}

function renderWishlistRegister({ subjects = [], semesters = [], currentSemester = 'Fall2026', wishlist = [], successMsg = null, lang = 'vi' }) {
  const isEn = lang === 'en';

  const rows = wishlist.map((w, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong class="text-primary">${w.subject_code}</strong></td>
      <td>${w.semester_code}</td>
      <td>${w.desired_slot}</td>
      <td>${w.note || '-'}</td>
      <td class="text-center"><span class="badge ${statusTone(w.status)}">${w.status}</span></td>
      <td class="text-center text-muted small">${w.created_at}</td>
    </tr>
  `).join('');

  return `
    ${successMsg ? `<div class="alert alert-success alert-dismissible fade show"><i class="ri-checkbox-circle-line me-1"></i>${successMsg}</div>` : ''}

    <div class="row g-3">
      <div class="col-lg-7">
        <div class="card h-100">
          <div class="card-header bg-transparent border-bottom py-3">
            <h5 class="card-title m-0">
              <i class="ri-file-add-line text-primary me-2"></i>${isEn ? 'Register Course Wishlist' : 'Đăng ký nguyện vọng mở lớp (Wishlist)'}
            </h5>
          </div>
          <div class="card-body">
            <p class="text-muted small">
              ${isEn ? 'Submit your desired course, preferred slot, and semester. When enough students register, the Academic Department will open an official class.' : 'Sinh viên gửi nguyện vọng đối với các môn học chưa có lịch mở hoặc đã hết chỗ. Khi đủ số lượng sinh viên đăng ký, phòng Đào tạo sẽ mở lớp mới.'}
            </p>
            <form action="/Wishlist/Register" method="post">
              <div class="mb-3">
                <label class="form-label fw-semibold">${isEn ? 'Select Subject / Course' : 'Chọn môn học đăng ký'} <span class="text-danger">*</span></label>
                <select name="subject_code" class="form-select" required>
                  <option value="" disabled selected>${isEn ? '-- Select Subject --' : '-- Chọn môn học --'}</option>
                  ${subjects.map(s => `<option value="${s.code}">${s.code} - ${s.name} (${s.credits} ${isEn ? 'Credits' : 'TC'})</option>`).join('')}
                </select>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">${isEn ? 'Semester' : 'Học kỳ'} <span class="text-danger">*</span></label>
                  <select name="semester_code" class="form-select" required>
                    <option value="Fall2026" selected>Fall 2026</option>
                    <option value="Spring2027">Spring 2027</option>
                    <option value="Summer2026">Summer 2026</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">${isEn ? 'Desired Slot' : 'Khung giờ mong muốn'} <span class="text-danger">*</span></label>
                  <select name="desired_slot" class="form-select" required>
                    <option value="Slot 1 (07:30 - 09:00)">Slot 1 (07:30 - 09:00)</option>
                    <option value="Slot 2 (09:15 - 10:45)">Slot 2 (09:15 - 10:45)</option>
                    <option value="Slot 3 (11:00 - 12:30)" selected>Slot 3 (11:00 - 12:30)</option>
                    <option value="Slot 4 (12:45 - 14:15)">Slot 4 (12:45 - 14:15)</option>
                    <option value="Slot 5 (14:30 - 16:00)">Slot 5 (14:30 - 16:00)</option>
                    <option value="Slot 6 (16:15 - 17:45)">Slot 6 (16:15 - 17:45)</option>
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">${isEn ? 'Notes / Justification' : 'Ghi chú / Lý do đăng ký'}</label>
                <textarea name="note" class="form-control" rows="3" placeholder="${isEn ? 'E.g., Need course to graduate on time, retake, slot conflict...' : 'Ví dụ: Cần học để kịp tiến độ tốt nghiệp, học lại cải thiện điểm...'}"></textarea>
              </div>

              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary px-3">
                  <i class="ri-send-plane-fill me-1"></i>${isEn ? 'Submit Wishlist Request' : 'Gửi đăng ký nguyện vọng'}
                </button>
                <a href="/Wishlist" class="btn btn-outline-secondary">
                  <i class="ri-list-check-2 me-1"></i>${isEn ? 'View Wishlist Status' : 'Xem danh sách chờ'}
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card h-100">
          <div class="card-header bg-transparent border-bottom py-3">
            <h5 class="card-title m-0">
              <i class="ri-history-line text-primary me-2"></i>${isEn ? 'My Registered Wishlists' : 'Nguyện vọng đã đăng ký'}
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="text-center">#</th>
                    <th>${isEn ? 'Subject' : 'Môn học'}</th>
                    <th>${isEn ? 'Slot' : 'Khung giờ'}</th>
                    <th class="text-center">${isEn ? 'Status' : 'Trạng thái'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.length > 0 ? rows : `<tr><td colspan="4" class="text-center py-4 text-muted">${isEn ? 'No wishlist requests yet.' : 'Chưa có nguyện vọng nào.'}</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStartupAdd({ successMsg = null, lang = 'vi' }) {
  const isEn = lang === 'en';

  return `
    ${successMsg ? `<div class="alert alert-success alert-dismissible fade show"><i class="ri-checkbox-circle-line me-1"></i>${successMsg}</div>` : ''}

    <div class="row justify-content-center">
      <div class="col-lg-9">
        <div class="card">
          <div class="card-header bg-transparent border-bottom py-3 d-flex justify-content-between align-items-center">
            <h5 class="card-title m-0">
              <i class="ri-rocket-line text-primary me-2 fs-18"></i>${isEn ? 'Submit Student Startup Proposal' : 'Gửi đơn đề án khởi nghiệp sinh viên CTL'}
            </h5>
            <a href="/StartupGroup" class="btn btn-sm btn-outline-primary">
              <i class="ri-list-check me-1"></i>${isEn ? 'Startup Proposals List' : 'Danh sách đơn khởi nghiệp'}
            </a>
          </div>
          <div class="card-body p-4">
            <div class="alert alert-info border-0 mb-4">
              <i class="ri-lightbulb-line me-2 fs-18"></i>
              <strong>${isEn ? 'CTL Startup Incubator:' : 'Vườn ươm khởi nghiệp CTL:'}</strong>
              ${isEn ? 'The University supports projects with mentorship, seed funding, lab access, and incubation workspaces.' : 'Nhà trường hỗ trợ các nhóm dự án sinh viên về cố vấn chuyên môn, không gian ươm tạo, phòng Lab và quỹ hỗ trợ khởi nghiệp.'}
            </div>

            <form action="/StartupGroup/Add" method="post">
              <div class="row g-3">
                <div class="col-md-7">
                  <label class="form-label fw-semibold">${isEn ? 'Project / Idea Name' : 'Tên dự án / Ý tưởng khởi nghiệp'} <span class="text-danger">*</span></label>
                  <input type="text" name="project_name" class="form-control" required placeholder="${isEn ? 'E.g., Smart Campus AI Platform' : 'Ví dụ: Nền tảng SafeCampus AI'}">
                </div>
                <div class="col-md-5">
                  <label class="form-label fw-semibold">${isEn ? 'Field / Domain' : 'Lĩnh vực khởi nghiệp'} <span class="text-danger">*</span></label>
                  <select name="field" class="form-select" required>
                    <option value="Trí tuệ nhân tạo (AI)">Trí tuệ nhân tạo (AI)</option>
                    <option value="FinTech & E-Commerce">FinTech & Thương mại điện tử</option>
                    <option value="EdTech (Giáo dục số)">EdTech (Giáo dục số)</option>
                    <option value="IoT & Smart Devices">IoT & Thiết bị thông minh</option>
                    <option value="Green Tech & Môi trường">Green Tech & Môi trường</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold">${isEn ? 'Project Leader' : 'Trưởng nhóm đề án'}</label>
                  <input type="text" class="form-control" value="Cao Thanh Lâm (CT193667)" disabled readonly>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">${isEn ? 'Number of Members' : 'Số lượng thành viên nhóm'} <span class="text-danger">*</span></label>
                  <input type="number" name="member_count" class="form-control" min="1" max="10" value="3" required>
                  <small class="text-muted">${isEn ? 'Standard team: 3 - 5 members' : 'Quy mô khuyến nghị: 3 - 5 thành viên'}</small>
                </div>

                <div class="col-12">
                  <label class="form-label fw-semibold">${isEn ? 'Target Problem & Solution Summary' : 'Mô tả tóm tắt ý tưởng & Giải pháp'} <span class="text-danger">*</span></label>
                  <textarea name="description" rows="4" class="form-control" required placeholder="${isEn ? 'Describe problem statement, solution, target audience, and current progress...' : 'Trình bày bài toán thực tế, giải pháp công nghệ, đối tượng khách hàng mục tiêu và tiến độ hiện tại...'}"></textarea>
                </div>

                <div class="col-12">
                  <label class="form-label fw-semibold">${isEn ? 'Desired Mentor (Optional)' : 'Giảng viên / Chuyên gia cố vấn mong muốn (nếu có)'}</label>
                  <input type="text" name="mentor_preference" class="form-control" placeholder="${isEn ? 'E.g., Dr. Nguyen Van A - Dept of Software Engineering' : 'Ví dụ: TS. Nguyễn Văn A - Bộ môn Kỹ thuật phần mềm'}">
                </div>

                <div class="col-12 pt-2">
                  <button type="submit" class="btn btn-primary px-4 py-2 fw-semibold">
                    <i class="ri-send-plane-2-line me-1"></i>${isEn ? 'Submit Startup Proposal' : 'Gửi đơn đề án khởi nghiệp'}
                  </button>
                  <a href="/StartupGroup" class="btn btn-light ms-2">${isEn ? 'Cancel' : 'Hủy bỏ'}</a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderUserGuide({ lang = 'vi' }) {
  const isEn = lang === 'en';

  return `
    <div class="row mb-3">
      <div class="col-12">
        <div class="card bg-primary-subtle border-0">
          <div class="card-body p-4">
            <div class="d-flex align-items-center gap-3">
              <div class="avatar-md rounded bg-primary text-white d-flex align-items-center justify-content-center fs-24">
                <i class="ri-book-read-line"></i>
              </div>
              <div>
                <h4 class="m-0 fw-bold">${isEn ? 'CAP System User Guide & Documentation' : 'Cẩm nang hướng dẫn sử dụng Cổng đào tạo CAP'}</h4>
                <p class="text-muted mb-0 mt-1">${isEn ? 'Official user guide, procedures, FAQs, and regulations for CTL University students.' : 'Tài liệu hướng dẫn thao tác nghiệp vụ, quy trình nộp đơn, tra cứu học tập và sổ tay sinh viên Đại học CTL.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-8">
        <div class="accordion" id="guideAccordion">
          <!-- Guide 1 -->
          <div class="accordion-item mb-2 border rounded">
            <h2 class="accordion-header" id="headingOne">
              <button class="accordion-button fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#guide1">
                <i class="ri-calendar-event-line text-primary me-2 fs-18"></i>
                1. ${isEn ? 'How to Check Timetable & Exam Schedule' : 'Hướng dẫn tra cứu Thời khóa biểu & Lịch thi'}
              </button>
            </h2>
            <div id="guide1" class="accordion-collapse collapse show" data-bs-parent="#guideAccordion">
              <div class="accordion-body text-muted">
                <p>${isEn ? 'Students can view weekly slots, classroom numbers, and lecturer details under <strong>Academics -> Schedules -> Weekly Timetable</strong>.' : 'Sinh viên truy cập mục <strong>Học tập -> Lịch học -> Thời khóa biểu</strong> để xem lịch theo từng tuần, ca học (Slot 1 - 6), giảng viên và phòng học.'}</p>
                <p class="mb-0">${isEn ? 'For exam schedules, room assignments, and EOS test format details, navigate to <strong>Academics -> Schedules -> Exam Schedule</strong>.' : 'Lịch thi kết thúc học phần (FE) và lịch thi lại (2NDFE) được cập nhật chi tiết tại <strong>Học tập -> Lịch học -> Lịch thi</strong>.'}</p>
              </div>
            </div>
          </div>

          <!-- Guide 2 -->
          <div class="accordion-item mb-2 border rounded">
            <h2 class="accordion-header" id="headingTwo">
              <button class="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#guide2">
                <i class="ri-file-edit-line text-primary me-2 fs-18"></i>
                2. ${isEn ? 'Submitting Online Student Applications' : 'Hướng dẫn nộp Đơn từ trực tuyến'}
              </button>
            </h2>
            <div id="guide2" class="accordion-collapse collapse" data-bs-parent="#guideAccordion">
              <div class="accordion-body text-muted">
                <p>${isEn ? 'Navigate to <strong>Applications -> Submit Application</strong> to browse catalog categories: Leave of Absence, Cross-class Transfer, Certificate Requests, and Grade Appeals.' : 'Truy cập mục <strong>Đơn từ -> Gửi đơn</strong> để chọn biểu mẫu: Đơn nghỉ học tạm thời, Đơn đổi lớp chéo, Đơn cấp bảng điểm, Đơn phúc khảo.'}</p>
                <p class="mb-0">${isEn ? 'Track application status and responses at <strong>Applications -> View Applications</strong>.' : 'Theo dõi kết quả xử lý của phòng Đào tạo tại mục <strong>Đơn từ -> Xem đơn</strong>.'}</p>
              </div>
            </div>
          </div>

          <!-- Guide 3 -->
          <div class="accordion-item mb-2 border rounded">
            <h2 class="accordion-header" id="headingThree">
              <button class="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#guide3">
                <i class="ri-wallet-3-line text-primary me-2 fs-18"></i>
                3. ${isEn ? 'Finance, Tuition & CAP Wallet Top-up' : 'Hướng dẫn Tài chính & Nạp tiền ví CAP'}
              </button>
            </h2>
            <div id="guide3" class="accordion-collapse collapse" data-bs-parent="#guideAccordion">
              <div class="accordion-body text-muted">
                <p>${isEn ? 'Students can top up their CAP Wallet via VNPay QR, MoMo, or Domestic/Credit Cards under <strong>Finance -> Topup CAP Wallet</strong>.' : 'Sinh viên có thể nạp tiền vào ví điện tử CAP thông qua mã quét VietQR VNPay, MoMo hoặc Thẻ ngân hàng tại mục <strong>Tài chính -> Thanh toán -> Nạp tiền ví CAP</strong>.'}</p>
                <p class="mb-0">${isEn ? 'Tuition and placement fees can be settled directly with one click from <strong>Finance -> Pay Fees & Tuition</strong>.' : 'Các khoản học phí kỳ mới và phí xếp lớp được thanh toán nhanh chóng chỉ với 1 thao tác tại <strong>Tài chính -> Thanh toán -> Thanh toán các khoản phí</strong>.'}</p>
              </div>
            </div>
          </div>

          <!-- Guide 4 -->
          <div class="accordion-item mb-2 border rounded">
            <h2 class="accordion-header" id="headingFour">
              <button class="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#guide4">
                <i class="ri-heart-add-line text-primary me-2 fs-18"></i>
                4. ${isEn ? 'Course Wishlist & Placement Request' : 'Hướng dẫn Đăng ký Wishlist nguyện vọng môn học'}
              </button>
            </h2>
            <div id="guide4" class="accordion-collapse collapse" data-bs-parent="#guideAccordion">
              <div class="accordion-body text-muted">
                <p class="mb-0">${isEn ? 'When a course is not scheduled or slots are full, register under <strong>Wishlist -> Register Wishlist</strong> to petition the department to open a new class.' : 'Khi cần học vượt hoặc học lại môn chưa có lớp, sinh viên vào mục <strong>Wishlist -> Đăng ký wishlist</strong> để gửi nguyện vọng. Khi có đủ số lượng sinh viên đăng ký cùng khung giờ, phòng Đào tạo sẽ mở lớp bổ sung.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card mb-3">
          <div class="card-header bg-transparent border-bottom py-3">
            <h5 class="card-title m-0">
              <i class="ri-file-download-line text-primary me-2"></i>${isEn ? 'Download PDF Guides' : 'Tải tài liệu PDF chính thức'}
            </h5>
          </div>
          <div class="card-body p-3">
            <ul class="list-group list-group-flush">
              <li class="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                <div>
                  <i class="ri-file-pdf-fill text-danger fs-18 me-1 align-middle"></i>
                  <span class="fw-semibold small">${isEn ? 'Student Handbook 2026' : 'Sổ tay sinh viên CTL 2026'}</span>
                </div>
                <a href="/Document" class="btn btn-xs btn-outline-primary">${isEn ? 'Download' : 'Tải về'}</a>
              </li>
              <li class="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                <div>
                  <i class="ri-file-pdf-fill text-danger fs-18 me-1 align-middle"></i>
                  <span class="fw-semibold small">${isEn ? 'Undergraduate Academic Regulations' : 'Quy chế đào tạo Đại học CTL'}</span>
                </div>
                <a href="/Document" class="btn btn-xs btn-outline-primary">${isEn ? 'Download' : 'Tải về'}</a>
              </li>
              <li class="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                <div>
                  <i class="ri-file-pdf-fill text-danger fs-18 me-1 align-middle"></i>
                  <span class="fw-semibold small">${isEn ? 'Account & 2FA Security Guide' : 'Hướng dẫn bảo mật tài khoản'}</span>
                </div>
                <a href="/Document" class="btn btn-xs btn-outline-primary">${isEn ? 'Download' : 'Tải về'}</a>
              </li>
            </ul>
          </div>
        </div>

        <div class="card">
          <div class="card-body p-3">
            <h6 class="fw-bold text-primary mb-2"><i class="ri-customer-service-2-line me-1"></i>${isEn ? 'Need Support?' : 'Hỗ trợ sinh viên'}</h6>
            <p class="small text-muted mb-2">${isEn ? 'Contact the Academic & Student Affairs Office for assistance:' : 'Liên hệ các phòng ban chức năng khi cần hỗ trợ:'}</p>
            <ul class="list-unstyled small mb-0">
              <li class="mb-1"><i class="ri-mail-line me-1 text-primary"></i>Email: <strong>daotao@ctl.edu.vn</strong></li>
              <li class="mb-1"><i class="ri-phone-line me-1 text-success"></i>Hotline: <strong>(024) 7300 1866</strong></li>
              <li><i class="ri-map-pin-line me-1 text-warning"></i>${isEn ? 'Room 102, Innovation Building, Hanoi Campus' : 'Phòng 102, Tòa nhà Đổi mới, Cơ sở Hà Nội'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

module.exports = {
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
};
