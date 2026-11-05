// Small UI behaviours wired with data attributes instead of inline on* handlers,
// so the Content-Security-Policy can forbid inline script.
(function () {
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
