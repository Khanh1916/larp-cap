// Change password + "log out of all devices". All dynamic text is fixed (no user input is echoed).

const MESSAGES = {
  changed: ['Đổi mật khẩu thành công. Các thiết bị khác đã bị đăng xuất.', 'Password changed. You have been signed out on all other devices.'],
  logged_out_others: ['Đã đăng xuất khỏi tất cả thiết bị khác.', 'Signed out on all other devices.'],
  wrong_current: ['Mật khẩu hiện tại không đúng.', 'Current password is incorrect.'],
  too_short: ['Mật khẩu mới phải có từ 8 đến 200 ký tự.', 'The new password must be 8 to 200 characters long.'],
  mismatch: ['Mật khẩu xác nhận không khớp.', 'The confirmation does not match the new password.'],
  same_as_current: ['Mật khẩu mới phải khác mật khẩu hiện tại.', 'The new password must be different from the current one.'],
  too_many_attempts: ['Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.', 'Too many failed attempts. Please try again in 15 minutes.']
};

function message(code, isEn) {
  const m = MESSAGES[code];
  return m ? m[isEn ? 1 : 0] : null;
}

function renderChangePassword({ success = null, error = null, lang = 'vi' }) {
  const isEn = lang === 'en';
  const ok = message(success, isEn);
  const err = message(error, isEn);
  return `
    <div class="row justify-content-center">
      <div class="col-xl-6 col-lg-8">
        ${ok ? `<div class="alert alert-success"><i class="ri-checkbox-circle-line me-1"></i>${ok}</div>` : ''}
        ${err ? `<div class="alert alert-danger"><i class="ri-error-warning-line me-1"></i>${err}</div>` : ''}

        <div class="card">
          <div class="card-header bg-transparent border-bottom">
            <h5 class="card-title m-0"><i class="ri-lock-password-line text-primary me-2"></i>${isEn ? 'Change password' : 'Đổi mật khẩu'}</h5>
          </div>
          <div class="card-body">
            <form method="post" action="/Auth/ChangePassword" autocomplete="on">
              <div class="mb-3">
                <label class="form-label fw-semibold" for="current_password">${isEn ? 'Current password' : 'Mật khẩu hiện tại'}</label>
                <input type="password" id="current_password" name="current_password" class="form-control" autocomplete="current-password" required maxlength="200">
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold" for="new_password">${isEn ? 'New password' : 'Mật khẩu mới'}</label>
                <input type="password" id="new_password" name="new_password" class="form-control" autocomplete="new-password" required minlength="8" maxlength="200">
                <div class="form-text">${isEn ? 'At least 8 characters.' : 'Tối thiểu 8 ký tự.'}</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold" for="confirm_password">${isEn ? 'Confirm new password' : 'Nhập lại mật khẩu mới'}</label>
                <input type="password" id="confirm_password" name="confirm_password" class="form-control" autocomplete="new-password" required minlength="8" maxlength="200">
              </div>
              <button type="submit" class="btn btn-primary"><i class="ri-save-line me-1"></i>${isEn ? 'Change password' : 'Đổi mật khẩu'}</button>
              <div class="small text-muted mt-2">${isEn ? 'Changing your password signs you out on every other device.' : 'Sau khi đổi mật khẩu, mọi thiết bị khác sẽ bị đăng xuất.'}</div>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card-body d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <div class="fw-semibold">${isEn ? 'Sign out everywhere else' : 'Đăng xuất khỏi các thiết bị khác'}</div>
              <div class="small text-muted">${isEn ? 'Use this if you signed in on a shared or lost device.' : 'Dùng khi bạn từng đăng nhập trên máy dùng chung hoặc thiết bị bị mất.'}</div>
            </div>
            <form method="post" action="/Auth/LogoutOtherDevices" class="m-0">
              <button type="submit" class="btn btn-outline-danger btn-sm"><i class="ri-logout-box-r-line me-1"></i>${isEn ? 'Sign out other devices' : 'Đăng xuất thiết bị khác'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

module.exports = { renderChangePassword };
