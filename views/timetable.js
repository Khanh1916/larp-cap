function renderTimetable({ schedules = [], semesters = [], currentSemester = 'Fall2026', weekText = 'Tuần học tiêu chuẩn' }) {
  const semObj = semesters.find(s => s.code === currentSemester) || { name: currentSemester };
  
  // Dynamic dates based on semester
  let datePrefix = '02/11/2026';
  if (currentSemester.startsWith('Spring2025')) datePrefix = '13/01/2025';
  else if (currentSemester.startsWith('Summer2025')) datePrefix = '12/05/2025';
  else if (currentSemester.startsWith('Fall2025')) datePrefix = '08/09/2025';
  else if (currentSemester.startsWith('Spring2026')) datePrefix = '02/03/2026';
  else if (currentSemester.startsWith('Summer2026')) datePrefix = '11/05/2026';
  else if (currentSemester.startsWith('Fall2026')) datePrefix = '02/11/2026';

  const days = [
    { label: 'Thứ Hai', dow: 1 },
    { label: 'Thứ Ba', dow: 2 },
    { label: 'Thứ Tư', dow: 3 },
    { label: 'Thứ Năm', dow: 4 },
    { label: 'Thứ Sáu', dow: 5 },
    { label: 'Thứ Bảy', dow: 6 },
    { label: 'Chủ Nhật', dow: 0 }
  ];

  const slots = [
    { id: 1, time: '07:30 - 09:00' },
    { id: 2, time: '09:15 - 10:45' },
    { id: 3, time: '11:00 - 12:30' },
    { id: 4, time: '12:45 - 14:15' },
    { id: 5, time: '14:30 - 16:00' },
    { id: 6, time: '16:15 - 17:45' }
  ];

  let tbodyHtml = '';
  for (const s of slots) {
    tbodyHtml += `<tr>
      <td class="fw-semibold bg-light text-dark p-2" style="width: 120px;">
        <div>Slot ${s.id}</div>
        <small class="text-muted">${s.time}</small>
      </td>`;

    for (const d of days) {
      const match = schedules.find(item => item.day_of_week === d.dow && item.slot === s.id);
      if (match) {
        let statusBadge = '<span class="badge badge-soft-warning">Chưa diễn ra</span>';
        let cardClass = 'not-yet';
        if (match.status === 'Attended') {
          statusBadge = '<span class="badge badge-soft-success">Đã điểm danh</span>';
          cardClass = 'attended';
        } else if (match.status === 'Absent') {
          statusBadge = '<span class="badge badge-soft-danger">Vắng mặt</span>';
          cardClass = 'absent';
        }

        tbodyHtml += `<td>
          <div class="slot-card ${cardClass}">
            <div class="fw-bold text-primary mb-1">${match.subject_code}</div>
            <div class="small fw-semibold text-truncate mb-1" title="${match.subject_name}">${match.subject_name}</div>
            <div class="small text-muted mb-1"><i class="ri-building-line me-1"></i>Phòng: <strong>${match.room}</strong></div>
            <div class="small text-muted mb-1"><i class="ri-user-star-line me-1"></i>GV: ${match.lecturer}</div>
            <div>${statusBadge}</div>
          </div>
        </td>`;
      } else {
        tbodyHtml += `<td class="text-muted small">-</td>`;
      }
    }
    tbodyHtml += `</tr>`;
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
            <select class="form-select form-select-sm w-auto fw-medium" onchange="location.href='?semester=' + this.value">
              ${semesterOptions}
            </select>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge badge-soft-primary px-3 py-2 fs-13"><i class="ri-time-line me-1"></i>${semObj.name || currentSemester}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
        <h5 class="card-title m-0"><i class="ri-calendar-2-line text-primary me-2"></i>Thời khóa biểu học tập</h5>
        <span class="text-muted small">Hiển thị lịch học theo Slot và Thứ trong tuần</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-bordered table-timetable mb-0">
            <thead class="table-primary text-center">
              <tr>
                <th style="width: 120px;">Ca học</th>
                ${days.map(d => `<th><div>${d.label}</div></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tbodyHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

module.exports = { renderTimetable };
