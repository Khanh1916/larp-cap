function renderCurriculum({ curriculum, majorCode = 'BIT_IA_19A_AS' }) {
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
      </tr>
    `).join('');

    accordionsHtml += `
      <div class="accordion-item mb-2 border rounded">
        <h2 class="accordion-header" id="headingSem${sem}">
          <button class="accordion-button ${sem === 5 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSem${sem}">
            <div class="d-flex justify-content-between align-items-center w-100 me-3">
              <span><strong>Học kỳ ${sem}</strong> ${sem === 5 ? '<span class="badge bg-primary ms-2">Học kỳ hiện tại</span>' : ''}</span>
              <span class="badge badge-soft-info">${semCredits} tín chỉ (${list.length} môn)</span>
            </div>
          </button>
        </h2>
        <div id="collapseSem${sem}" class="accordion-collapse collapse ${sem === 5 ? 'show' : ''}">
          <div class="accordion-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-sm mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 50px;" class="text-center">STT</th>
                    <th>Mã môn</th>
                    <th>Tên môn học</th>
                    <th style="width: 100px;" class="text-center">Số tín chỉ</th>
                    <th>Môn tiên quyết</th>
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
            <h5 class="text-primary fw-bold m-0">Khung chương trình: ${majorCode}</h5>
            <small class="text-muted">Chuyên ngành: An toàn thông tin (Information Assurance) - 145 Tín chỉ</small>
          </div>
          <span class="badge bg-success fs-13">Đang áp dụng cho Khóa 19</span>
        </div>
      </div>
    </div>

    <div class="accordion" id="curriculumAccordion">
      ${accordionsHtml}
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

function renderOjtConditions({ student }) {
  return `
    <div class="card mb-3">
      <div class="card-header bg-transparent border-bottom">
        <h5 class="card-title m-0"><i class="ri-briefcase-line text-primary me-2"></i>Xét duyệt điều kiện đi thực tập doanh nghiệp (OJT)</h5>
      </div>
      <div class="card-body">
        <div class="alert alert-success d-flex align-items-center gap-2">
          <i class="ri-checkbox-circle-fill fs-22"></i>
          <div>
            <strong>Đủ điều kiện tham gia OJT!</strong> Sinh viên đã hoàn thành các điều kiện tiên quyết để đăng ký kỳ thực tập doanh nghiệp vào kỳ Spring 2027.
          </div>
        </div>

        <div class="table-responsive mt-3">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th>Tiêu chí xét OJT</th>
                <th>Yêu cầu</th>
                <th>Thực tế sinh viên</th>
                <th class="text-center">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Số tín chỉ tích lũy</td>
                <td>Tối thiểu 60 tín chỉ</td>
                <td><strong>65 tín chỉ</strong></td>
                <td class="text-center text-success fw-bold"><i class="ri-check-line me-1"></i>Đạt</td>
              </tr>
              <tr>
                <td>Trình độ Tiếng Anh</td>
                <td>Tối thiểu Level 5 hoặc B2</td>
                <td><strong>Level 5 (B2)</strong></td>
                <td class="text-center text-success fw-bold"><i class="ri-check-line me-1"></i>Đạt</td>
              </tr>
              <tr>
                <td>Chứng chỉ Giáo dục thể chất</td>
                <td>Hoàn thành VOV114, VOV124, VOV134</td>
                <td><strong>Đang hoàn thành VOV114</strong></td>
                <td class="text-center text-warning fw-bold"><i class="ri-time-line me-1"></i>Đang học</td>
              </tr>
              <tr>
                <td>Môn cơ sở ngành bắt buộc</td>
                <td>Đạt các môn PRF192, PRO192, CSD201, IAE301</td>
                <td><strong>Đã đạt</strong></td>
                <td class="text-center text-success fw-bold"><i class="ri-check-line me-1"></i>Đạt</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderThesisConditions({ student }) {
  return `
    <div class="card mb-3">
      <div class="card-header bg-transparent border-bottom">
        <h5 class="card-title m-0"><i class="ri-graduation-cap-line text-primary me-2"></i>Xét duyệt điều kiện Khóa luận tốt nghiệp (KLTN / Capstone Project)</h5>
      </div>
      <div class="card-body">
        <div class="alert alert-warning d-flex align-items-center gap-2">
          <i class="ri-time-fill fs-22"></i>
          <div>
            <strong>Chưa đủ điều kiện (Đang học kỳ 5/9):</strong> Sinh viên cần hoàn thành kỳ OJT và tích lũy tối thiểu 120 tín chỉ để đăng ký đề tài KLTN.
          </div>
        </div>

        <div class="table-responsive mt-3">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th>Tiêu chí KLTN</th>
                <th>Yêu cầu</th>
                <th>Thực tế sinh viên</th>
                <th class="text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tổng số tín chỉ hoàn thành</td>
                <td>Tối thiểu 120 tín chỉ</td>
                <td><strong>65 / 145</strong></td>
                <td class="text-center text-warning fw-bold">Chưa đạt</td>
              </tr>
              <tr>
                <td>Điểm trung bình tích lũy (GPA)</td>
                <td>Tối thiểu 6.00 / 10</td>
                <td><strong>8.42 / 10</strong></td>
                <td class="text-center text-success fw-bold">Đạt</td>
              </tr>
              <tr>
                <td>Kỳ thực tập doanh nghiệp (OJT)</td>
                <td>Đã hoàn thành và có đánh giá đạt từ DN</td>
                <td><strong>Chưa tham gia OJT</strong></td>
                <td class="text-center text-warning fw-bold">Chưa đạt</td>
              </tr>
              <tr>
                <td>Môn chuyên ngành cốt lõi</td>
                <td>Hoàn thành SWP391, CRY301, PEN301</td>
                <td><strong>Đang học SWP391</strong></td>
                <td class="text-center text-warning fw-bold">Chưa đạt</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

module.exports = { renderCurriculum, renderSubjects, renderCertificates, renderOjtConditions, renderThesisConditions };
