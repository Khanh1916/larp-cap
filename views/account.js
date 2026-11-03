function renderAccount({ student }) {
  const avatar = student ? (student.avatar || (student.full_name ? student.full_name.split(' ').map(n=>n[0]).join('').slice(0,3) : 'CTL')) : 'CTL';
  const balance = student ? (Number(student.balance) || 0).toLocaleString('vi-VN') : '0';
  return `
    <div class="row">
      <div class="col-xl-4 col-lg-5">
        <div class="card text-center">
          <div class="card-body">
            <div class="avatar-lg mx-auto mb-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fs-24 fw-bold">
              ${avatar}
            </div>
            <h4 class="mb-1 mt-2">${student.full_name}</h4>
            <p class="text-muted mb-3">${student.roll_number} | Khóa ${student.cohort}</p>

            <div class="text-start mt-3">
              <p class="text-muted mb-2 font-13"><strong>Mã sinh viên:</strong> <span class="ms-2">${student.roll_number}</span></p>
              <p class="text-muted mb-2 font-13"><strong>Trạng thái:</strong> <span class="badge bg-success ms-2">${student.status} (Hoạt động)</span></p>
              <p class="text-muted mb-2 font-13"><strong>Chuyên ngành:</strong> <span class="ms-2 text-primary fw-semibold">${student.major_name}</span></p>
              <p class="text-muted mb-2 font-13"><strong>Mã chương trình:</strong> <span class="ms-2">${student.program_code}</span></p>
              <p class="text-muted mb-2 font-13"><strong>Cơ sở đào tạo:</strong> <span class="ms-2">Cơ sở Hà Nội (HN)</span></p>
              <p class="text-muted mb-1 font-13"><strong>Số dư ví tài khoản:</strong> <span class="ms-2 fw-bold text-success">${balance} VNĐ</span></p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-8 col-lg-7">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-user-settings-line text-primary me-2"></i>Thông tin cá nhân chi tiết</h5>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label text-muted">Họ và tên</label>
                <div class="form-control-plaintext fw-bold">${student.full_name}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted">Mã số sinh viên (RollNumber)</label>
                <div class="form-control-plaintext fw-bold text-primary">${student.roll_number}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted">Email trường (CTL Edu)</label>
                <div class="form-control-plaintext text-primary fw-semibold">${student.email}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted">Email cá nhân (Gmail)</label>
                <div class="form-control-plaintext">${student.personal_email || 'caothanhlam2005@gmail.com'}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted">Số điện thoại</label>
                <div class="form-control-plaintext">${student.phone}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted">Ngày sinh</label>
                <div class="form-control-plaintext">${student.dob}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted">Giới tính</label>
                <div class="form-control-plaintext">${student.gender}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted">Số CCCD / CMND</label>
                <div class="form-control-plaintext">${student.id_card}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted">Địa chỉ thường trú</label>
                <div class="form-control-plaintext">${student.address}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

module.exports = { renderAccount };
