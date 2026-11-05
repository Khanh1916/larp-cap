function formatDateVN(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatExamTime(timeStr) {
  if (!timeStr || timeStr === '-') return '-';
  return timeStr.replace(/:/g, 'h').replace(/\s*-\s*/g, '-').replace(/\s+/g, '');
}

function computeResultDate(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    d.setDate(d.getDate() + 5);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch(e) {
    return '-';
  }
}

function getExamFormat(ex) {
  const code = (ex.subject_code || '').toUpperCase();
  const type = (ex.exam_type || '').toUpperCase();
  if (type.includes('PRACTICAL') || type.includes('PE')) return 'Practical on EOS';
  if (code.startsWith('VOV')) return 'Thực hành thể chất';
  if (code.startsWith('SWP') || type.includes('PROJECT') || type.includes('BẢO VỆ')) return 'Oral Defense / Presentation';
  return 'Multiple_choices on EOS';
}

function getExamShortType(ex) {
  const type = (ex.exam_type || '').toUpperCase();
  if (type.includes('2NDFE') || type.includes('LẦN 2')) return '2NDFE';
  if (type.includes('FE')) return 'FE';
  if (type.includes('PE')) return 'PE';
  return ex.exam_type || 'FE';
}

function renderExamSchedule({ exams = [], semesters = [], currentSemester = 'Fall2026', lang = 'vi' }) {
  const isEn = lang === 'en';
  const semObj = semesters.find(s => s.code === currentSemester) || { name: currentSemester };

  let rowsHtml = '';
  if (exams.length === 0) {
    rowsHtml = `<tr><td colspan="9" class="text-center py-4 text-muted"><i class="ri-inbox-line fs-24 d-block mb-1"></i>${isEn ? 'No exam schedule found for' : 'Chưa có lịch thi cho học kỳ'} <strong>${semObj.name || currentSemester}</strong>.</td></tr>`;
  } else {
    exams.forEach(ex => {
      const examDateFormatted = formatDateVN(ex.exam_date);
      const examTimeFormatted = formatExamTime(ex.exam_time);
      const resultDate = computeResultDate(ex.exam_date);
      const formatStr = getExamFormat(ex);
      const shortType = getExamShortType(ex);
      const roomStr = ex.room && ex.room !== '-' ? ex.room : '-';
      const subjectFull = `${ex.subject_code} - ${ex.subject_name || ex.subject_code}`;

      rowsHtml += `<tr>
        <td class="text-center fw-medium">${examDateFormatted}</td>
        <td class="text-center">${examTimeFormatted}</td>
        <td class="text-center ${roomStr !== '-' ? 'fw-semibold text-primary' : ''}">${roomStr}</td>
        <td><strong class="text-body">${ex.subject_code}</strong> - <span>${ex.subject_name || ex.subject_code}</span></td>
        <td class="text-center"><span class="badge badge-soft-info px-2 py-1">${formatStr}</span></td>
        <td class="text-center"><span class="badge ${shortType === '2NDFE' ? 'badge-soft-warning' : 'badge-soft-primary'} px-2 py-1">${shortType}</span></td>
        <td class="text-center">${resultDate}</td>
        <td class="text-center text-muted">-</td>
        <td class="text-center text-muted">-</td>
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
            <span class="fw-semibold"><i class="ri-calendar-event-line text-primary me-1"></i>${isEn ? 'Semester:' : 'Học kỳ:'}</span>
            <select class="form-select form-select-sm w-auto fw-medium" data-semester-select>
              ${semesterOptions}
            </select>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge badge-soft-primary px-3 py-2 fs-13"><i class="ri-calendar-check-line me-1"></i>${isEn ? 'Total exams:' : 'Tổng số môn thi:'} ${exams.length}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header bg-transparent border-bottom py-3">
        <h5 class="card-title m-0 d-flex align-items-center">
          <i class="ri-time-line text-primary me-2 fs-18"></i>
          ${isEn ? `Exam Schedule - ${semObj.name || currentSemester}` : `Danh sách lịch thi - ${semObj.name || currentSemester}`}
        </h5>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table align-middle mb-0 ctl-exam-table">
            <thead>
              <tr>
                <th class="cap-minw-105 text-center">${isEn ? 'Date' : 'Ngày'}</th>
                <th class="cap-minw-125 text-center">${isEn ? 'Time' : 'Thời gian'}</th>
                <th class="cap-minw-90 text-center">${isEn ? 'Room' : 'Phòng'}</th>
                <th class="cap-minw-250">${isEn ? 'Subject' : 'Môn thi'}</th>
                <th class="cap-minw-175 text-center">${isEn ? 'Format' : 'Hình thức thi'}</th>
                <th class="cap-minw-90 text-center">${isEn ? 'Type' : 'Loại thi'}</th>
                <th class="cap-minw-135 text-center">${isEn ? 'Result Date' : 'Ngày công bố điểm'}</th>
                <th class="cap-minw-130 text-center">${isEn ? 'Attendance Note' : 'Ghi chú điểm danh'}</th>
                <th class="cap-minw-95 text-center">${isEn ? 'Note' : 'Ghi chú'}</th>
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

module.exports = { renderExamSchedule };
