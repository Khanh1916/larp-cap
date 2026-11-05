// Grade report (one semester) and cumulative transcript.
// Input comes from grading.groupAttempts / grading.summarize and is HTML-escaped by the caller.

const TOTAL_PROGRAM_CREDITS = 145;

function fmt(n, digits) {
  return n === null || n === undefined ? '-' : Number(n).toFixed(digits);
}

function statusBadge(status, isEn) {
  if (status === 'Passed') return `<span class="badge badge-soft-success">${isEn ? 'Passed' : 'Đạt'}</span>`;
  if (status === 'Failed') return `<span class="badge badge-soft-danger">${isEn ? 'Failed' : 'Không đạt'}</span>`;
  return `<span class="badge badge-soft-warning">${isEn ? 'In progress' : 'Đang học'}</span>`;
}

function letterBadge(a) {
  if (!a.letter) return a.countsTowardGpa ? '' : '<span class="badge bg-secondary-subtle text-secondary">P/F</span>';
  const tone = a.points >= 3.0 ? 'success' : a.points >= 2.0 ? 'info' : a.points >= 1.0 ? 'warning' : 'danger';
  return `<span class="badge badge-soft-${tone}">${a.letter}</span>`;
}

function summaryCards(summary, isEn, { cumulative }) {
  const label = cumulative ? (isEn ? 'Cumulative' : 'Tích lũy') : (isEn ? 'Semester' : 'Học kỳ');
  const credits = cumulative
    ? `${summary.earnedCredits} / ${TOTAL_PROGRAM_CREDITS}`
    : `${summary.earnedCredits}`;
  return `
    <div class="card mb-3">
      <div class="card-body">
        <div class="row align-items-center g-3">
          <div class="col-6 col-md-3 text-center border-end">
            <div class="fs-1 fw-bold text-primary">${fmt(summary.gpa10, 2)}</div>
            <div class="text-muted fw-semibold">GPA ${label} (${isEn ? '10-point' : 'Hệ 10'})</div>
          </div>
          <div class="col-6 col-md-3 text-center border-end">
            <div class="fs-1 fw-bold text-success">${fmt(summary.gpa4, 2)}</div>
            <div class="text-muted fw-semibold">GPA ${label} (${isEn ? '4-point' : 'Hệ 4'})</div>
          </div>
          <div class="col-6 col-md-3 text-center border-end">
            <div class="fs-1 fw-bold text-info">${credits}</div>
            <div class="text-muted fw-semibold">${isEn ? 'Credits earned' : 'Tín chỉ tích lũy'}</div>
          </div>
          <div class="col-6 col-md-3 text-center">
            <div class="fs-1 fw-bold text-warning">${(isEn ? summary.rankEn : summary.rankVi) || '-'}</div>
            <div class="text-muted fw-semibold">${isEn ? 'Academic standing' : 'Xếp loại học lực'}</div>
          </div>
        </div>
        <div class="small text-muted mt-3">
          <i class="ri-information-line me-1"></i>${isEn
            ? 'Subject score = weighted sum of components, rounded to 1 decimal; pass mark 5.0. 4-point scale: A ≥ 8.5 (4.0), B+ ≥ 8.0 (3.5), B ≥ 7.0 (3.0), C+ ≥ 6.5 (2.5), C ≥ 5.5 (2.0), D+ ≥ 5.0 (1.5), D ≥ 4.0 (1.0), F (0). Physical education (P/F) and subjects in progress are not counted.'
            : 'Điểm môn = tổng điểm thành phần × trọng số, làm tròn 1 chữ số thập phân; đạt từ 5.0. Quy đổi hệ 4: A ≥ 8.5 (4.0), B+ ≥ 8.0 (3.5), B ≥ 7.0 (3.0), C+ ≥ 6.5 (2.5), C ≥ 5.5 (2.0), D+ ≥ 5.0 (1.5), D ≥ 4.0 (1.0), F (0). Môn Giáo dục thể chất (Đạt/Không đạt) và môn đang học không tính vào GPA.'}
          ${summary.inProgress ? `<span class="ms-1">${isEn ? `${summary.inProgress} subject(s) in progress.` : `${summary.inProgress} môn đang học.`}</span>` : ''}
        </div>
      </div>
    </div>`;
}

