function renderApplications({ applications, successMsg = null }) {
  let appRows = '';
  if (applications.length === 0) {
    appRows = `<tr><td colspan="5" class="text-center py-4 text-muted">Bạn chưa gửi đơn từ nào.</td></tr>`;
  } else {
    applications.forEach((app, idx) => {
      let statusBadge = '<span class="badge badge-soft-warning">Đang xử lý</span>';
      if (app.status === 'Đã duyệt') statusBadge = '<span class="badge badge-soft-success">Đã duyệt</span>';
      else if (app.status === 'Từ chối') statusBadge = '<span class="badge badge-soft-danger">Từ chối</span>';

      appRows += `<tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong class="text-primary">${app.app_type}</strong></td>
        <td>${app.reason}</td>
        <td class="text-center text-muted small">${app.created_at}</td>
        <td class="text-center">${statusBadge}</td>
      </tr>`;
    });
  }

  return `
    ${successMsg ? `<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="ri-check-line me-1"></i>${successMsg}</div>` : ''}

    <div class="row">
      <div class="col-lg-7">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-history-line text-primary me-2"></i>Lịch sử đơn đã gửi</h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-striped mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="cap-w-50 text-center">STT</th>
                    <th>Loại đơn</th>
                    <th>Lý do / Nội dung</th>
                    <th class="text-center">Thời gian</th>
                    <th class="text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  ${appRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card">
          <div class="card-header border-bottom bg-transparent">
            <h5 class="card-title m-0"><i class="ri-send-plane-fill text-primary me-2"></i>Tạo đơn trực tuyến mới</h5>
          </div>
          <div class="card-body">
            <form action="/Application/Submit" method="post">
              <div class="mb-3">
                <label class="form-label fw-semibold">Loại thủ tục / đơn từ <span class="text-danger">*</span></label>
                <select name="app_type" class="form-select" required>
                  <option value="" disabled selected>-- Chọn loại đơn --</option>
                  <option value="Đơn xin nghỉ học có phép">Đơn xin nghỉ học có phép</option>
                  <option value="Đơn xin đổi lớp chéo">Đơn xin đổi lớp chéo</option>
                  <option value="Đơn phúc khảo điểm thi">Đơn phúc khảo điểm thi</option>
                  <option value="Đơn xin cấp bảng điểm">Đơn xin cấp bảng điểm</option>
                  <option value="Đơn xin bảo lưu học phần">Đơn xin bảo lưu học phần</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Lý do chi tiết <span class="text-danger">*</span></label>
                <textarea name="reason" rows="4" class="form-control" placeholder="Trình bày rõ ràng lý do gửi đơn..." required></textarea>
              </div>

              <button type="submit" class="btn btn-primary w-100">
                <i class="ri-send-plane-line me-1"></i>Gửi đơn lên phòng Đào tạo
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

module.exports = { renderApplications };
