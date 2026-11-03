function renderShoppingCart({ cartItems, student, errorMsg = null, successMsg = null }) {
  let rowsHtml = '';
  let totalPending = 0;

  if (cartItems.length === 0) {
    rowsHtml = `<tr><td colspan="6" class="text-center py-4 text-muted">Hiện tại bạn không có khoản phí nào cần thanh toán.</td></tr>`;
  } else {
    cartItems.forEach((item, idx) => {
      const isUnpaid = item.status === 'Chưa thanh toán';
      if (isUnpaid) totalPending += item.amount;

      rowsHtml += `<tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong class="text-primary">${item.fee_title}</strong></td>
        <td>${item.semester_code}</td>
        <td class="text-end fw-bold text-danger">${item.amount.toLocaleString('vi-VN')} VND</td>
        <td class="text-center text-muted">${item.due_date}</td>
        <td class="text-center">
          ${isUnpaid ? `
            <form action="/ShoppingCart/Pay" method="post" class="d-inline">
              <input type="hidden" name="item_id" value="${item.id}">
              <button type="submit" class="btn btn-sm btn-primary">
                <i class="ri-wallet-3-line me-1"></i>Thanh toán ngay
              </button>
            </form>
          ` : '<span class="badge badge-soft-success">Đã thanh toán</span>'}
        </td>
      </tr>`;
    });
  }

  return `
    ${errorMsg ? `<div class="alert alert-danger alert-dismissible fade show"><i class="ri-error-warning-line me-1"></i>${errorMsg}</div>` : ''}
    ${successMsg ? `<div class="alert alert-success alert-dismissible fade show"><i class="ri-checkbox-circle-line me-1"></i>${successMsg}</div>` : ''}

    <div class="row mb-3">
      <div class="col-md-6">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <h5 class="m-0 text-white-50">Số dư ví tài khoản CAP</h5>
            <h2 class="my-2 text-white fw-bold">${student.balance.toLocaleString('vi-VN')} VND</h2>
            <a href="/Finance/Topup" class="btn btn-light btn-sm text-primary fw-bold mt-1">
              <i class="ri-add-circle-line me-1"></i>Nạp tiền vào ví
            </a>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card bg-danger text-white">
          <div class="card-body">
            <h5 class="m-0 text-white-50">Tổng số tiền cần thanh toán</h5>
            <h2 class="my-2 text-white fw-bold">${totalPending.toLocaleString('vi-VN')} VND</h2>
            <small class="text-white-50">Vui lòng nộp học phí đúng hạn để tránh bị hủy môn xếp lớp.</small>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header bg-transparent border-bottom">
        <h5 class="card-title m-0"><i class="ri-shopping-cart-line text-primary me-2"></i>Danh sách các khoản phí sinh viên</h5>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 50px;" class="text-center">STT</th>
                <th>Tên khoản thu</th>
                <th>Học kỳ</th>
                <th class="text-end" style="width: 180px;">Số tiền</th>
                <th class="text-center" style="width: 140px;">Hạn nộp</th>
                <th class="text-center" style="width: 160px;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderTransactions({ transactions, student }) {
  let rows = transactions.map((t, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><code>${t.trans_code}</code></td>
      <td><span class="badge badge-soft-info">${t.trans_type}</span></td>
      <td>${t.description}</td>
      <td class="text-end fw-bold ${t.trans_type === 'Nạp tiền ví' ? 'text-success' : 'text-danger'}">
        ${t.trans_type === 'Nạp tiền ví' ? '+' : '-'}${t.amount.toLocaleString('vi-VN')} VND
      </td>
      <td class="text-center"><span class="badge bg-secondary">${t.payment_method}</span></td>
      <td class="text-center text-muted small">${t.created_at}</td>
      <td class="text-center"><span class="badge badge-soft-success">${t.status}</span></td>
    </tr>
  `).join('');

  return `
    <div class="card mb-3">
      <div class="card-body d-flex justify-content-between align-items-center">
        <div>
          <h5 class="card-title m-0"><i class="ri-history-line text-primary me-2"></i>Lịch sử giao dịch tài chính</h5>
          <small class="text-muted">Ghi nhận toàn bộ các giao dịch nạp tiền, đóng học phí, lệ phí thi.</small>
        </div>
        <a href="/Finance/Topup" class="btn btn-primary btn-sm">
          <i class="ri-add-line me-1"></i>Nạp tiền ví CAP
        </a>
      </div>
    </div>

    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 50px;" class="text-center">STT</th>
                <th>Mã GD</th>
                <th>Loại giao dịch</th>
                <th>Nội dung</th>
                <th class="text-end">Số tiền</th>
                <th class="text-center">Phương thức</th>
                <th class="text-center">Thời gian</th>
                <th class="text-center">Trạng thái</th>
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

function renderTopup({ student, successMsg = null }) {
  return `
    ${successMsg ? `<div class="alert alert-success"><i class="ri-checkbox-circle-line me-1"></i>${successMsg}</div>` : ''}

    <div class="row justify-content-center">
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-bank-card-line text-primary me-2"></i>Nạp tiền vào tài khoản sinh viên CAP</h5>
          </div>
          <div class="card-body">
            <div class="alert alert-info py-2 small mb-3">
              <i class="ri-information-line me-1"></i>Số dư ví hiện tại của bạn: <strong>${student.balance.toLocaleString('vi-VN')} VND</strong>
            </div>

            <form action="/Finance/Topup" method="post">
              <div class="mb-3">
                <label class="form-label fw-semibold">Chọn hoặc nhập số tiền cần nạp (VND) <span class="text-danger">*</span></label>
                <div class="input-group mb-2">
                  <input type="number" name="amount" class="form-control" placeholder="Ví dụ: 1000000" min="50000" step="50000" required value="500000">
                  <span class="input-group-text">VND</span>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                  <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.querySelector('input[name=amount]').value=200000">200.000đ</button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.querySelector('input[name=amount]').value=500000">500.000đ</button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.querySelector('input[name=amount]').value=1000000">1.000.000đ</button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.querySelector('input[name=amount]').value=5000000">5.000.000đ</button>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Phương thức nạp tiền <span class="text-danger">*</span></label>
                <div class="form-check mb-2">
                  <input class="form-check-input" type="radio" name="method" id="pay1" value="VNPay QR" checked>
                  <label class="form-check-label fw-semibold" for="pay1">
                    Cổng VNPay (Quét mã VietQR Ngân hàng)
                  </label>
                </div>
                <div class="form-check mb-2">
                  <input class="form-check-input" type="radio" name="method" id="pay2" value="Ví MoMo">
                  <label class="form-check-label fw-semibold" for="pay2">
                    Ví điện tử MoMo
                  </label>
                </div>
                <div class="form-check mb-2">
                  <input class="form-check-input" type="radio" name="method" id="pay3" value="Thẻ ATM / Visa / Master">
                  <label class="form-check-label fw-semibold" for="pay3">
                    Thẻ ghi nợ / Tín dụng quốc tế
                  </label>
                </div>
              </div>

              <button type="submit" class="btn btn-success w-100 py-2 fw-bold">
                <i class="ri-check-line me-1"></i>Xác nhận nạp tiền vào ví CAP
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCoursePendingPayment({ student, pendingCourses = [], semesters = [], currentSemester = 'Fall2026', lang = 'vi' }) {
  const isEn = lang === 'en';

  let rowsHtml = '';
  if (pendingCourses.length === 0) {
    rowsHtml = `<tr>
      <td colspan="7" class="text-center py-5 text-muted">
        <div class="my-2">
          <i class="ri-checkbox-circle-line fs-36 text-success d-block mb-2"></i>
          <h6 class="fw-bold mb-1">${isEn ? 'No courses pending placement fee' : 'Không có học phần nào đang chờ nộp phí xếp lớp'}</h6>
          <small class="text-muted">${isEn ? 'You are all set for current semester' : 'Tất cả các môn học của bạn đã hoàn tất đăng ký hoặc không phát sinh phí giữ chỗ kỳ'} <strong>${currentSemester}</strong>.</small>
        </div>
      </td>
    </tr>`;
  } else {
    rowsHtml = pendingCourses.map((c, i) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td><strong class="text-primary">${c.subject_code}</strong></td>
        <td>${c.subject_name || c.subject_code}</td>
        <td class="text-center">${c.credits || 3}</td>
        <td class="text-end fw-bold text-danger">${(Number(c.fee) || 2400000).toLocaleString('vi-VN')} VND</td>
        <td class="text-center"><span class="badge badge-soft-warning">${c.status || 'Chờ nộp phí'}</span></td>
        <td class="text-center">
          <a href="/Finance/Topup" class="btn btn-sm btn-primary">
            <i class="ri-wallet-3-line me-1"></i>${isEn ? 'Pay' : 'Nộp phí'}
          </a>
        </td>
      </tr>
    `).join('');
  }

  return `
    <div class="row mb-3">
      <div class="col-12">
        <div class="card bg-primary-subtle border-0">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div class="d-flex align-items-center gap-3">
                <div class="avatar-sm rounded bg-primary text-white d-flex align-items-center justify-content-center fs-20">
                  <i class="ri-money-dollar-circle-line"></i>
                </div>
                <div>
                  <h5 class="m-0 fw-bold">${isEn ? 'Course Placement Fee Management' : 'Quản lý Phí xếp lớp'}</h5>
                  <small class="text-muted">${isEn ? 'Placement fee applies to retakes, fast-track, and curriculum transfer course registrations.' : 'Phí giữ chỗ & xếp lớp áp dụng cho các học phần đăng ký học lại, học vượt hoặc chuyển đổi chương trình.'}</small>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <a href="/Finance/Topup" class="btn btn-sm btn-primary">
                  <i class="ri-wallet-3-line me-1"></i>${isEn ? 'Topup CAP Wallet' : 'Nạp tiền ví CAP'}
                </a>
                <a href="/ShoppingCart" class="btn btn-sm btn-outline-primary">
                  <i class="ri-shopping-cart-2-line me-1"></i>${isEn ? 'Tuition & Cart' : 'Giỏ hàng học phí'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2 py-3">
        <h5 class="card-title m-0">
          <i class="ri-time-line text-primary me-2"></i>${isEn ? 'Courses Pending Placement Fee' : 'Danh sách môn chờ nộp phí xếp lớp'}
        </h5>
        <div class="d-flex align-items-center gap-2">
          <span class="small fw-semibold">${isEn ? 'Semester:' : 'Học kỳ:'}</span>
          <select class="form-select form-select-sm w-auto" onchange="location.href='?semester=' + this.value">
            <option value="Fall2026" ${currentSemester === 'Fall2026' ? 'selected' : ''}>Fall 2026</option>
            <option value="Summer2026" ${currentSemester === 'Summer2026' ? 'selected' : ''}>Summer 2026</option>
            <option value="Spring2026" ${currentSemester === 'Spring2026' ? 'selected' : ''}>Spring 2026</option>
          </select>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="text-center" style="width: 50px;">${isEn ? '#' : 'STT'}</th>
                <th>${isEn ? 'Course Code' : 'Mã môn'}</th>
                <th>${isEn ? 'Course Name' : 'Tên môn học'}</th>
                <th class="text-center">${isEn ? 'Credits' : 'Số tín chỉ'}</th>
                <th class="text-end">${isEn ? 'Placement Fee' : 'Mức phí xếp lớp'}</th>
                <th class="text-center">${isEn ? 'Status' : 'Trạng thái'}</th>
                <th class="text-center">${isEn ? 'Action' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer bg-transparent border-top py-2 text-muted small">
        <i class="ri-information-line text-info me-1"></i>${isEn ? 'Students must complete placement fee payment before the deadline to ensure placement into official classes.' : 'Sinh viên cần hoàn thành nộp phí xếp lớp trước hạn chót của kỳ học để hệ thống sắp xếp vào danh sách lớp chính thức.'}
      </div>
    </div>
  `;
}

module.exports = { renderShoppingCart, renderTransactions, renderTopup, renderCoursePendingPayment };