function renderGradeReport({ attempts = [], summary, semesters = [], currentSemester = 'Fall2026', lang = 'vi' }) {
  const isEn = lang === 'en';
  const semObj = semesters.find(s => s.code === currentSemester) || { name: currentSemester };

  let cardsHtml = '';
  if (attempts.length === 0) {
    cardsHtml = `<div class="col-12"><div class="card text-center py-5 text-muted"><i class="ri-inbox-line fs-32 d-block mb-2"></i>${isEn ? 'No grades for semester' : 'Chưa có dữ liệu bảng điểm cho học kỳ'} <strong>${semObj.name || currentSemester}</strong>.</div></div>`;
  } else {
    for (const a of attempts) {
      const compRows = a.components.map(c => `
        <tr>
          <td>${c.component_name}</td>
          <td class="text-center">${(Number(c.weight) * 100).toFixed(0)}%</td>
          <td class="text-center fw-bold text-primary">${c.value !== null && c.value !== undefined ? Number(c.value).toFixed(1) : '<span class="text-muted fw-normal">-</span>'}</td>
          <td class="text-center">${c.value !== null && c.value !== undefined
            ? `<span class="badge badge-soft-info">${isEn ? 'Graded' : 'Đã có điểm'}</span>`
            : `<span class="badge bg-secondary-subtle text-secondary">${isEn ? 'Pending' : 'Chưa có điểm'}</span>`}</td>
        </tr>
      `).join('');

      const scoreTone = a.status === 'Passed' ? 'text-success' : a.status === 'Failed' ? 'text-danger' : 'text-muted';
      cardsHtml += `
        <div class="col-lg-6 mb-3">
          <div class="card h-100">
            <div class="card-header border-bottom d-flex justify-content-between align-items-center bg-transparent">
              <div>
                <h5 class="m-0 text-primary fw-bold">${a.subject_code} - ${a.subject_name}</h5>
                <small class="text-muted">${a.credits} ${isEn ? 'credits' : 'tín chỉ'} | ${isEn ? 'Semester' : 'Kỳ'} ${semObj.name || currentSemester}</small>
              </div>
              <div class="text-end">
                <span class="fs-4 fw-bold ${scoreTone}">${fmt(a.score, 1)}</span> ${letterBadge(a)}
                <small class="d-block text-muted">${statusBadge(a.status, isEn)}</small>
              </div>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-sm table-striped mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>${isEn ? 'Component' : 'Đầu điểm'}</th>
                      <th class="text-center">${isEn ? 'Weight' : 'Trọng số'}</th>
                      <th class="text-center">${isEn ? 'Score' : 'Điểm số'}</th>
                      <th class="text-center">${isEn ? 'Status' : 'Trạng thái'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${compRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  const semesterOptions = (semesters && semesters.length > 0)
    ? semesters.map(s => `<option value="${s.code}" ${s.code === currentSemester ? 'selected' : ''}>${s.name}</option>`).join('')
    : `<option value="${currentSemester}" selected>${semObj.name || currentSemester}</option>`;

  return `
    <div class="card mb-3">
      <div class="card-body p-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div class="d-flex align-items-center gap-2">
            <span class="fw-semibold"><i class="ri-calendar-event-line text-primary me-1"></i>${isEn ? 'Semester' : 'Học kỳ'}:</span>
            <select class="form-select form-select-sm w-auto fw-medium" data-semester-select>
              ${semesterOptions}
            </select>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge badge-soft-success px-3 py-2 fs-13"><i class="ri-award-line me-1"></i>${semObj.name || currentSemester}</span>
          </div>
        </div>
      </div>
    </div>

    ${attempts.length ? summaryCards(summary, isEn, { cumulative: false }) : ''}

    <div class="row">
      ${cardsHtml}
    </div>
  `;
}

function renderTranscript({ student, attempts = [], summary, lang = 'vi' }) {
  const isEn = lang === 'en';
  const rowsHtml = attempts.map((a, idx) => `<tr>
      <td class="text-center">${idx + 1}</td>
      <td><span class="badge badge-soft-primary">${a.semester_name}</span></td>
      <td><strong>${a.subject_code}</strong></td>
      <td>${a.subject_name}</td>
      <td class="text-center">${a.credits}</td>
      <td class="text-center fw-bold ${a.status === 'Passed' ? 'text-success' : a.status === 'Failed' ? 'text-danger' : 'text-muted'}">${fmt(a.score, 1)}</td>
      <td class="text-center">${letterBadge(a)}</td>
      <td class="text-center">${a.points === null ? '-' : fmt(a.points, 1)}</td>
      <td class="text-center">${statusBadge(a.status, isEn)}</td>
    </tr>`).join('');

  return `
    ${summaryCards(summary, isEn, { cumulative: true })}

    <div class="card">
      <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
        <h5 class="card-title m-0"><i class="ri-file-list-3-line text-primary me-2"></i>${isEn ? 'Full course transcript' : 'Bảng điểm chi tiết toàn khóa học'}</h5>
        <span class="badge badge-soft-info">${isEn ? 'Student ID' : 'Mã SV'}: ${student ? student.roll_number : ''} - ${student ? student.full_name : ''}</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th class="text-center" style="width: 50px;">${isEn ? 'No.' : 'STT'}</th>
                <th>${isEn ? 'Semester' : 'Học kỳ'}</th>
                <th>${isEn ? 'Code' : 'Mã môn'}</th>
                <th>${isEn ? 'Subject' : 'Tên môn'}</th>
                <th class="text-center">${isEn ? 'Credits' : 'Số tín chỉ'}</th>
                <th class="text-center">${isEn ? 'Score (10)' : 'Điểm hệ 10'}</th>
                <th class="text-center">${isEn ? 'Letter' : 'Điểm chữ'}</th>
                <th class="text-center">${isEn ? 'Score (4)' : 'Điểm hệ 4'}</th>
                <th class="text-center">${isEn ? 'Status' : 'Trạng thái'}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="9" class="text-center py-4 text-muted">${isEn ? 'No completed subjects yet.' : 'Chưa có môn học hoàn thành.'}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

module.exports = { renderGradeReport, renderTranscript };
