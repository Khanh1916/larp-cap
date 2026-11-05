const CURRICULUM_STATUS = {
  Passed: ['badge-soft-success', 'Đạt', 'Passed'],
  InProgress: ['badge-soft-warning', 'Đang học', 'In progress'],
  Failed: ['badge-soft-danger', 'Chưa đạt', 'Failed']
};

// statuses: { subject_code: 'Passed' | 'InProgress' | 'Failed' } from the student's record.
// currentSemesterNo: curriculum semester the student is studying now (or null).
function renderCurriculum({ curriculum, majorCode = '', majorName = '', cohort = '', statuses = {}, currentSemesterNo = null, lang = 'vi' }) {
  const isEn = lang === 'en';
  // Group by semester_no
  const bySem = {};
  curriculum.forEach(c => {
    if (!bySem[c.semester_no]) bySem[c.semester_no] = [];
    bySem[c.semester_no].push(c);
  });

  let accordionsHtml = '';
  for (let sem = 1; sem <= 9; sem++) {
    const list = bySem[sem] || [];
    const semCredits = list.reduce((sum, item) => sum + item.credits, 0);

    let rowsHtml = list.map((item, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong class="text-primary">${item.subject_code}</strong></td>
        <td>${item.subject_name}</td>
        <td class="text-center fw-semibold">${item.credits}</td>
        <td><small class="text-muted">${item.prerequisites}</small></td>
        <td class="text-center">${CURRICULUM_STATUS[statuses[item.subject_code]]
          ? `<span class="badge ${CURRICULUM_STATUS[statuses[item.subject_code]][0]}">${CURRICULUM_STATUS[statuses[item.subject_code]][isEn ? 2 : 1]}</span>`
          : '<span class="text-muted small">-</span>'}</td>
      </tr>
    `).join('');

    if (list.length === 0) continue;

    accordionsHtml += `
      <div class="accordion-item mb-2 border rounded">
        <h2 class="accordion-header" id="headingSem${sem}">
          <button class="accordion-button ${sem === currentSemesterNo ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSem${sem}">
            <div class="d-flex justify-content-between align-items-center w-100 me-3">
              <span><strong>${isEn ? 'Semester' : 'Học kỳ'} ${sem}</strong> ${sem === currentSemesterNo ? `<span class="badge bg-primary ms-2">${isEn ? 'Current semester' : 'Học kỳ hiện tại'}</span>` : ''}</span>
              <span class="badge badge-soft-info">${semCredits} ${isEn ? 'credits' : 'tín chỉ'} (${list.length} ${isEn ? 'subjects' : 'môn'})</span>
            </div>
          </button>
        </h2>
        <div id="collapseSem${sem}" class="accordion-collapse collapse ${sem === currentSemesterNo ? 'show' : ''}">
          <div class="accordion-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-sm mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 50px;" class="text-center">${isEn ? 'No.' : 'STT'}</th>
                    <th>${isEn ? 'Code' : 'Mã môn'}</th>
                    <th>${isEn ? 'Subject' : 'Tên môn học'}</th>
                    <th style="width: 100px;" class="text-center">${isEn ? 'Credits' : 'Số tín chỉ'}</th>
                    <th>${isEn ? 'Prerequisites' : 'Môn tiên quyết'}</th>
                    <th style="width: 110px;" class="text-center">${isEn ? 'Status' : 'Trạng thái'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 class="text-primary fw-bold m-0">${isEn ? 'Curriculum' : 'Khung chương trình'}: ${majorCode}</h5>
            <small class="text-muted">${isEn ? 'Major' : 'Chuyên ngành'}: ${majorName} - ${curriculum.reduce((sum, c) => sum + c.credits, 0)} ${isEn ? 'credits' : 'tín chỉ'}</small>
          </div>
          <span class="badge bg-success fs-13">${isEn ? `Applies to cohort K${cohort}` : `Đang áp dụng cho Khóa ${cohort}`}</span>
        </div>
      </div>
    </div>

    <div class="accordion" id="curriculumAccordion">
      ${accordionsHtml || `<div class="card text-center py-5 text-muted">${isEn ? 'No curriculum for this programme yet.' : 'Chưa có khung chương trình cho mã ngành này.'}</div>`}
    </div>
  `;
}

function renderSubjects({ subjects }) {
  let rows = subjects.map((s, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong class="text-primary">${s.code}</strong></td>
      <td>${s.name}</td>
      <td class="text-center fw-bold">${s.credits}</td>
      <td><span class="badge badge-soft-info">${s.department}</span></td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header border-bottom bg-transparent d-flex justify-content-between align-items-center">
        <h5 class="card-title m-0"><i class="ri-book-open-line text-primary me-2"></i>Danh mục môn học trường Đại học CTL</h5>
        <span class="badge bg-primary">${subjects.length} Môn học</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 60px;" class="text-center">STT</th>
                <th>Mã môn học</th>
                <th>Tên môn học</th>
                <th style="width: 120px;" class="text-center">Số tín chỉ</th>
                <th>Bộ môn phụ trách</th>
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

function renderCertificates({ certificates }) {
  let certCards = certificates.map(c => `
    <div class="col-md-6 mb-3">
      <div class="card h-100 border-start border-4 border-primary">
        <div class="card-body">
          <div class="d-flex align-items-start gap-3">
            <div class="avatar-sm bg-soft-success text-success rounded p-2 text-center fs-20">
              <i class="ri-award-fill"></i>
            </div>
            <div class="flex-grow-1">
              <span class="badge badge-soft-primary float-end">${c.cert_type}</span>
              <h5 class="my-1 text-primary fw-bold">${c.name}</h5>
              <p class="text-muted small mb-1">Cơ quan cấp: <strong>${c.issuer}</strong></p>
              <div class="d-flex justify-content-between align-items-center mt-2 small text-muted">
                <span>Số hiệu: <code>${c.cert_no}</code></span>
                <span>Ngày cấp: ${c.issue_date}</span>
                <span class="badge bg-success">Xếp loại: ${c.grade}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title m-0"><i class="ri-shield-star-line text-primary me-2"></i>Chứng chỉ đã tích lũy của sinh viên</h5>
        <p class="text-muted small m-0 mt-1">Các chứng chỉ bắt buộc để đủ điều kiện xét tốt nghiệp: GDQP, Vovinam, Tiếng Anh đầu ra.</p>
      </div>
    </div>
    <div class="row">
      ${certCards}
    </div>
  `;
}

// OJT / thesis eligibility. Input comes from requirements.js and is HTML-escaped by the caller.
function criteriaTable(criteria, isEn, headers) {
  const rows = criteria.map(c => {
    const result = c.met
      ? `<span class="text-success fw-bold"><i class="ri-check-line me-1"></i>${isEn ? 'Met' : 'Đạt'}</span>`
      : c.pending
        ? `<span class="text-warning fw-bold"><i class="ri-time-line me-1"></i>${isEn ? 'In progress' : 'Đang học'}</span>`
        : `<span class="text-danger fw-bold"><i class="ri-close-line me-1"></i>${isEn ? 'Not met' : 'Chưa đạt'}</span>`;
    return `
              <tr>
                <td>${isEn ? c.label.en : c.label.vi}</td>
                <td>${isEn ? c.required.en : c.required.vi}</td>
                <td><strong>${isEn ? c.actual.en : c.actual.vi}</strong></td>
                <td class="text-center">${result}</td>
              </tr>`;
  }).join('');
  return `
        <div class="table-responsive mt-3">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th>${headers[0]}</th>
                <th>${isEn ? 'Requirement' : 'Yêu cầu'}</th>
                <th>${isEn ? 'Student record' : 'Thực tế sinh viên'}</th>
                <th class="text-center">${isEn ? 'Result' : 'Kết quả'}</th>
              </tr>
            </thead>
            <tbody>${rows}
            </tbody>
          </table>
        </div>`;
}

function banner(tone, icon, title, text) {
  return `
        <div class="alert alert-${tone} d-flex align-items-center gap-2">
          <i class="${icon} fs-22"></i>
          <div><strong>${title}</strong> ${text}</div>
        </div>`;
}

function renderOjtConditions({ ojt, lang = 'vi' }) {
  const isEn = lang === 'en';
  const banners = {
    completed: ['success', 'ri-checkbox-circle-fill', isEn ? 'OJT completed.' : 'Đã hoàn thành OJT.', isEn ? 'The internship has been passed.' : 'Sinh viên đã hoàn thành kỳ thực tập doanh nghiệp.'],
    in_progress: ['info', 'ri-briefcase-4-fill', isEn ? 'Currently on OJT.' : 'Đang thực tập doanh nghiệp.', isEn ? `Internship in progress (${ojt.ojtSemester}).` : `Sinh viên đang trong kỳ OJT (${ojt.ojtSemester}).`],
    eligible: ['success', 'ri-checkbox-circle-fill', isEn ? 'Eligible for OJT!' : 'Đủ điều kiện tham gia OJT!', isEn ? 'All prerequisites are met.' : 'Sinh viên đã hoàn thành các điều kiện tiên quyết để đăng ký kỳ thực tập.'],
    pending: ['warning', 'ri-time-fill', isEn ? 'Almost eligible.' : 'Sắp đủ điều kiện.', isEn ? 'The remaining requirements are subjects currently in progress.' : 'Các điều kiện còn thiếu đều là môn đang học trong kỳ này.'],
    not_eligible: ['danger', 'ri-error-warning-fill', isEn ? 'Not yet eligible for OJT.' : 'Chưa đủ điều kiện tham gia OJT.', isEn ? 'See the requirements below.' : 'Xem các tiêu chí chưa đạt bên dưới.']
  };
  const [tone, icon, title, text] = banners[ojt.state];
  const showCriteria = ojt.state !== 'completed' && ojt.state !== 'in_progress';
  return `
    <div class="card mb-3">
      <div class="card-header bg-transparent border-bottom">
        <h5 class="card-title m-0"><i class="ri-briefcase-line text-primary me-2"></i>${isEn ? 'On-the-job training (OJT) eligibility' : 'Xét duyệt điều kiện đi thực tập doanh nghiệp (OJT)'}</h5>
      </div>
      <div class="card-body">
        ${banner(tone, icon, title, text)}
        ${showCriteria ? criteriaTable(ojt.criteria, isEn, [isEn ? 'OJT criterion' : 'Tiêu chí xét OJT']) : ''}
      </div>
    </div>
  `;
}

function renderThesisConditions({ thesis, lang = 'vi' }) {
  const isEn = lang === 'en';
  const eligible = thesis.state === 'eligible';
  return `
    <div class="card mb-3">
      <div class="card-header bg-transparent border-bottom">
        <h5 class="card-title m-0"><i class="ri-graduation-cap-line text-primary me-2"></i>${isEn ? 'Graduation thesis (Capstone) eligibility' : 'Xét duyệt điều kiện Khóa luận tốt nghiệp (KLTN / Capstone Project)'}</h5>
      </div>
      <div class="card-body">
        ${eligible
          ? banner('success', 'ri-checkbox-circle-fill', isEn ? 'Eligible for the thesis!' : 'Đủ điều kiện làm KLTN!', isEn ? 'All requirements are met.' : 'Sinh viên đã đáp ứng tất cả tiêu chí.')
          : banner('warning', 'ri-time-fill', isEn ? 'Not yet eligible.' : 'Chưa đủ điều kiện.', isEn ? 'Complete the requirements below to register a thesis topic.' : 'Sinh viên cần hoàn thành các tiêu chí dưới đây để đăng ký đề tài KLTN.')}
        ${criteriaTable(thesis.criteria, isEn, [isEn ? 'Thesis criterion' : 'Tiêu chí KLTN'])}
      </div>
    </div>
  `;
}

module.exports = { renderCurriculum, renderSubjects, renderCertificates, renderOjtConditions, renderThesisConditions };
