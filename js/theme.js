// Light / dark theme. Loaded synchronously in <head> so the saved theme applies before first paint.
(function () {
  function read() {
    try { return localStorage.getItem('ctl_theme') || 'dark'; } catch (e) { return 'dark'; }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    root.setAttribute('data-bs-theme', theme);
    root.setAttribute('data-topbar-color', theme);
    root.setAttribute('data-menu-color', theme);
    try {
      localStorage.setItem('ctl_theme', theme);
      sessionStorage.setItem('__CONFIG__', JSON.stringify({
        theme: theme,
        nav: 'vertical',
        layout: { mode: 'fluid', position: 'fixed' },
        topbar: { color: theme },
        menu: { color: theme },
        sidenav: { size: 'default', user: true }
      }));
    } catch (e) { /* storage unavailable (private mode) */ }
    if (window.config) {
      window.config.theme = theme;
      if (window.config.topbar) window.config.topbar.color = theme;
      if (window.config.menu) window.config.menu.color = theme;
    }
    var icon = document.querySelector('#light-dark-mode i');
    if (icon) icon.className = theme === 'dark' ? 'ri-sun-line fs-22' : 'ri-moon-line fs-22';
  }

  applyTheme(read());

  window.addEventListener('DOMContentLoaded', function () {
    applyTheme(read());
    var btn = document.getElementById('light-dark-mode');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var current = document.documentElement.getAttribute('data-bs-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      }, true);
    }
  });
})();
