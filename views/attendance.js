function renderAttendance({ summary = [], semesters = [], currentSemester = 'Fall2026' }) {
  const semObj = semesters.find(s => s.code === currentSemester) || { name: currentSemester };
  
  let rowsHtml = '';
  if (summary.length === 0) {
    rowsHtml = `<tr><td colspan="7" class="text-center py-4 text-muted"><i class="ri-inbox-line fs-24 d-block mb-1"></i>Chưa có dữ liệu điểm danh cho học kỳ <strong>${semObj.name || currentSemester}</strong>.</td></tr>`;
  } else {
    summary.forEach((item, idx) => {
      const isWarning = item.absent_percentage >= 15;
      const isFailed = item.absent_percentage >= 20;
      let badge = '<span class="badge badge-soft-success">Tốt</span>';
      if (isFailed) badge = '<span class="badge badge-soft-danger">Cấm thi</span>';
      else if (isWarning) badge = '<span class="badge badge-soft-warning">Nguy cơ</span>';

      rowsHtml += `<tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong class="text-primary">${item.subject_code}</strong></td>
        <td>${item.subject_name || item.subject_code}</td>
        <td class="text-center">${item.total_slots}</td>
        <td class="text-center fw-bold ${item.absent_slots > 0 ? 'text-danger' : 'text-success'}">${item.absent_slots}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="progress flex-grow-1" style="height: 6px;">
              <div class="progress-bar ${isFailed ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success'}" style="width: ${Math.min(100, item.absent_percentage * 5)}%"></div>
            </div>
            <span class="small fw-semibold" style="width: 45px;">${item.absent_percentage.toFixed(1)}%</span>
          </div>
        </td>
        <td class="text-center">${badge}</td>
      </tr>`;
    });
  }

  const semesterOptions = (semesters && semesters.length > 0)
    ? semesters.map(s => `<option value="${s.code}" ${s.code === currentSemester ? 'selected' : ''}>${s.name}</option>`).join('')
    : `<option value="${currentSemester}" selected>${semObj.name || currentSemester}</option>`;

  return `
    <div class="card mb-3">
      <div class="card-body p-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div class="d-flex align-items-center gap-2">
            <span class="fw-semibold"><i class="ri-calendar-event-line text-primary me-1"></i>Học kỳ:</span>
            <select class="form-select form-select-sm w-auto fw-medium" data-semester-select>
              ${semesterOptions}
            </select>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge badge-soft-primary px-3 py-2 fs-13"><i class="ri-user-star-line me-1"></i>${semObj.name || currentSemester}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
        <h5 class="card-title m-0"><i class="ri-user-follow-line text-primary me-2"></i>Chi tiết điểm danh môn học</h5>
        <small class="text-muted"><i class="ri-information-line me-1"></i>Vắng quá 20% tổng số ca sẽ bị cấm thi (bảo lưu/học lại).</small>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th class="text-center" style="width: 60px;">STT</th>
                <th>Mã môn</th>
                <th>Tên môn</th>
                <th class="text-center">Tổng số ca</th>
                <th class="text-center">Số ca vắng</th>
                <th style="width: 250px;">Tỉ lệ vắng (Tối đa 20%)</th>
                <th class="text-center">Trạng thái</th>
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

module.exports = { renderAttendance };
