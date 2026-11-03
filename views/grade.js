function renderGradeReport({ grades = [], semesters = [], currentSemester = 'Fall2026' }) {
  const semObj = semesters.find(s => s.code === currentSemester) || { name: currentSemester };

  // Group by subject
  const subjectsMap = {};
  grades.forEach(g => {
    if (!subjectsMap[g.subject_code]) {
      subjectsMap[g.subject_code] = {
        name: g.subject_name || g.subject_code,
        credits: g.credits || 3,
        components: []
      };
    }
    subjectsMap[g.subject_code].components.push(g);
  });

  let cardsHtml = '';
  if (Object.keys(subjectsMap).length === 0) {
    cardsHtml = `<div class="col-12"><div class="card text-center py-5 text-muted"><i class="ri-inbox-line fs-32 d-block mb-2"></i>Chưa có dữ liệu bảng điểm cho học kỳ <strong>${semObj.name || currentSemester}</strong>.</div></div>`;
  } else {
    for (const [code, sub] of Object.entries(subjectsMap)) {
      const avgComp = sub.components.find(c => c.component_name === 'Average');
      const avgVal = avgComp ? avgComp.value : null;

      let compRows = sub.components.map(c => `
        <tr>
          <td>${c.component_name}</td>
          <td class="text-center">${(c.weight * 100).toFixed(0)}%</td>
          <td class="text-center fw-bold text-primary">${c.value !== null ? c.value.toFixed(1) : '-'}</td>
          <td class="text-center"><span class="badge ${c.value >= 5 ? 'badge-soft-success' : 'badge-soft-danger'}">${c.status || (c.value >= 5 ? 'Passed' : 'Failed')}</span></td>
        </tr>
      `).join('');

      cardsHtml += `
        <div class="col-lg-6 mb-3">
          <div class="card h-100">
            <div class="card-header border-bottom d-flex justify-content-between align-items-center bg-transparent">
              <div>
                <h5 class="m-0 text-primary fw-bold">${code} - ${sub.name}</h5>
                <small class="text-muted">${sub.credits} tín chỉ | Kỳ ${semObj.name || currentSemester}</small>
              </div>
              <div>
                <span class="fs-4 fw-bold ${avgVal >= 5 ? 'text-success' : 'text-danger'}">${avgVal !== null ? avgVal.toFixed(2) : '-'}</span>
                <small class="d-block text-muted text-end">Điểm TB</small>
              </div>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-sm table-striped mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Đầu điểm</th>
                      <th class="text-center">Trọng số</th>
                      <th class="text-center">Điểm số</th>
                      <th class="text-center">Trạng thái</th>
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
            <span class="fw-semibold"><i class="ri-calendar-event-line text-primary me-1"></i>Học kỳ:</span>
            <select class="form-select form-select-sm w-auto fw-medium" onchange="location.href='?semester=' + this.value">
              ${semesterOptions}
            </select>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge badge-soft-success px-3 py-2 fs-13"><i class="ri-award-line me-1"></i>${semObj.name || currentSemester}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      ${cardsHtml}
    </div>
  `;
}

function renderTranscript({ student, transcriptGrades = [] }) {
  // Calculate dynamic GPA from database
  let totalCredits = 0;
  let totalGradeWeight = 0;
  let passedCredits = 0;

  let rowsHtml = '';
  transcriptGrades.forEach((g, idx) => {
    const cred = g.credits || 3;
    const finalVal = g.final_grade !== null ? Number(g.final_grade) : 0;
    if (g.status === 'Passed' && finalVal >= 5.0) {
      passedCredits += cred;
    }
    totalCredits += cred;
    totalGradeWeight += (finalVal * cred);

    rowsHtml += `<tr>
      <td class="text-center">${idx + 1}</td>
      <td><span class="badge badge-soft-primary">${g.semester_name || g.semester_code}</span></td>
      <td><strong>${g.subject_code}</strong></td>
      <td>${g.subject_name || g.subject_code}</td>
      <td class="text-center">${cred}</td>
      <td class="text-center fw-bold ${finalVal >= 5 ? 'text-success' : 'text-danger'}">${finalVal.toFixed(2)}</td>
      <td class="text-center"><span class="badge ${g.status === 'Passed' ? 'badge-soft-success' : 'badge-soft-danger'}">${g.status}</span></td>
    </tr>`;
  });

  const gpa10 = totalCredits > 0 ? (totalGradeWeight / totalCredits) : 0;
  // Convert to 4.0 scale approximately
  const gpa4 = (gpa10 / 10) * 4;
  let rank = 'Khá';
  if (gpa10 >= 8.5) rank = 'Xuất sắc';
  else if (gpa10 >= 8.0) rank = 'Giỏi';
  else if (gpa10 >= 7.0) rank = 'Khá';
  else if (gpa10 >= 5.0) rank = 'Trung bình';
  else rank = 'Yếu';

  return `
    <div class="card mb-3">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-3 text-center border-end">
            <div class="fs-1 fw-bold text-primary">${gpa10.toFixed(2)}</div>
            <div class="text-muted fw-semibold">GPA Tích Lũy (Hệ 10)</div>
          </div>
          <div class="col-md-3 text-center border-end">
            <div class="fs-1 fw-bold text-success">${gpa4.toFixed(2)}</div>
            <div class="text-muted fw-semibold">GPA Tích Lũy (Hệ 4)</div>
          </div>
          <div class="col-md-3 text-center border-end">
            <div class="fs-1 fw-bold text-info">${passedCredits} / 145</div>
            <div class="text-muted fw-semibold">Tín chỉ tích lũy</div>
          </div>
          <div class="col-md-3 text-center">
            <div class="fs-1 fw-bold text-warning">${rank}</div>
            <div class="text-muted fw-semibold">Xếp loại học lực</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
        <h5 class="card-title m-0"><i class="ri-file-list-3-line text-primary me-2"></i>Bảng điểm chi tiết toàn khóa học</h5>
        <span class="badge badge-soft-info">Mã SV: ${student ? student.roll_number : ''} - ${student ? student.full_name : ''}</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th class="text-center" style="width: 50px;">STT</th>
                <th>Học kỳ</th>
                <th>Mã môn</th>
                <th>Tên môn</th>
                <th class="text-center">Số tín chỉ</th>
                <th class="text-center">Điểm tổng kết</th>
                <th class="text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" class="text-center py-4 text-muted">Chưa có môn học hoàn thành.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

module.exports = { renderGradeReport, renderTranscript };
