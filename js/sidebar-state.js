(function () {
    'use strict';

    const sidebar = document.querySelector('.leftside-menu');
    if (!sidebar) {
        return;
    }

    const collapseStateKey = 'fap:outside:sidebar-collapse-state:v1';
    const sidenavSizeKey = 'fap:outside:sidenav-size:v1';
    const storage = globalThis.localStorage;

    function readJson(key) {
        try {
            return JSON.parse(storage.getItem(key) || '{}');
        } catch {
            return {};
        }
    }

    function writeJson(key, value) {
        try {
            storage.setItem(key, JSON.stringify(value));
        } catch {
            // localStorage can be unavailable in strict browser modes.
        }
    }

    function getToggle(collapse) {
        return sidebar.querySelector('[data-bs-toggle="collapse"][href="#' + collapse.id + '"]');
    }

    function hasActiveChild(collapse) {
        return Boolean(collapse.querySelector('.side-nav-link.active, .side-nav-item.active'));
    }

    function setExpanded(collapse, expanded) {
        collapse.classList.toggle('show', expanded);
        const toggle = getToggle(collapse);
        if (toggle) {
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }
    }

    function restoreCollapseState() {
        const states = readJson(collapseStateKey);
        sidebar.querySelectorAll('.collapse[id]').forEach(function (collapse) {
            if (hasActiveChild(collapse)) {
                setExpanded(collapse, true);
                return;
            }

            if (Object.hasOwn(states, collapse.id)) {
                setExpanded(collapse, states[collapse.id] === true);
            }
        });
    }

    function saveCollapseState(collapse, expanded) {
        if (!collapse.id) {
            return;
        }

        const states = readJson(collapseStateKey);
        states[collapse.id] = expanded;
        writeJson(collapseStateKey, states);
    }

    function restoreSidenavSize() {
        try {
            const savedSize = storage.getItem(sidenavSizeKey);
            if (savedSize) {
                document.documentElement.dataset.sidenavSize = savedSize;
            }
        } catch {
            // localStorage can be unavailable in strict browser modes.
        }
    }

    function saveSidenavSize() {
        try {
            const size = document.documentElement.dataset.sidenavSize;
            if (size) {
                storage.setItem(sidenavSizeKey, size);
            }
        } catch {
            // localStorage can be unavailable in strict browser modes.
        }
    }

    restoreSidenavSize();
    restoreCollapseState();

    sidebar.addEventListener('shown.bs.collapse', function (event) {
        saveCollapseState(event.target, true);
    });

    sidebar.addEventListener('hidden.bs.collapse', function (event) {
        saveCollapseState(event.target, false);
    });

    document.querySelectorAll('.button-toggle-menu, .button-sm-hover, .button-close-fullsidebar').forEach(function (button) {
        button.addEventListener('click', function () {
            globalThis.setTimeout(saveSidenavSize, 100);
        });
    });

    if (globalThis.MutationObserver) {
        new MutationObserver(saveSidenavSize).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-sidenav-size']
        });
    }
})();
