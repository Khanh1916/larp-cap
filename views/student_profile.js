function renderEditProfile({ student, successMsg = null }) {
  return `
    ${successMsg ? `<div class="alert alert-success"><i class="ri-checkbox-circle-line me-1"></i>${successMsg}</div>` : ''}

    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-user-settings-line text-primary me-2"></i>Cập nhật thông tin hồ sơ sinh viên</h5>
          </div>
          <div class="card-body">
            <form action="/StudentProfile/Update" method="post">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label text-muted">Họ và tên sinh viên</label>
                  <input type="text" class="form-control" value="${student.full_name}" disabled>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Mã số sinh viên (RollNumber)</label>
                  <input type="text" class="form-control" value="${student.roll_number}" disabled>
                </div>

                <div class="col-md-6">
                  <label class="form-label text-muted">Email sinh viên</label>
                  <input type="email" class="form-control" value="${student.email}" disabled>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Số điện thoại liên hệ <span class="text-danger">*</span></label>
                  <input type="tel" name="phone" class="form-control" value="${student.phone || ''}" required>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold">Ngày sinh</label>
                  <input type="date" name="dob" class="form-control" value="${student.dob || ''}">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Giới tính</label>
                  <select name="gender" class="form-select">
                    <option value="Nam" ${student.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                    <option value="Nữ" ${student.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label fw-semibold">Địa chỉ thường trú / Chỗ ở hiện nay <span class="text-danger">*</span></label>
                  <input type="text" name="address" class="form-control" value="${student.address || ''}" required>
                </div>

                <div class="col-12 mt-4">
                  <button type="submit" class="btn btn-primary px-4">
                    <i class="ri-save-line me-1"></i>Lưu thông tin hồ sơ
                  </button>
                  <a href="/Account" class="btn btn-outline-secondary ms-2">Hủy bỏ</a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

module.exports = { renderEditProfile };
