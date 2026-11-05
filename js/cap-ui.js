// Small UI behaviours wired with data attributes instead of inline on* handlers,
// so the Content-Security-Policy can forbid inline script.
(function () {
  // <div data-progress="42">: progress-bar width in %. Set through CSSOM because the
  // CSP forbids style="" attributes.
  function applyProgress(root) {
    (root || document).querySelectorAll('[data-progress]').forEach(function (el) {
      var pct = Math.max(0, Math.min(100, parseFloat(el.getAttribute('data-progress')) || 0));
      el.style.width = pct + '%';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { applyProgress(); });
  else applyProgress();

  // <select data-semester-select>: navigate to ?semester=<value>
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el && el.matches && el.matches('select[data-semester-select]')) {
      var url = new URL(window.location.href);
      url.searchParams.set('semester', el.value);
      window.location.href = url.pathname + url.search;
    }
  });

  // <a href="#" data-prevent-default>: placeholder links that must not jump to the top.
  // <a href="#" data-alert-message="...">: show the message (text only, never evaluated).
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-prevent-default], [data-alert-message]') : null;
    if (!el) return;
    e.preventDefault();
    var msg = el.getAttribute('data-alert-message');
    if (msg) window.alert(msg);
  });

  // Notification bell: mark one item read when it is opened, or all of them at once.
  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body || ''
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function setBellUnread(count) {
    var bell = document.querySelector('[data-cap-bell]');
    if (!bell) return;
    var badge = bell.querySelector('[data-cap-bell-badge]');
    var markAll = bell.querySelector('[data-cap-bell-markall]');
    if (badge) badge.classList.toggle('d-none', !count);
    if (markAll) markAll.classList.toggle('d-none', !count);
  }

  function showAsRead(item) {
    item.setAttribute('data-unread', '0');
    item.classList.remove('unread-noti');
    item.classList.add('read-noti');
    var icon = item.querySelector('.notify-icon');
    if (icon) { icon.classList.remove('bg-primary'); icon.classList.add('bg-secondary'); }
  }

  document.addEventListener('click', function (e) {
    var item = e.target && e.target.closest ? e.target.closest('[data-cap-notification]') : null;
    if (item && item.getAttribute('data-unread') === '1') {
      e.preventDefault();
      var href = item.getAttribute('href');
      post('/Notification/MarkRead', 'id=' + encodeURIComponent(item.getAttribute('data-cap-notification')))
        .then(function (res) {
          showAsRead(item);
          if (res && typeof res.unreadCount === 'number') setBellUnread(res.unreadCount);
          if (href && href !== '#') window.location.href = href;
        });
      return;
    }
    var markAll = e.target && e.target.closest ? e.target.closest('[data-cap-bell-markall]') : null;
    if (markAll) {
      e.preventDefault();
      post('/Notification/MarkReadAll').then(function (res) {
        if (!res) return;
        document.querySelectorAll('[data-cap-notification]').forEach(showAsRead);
        setBellUnread(0);
      });
    }
  });

  // <button data-fill-target="input[name=amount]" data-fill-value="200000">
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-fill-target]') : null;
    if (!btn) return;
    var input = document.querySelector(btn.getAttribute('data-fill-target'));
    if (input) {
      input.value = btn.getAttribute('data-fill-value');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
})();
