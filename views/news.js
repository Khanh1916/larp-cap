function renderNewsList({ newsList, activeCat = '' }) {
  const cats = [
    { id: '', name: 'Tất cả' },
    { id: '01a0d1a7-5d2c-7c89-91e7-3bf096c4e782', name: 'Thông tin Khảo Thí' },
    { id: '01a0eb6b-e6cb-74c4-828a-706f371cbbc2', name: 'Thông tin Đào tạo' },
    { id: '01a07a13-8e0b-7002-a6a9-7ce20a40ab08', name: 'Thông báo tài chính' },
    { id: '01a07a13-8e0b-7000-ad8b-5ba620c6e91e', name: 'Thông tin chung' }
  ];

  let itemsHtml = '';
  newsList.forEach(n => {
    itemsHtml += `
      <div class="col-12 mb-3">
        <div class="card h-100 hover-shadow transition-all">
          <div class="card-body">
            <div class="d-flex align-items-start gap-3">
              <div class="avatar-sm bg-soft-primary text-primary rounded p-2 text-center fs-20">
                <i class="ri-article-line"></i>
              </div>
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <span class="badge badge-soft-info">${n.category_name}</span>
                  <small class="text-muted"><i class="ri-calendar-line me-1"></i>${n.published_at}</small>
                </div>
                <h5 class="my-1">
                  <a href="/News/Detail/${n.id}" class="text-body">${n.title}</a>
                </h5>
                <p class="text-muted mb-2">${n.content.slice(0, 180)}...</p>
                <a href="/News/Detail/${n.id}" class="btn btn-sm btn-link p-0 text-primary">Xem chi tiết <i class="ri-arrow-right-line ms-1"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  return `
    <div class="card mb-3">
      <div class="card-body p-3">
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <span class="fw-semibold me-2">Phân loại:</span>
          ${cats.map(c => `<a href="/News${c.id ? '?CAPNewsTypeId=' + c.id : ''}" class="badge ${activeCat === c.id ? 'bg-primary' : 'bg-light text-dark border'} px-3 py-2 fs-13">${c.name}</a>`).join('')}
        </div>
      </div>
    </div>

    <div class="row">
      ${itemsHtml}
    </div>
  `;
}

function renderNewsDetail({ item }) {
  if (!item) {
    return `<div class="alert alert-danger">Không tìm thấy tin tức yêu cầu.</div>`;
  }

  return `
    <div class="card">
      <div class="card-body p-4">
        <div class="mb-3">
          <a href="/News" class="btn btn-sm btn-outline-secondary mb-3"><i class="ri-arrow-left-line me-1"></i>Quay lại danh sách</a>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge badge-soft-primary fs-13">${item.category_name}</span>
            <span class="text-muted"><i class="ri-calendar-line me-1"></i>${item.published_at}</span>
            <span class="text-muted ms-3"><i class="ri-user-line me-1"></i>${item.author || 'Phòng Khảo Thí'}</span>
          </div>
          <h3 class="fw-bold text-primary mb-3">${item.title}</h3>
        </div>
        <hr>
        <div class="news-content fs-15 lh-lg py-3">
          <p>${item.content}</p>
          <div class="alert alert-info mt-4">
            <i class="ri-information-line me-1"></i>Mọi thắc mắc sinh viên vui lòng liên hệ trực tiếp phòng Dịch Vụ Sinh Viên hoặc gửi đơn khiếu nại qua mục <a href="/Application">Gửi đơn</a> trên hệ thống CAP.
          </div>
        </div>
      </div>
    </div>
  `;
}

module.exports = { renderNewsList, renderNewsDetail };
