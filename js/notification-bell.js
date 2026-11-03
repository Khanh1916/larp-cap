(function () {
    "use strict";

    const panel = document.querySelector("[data-notification-panel='true']");
    if (!panel) {
        return;
    }

    const SELECTORS = {
        dropdown: "[data-bs-toggle='dropdown']",
        list: "[data-notification-list='true']",
        badge: "[data-notification-badge='true']",
        item: "[data-notification-item='true']",
        markRead: "[data-notification-mark-read='true']",
        loadMore: "[data-notification-load-more='true']"
    };

    const panelContext = createPanelContext(panel);
    if (!panelContext) {
        return;
    }

    const dropdown = panelContext.dropdown;
    const listHost = panelContext.listHost;
    const badge = panelContext.badge;
    const loadUrl = panelContext.urls.load;
    const unreadUrl = panelContext.urls.unread;
    const markReadUrl = panelContext.urls.markRead;
    const markAllReadUrl = panelContext.urls.markAllRead;
    const pageSize = panelContext.pageSize;
    const loadFailedMessage = panelContext.messages.loadFailed;
    const defaultTitle = panelContext.messages.defaultTitle;
    const justNowLabel = panelContext.messages.justNow;
    const markReadLabel = panelContext.messages.markRead;
    const csrfToken = panelContext.csrfToken;

    let isLoaded = false;
    let isLoading = false;
    let isSubmitting = false;
    let currentPageIndex = 1;
    let unreadPrefetchStarted = false;
    let serverHasUnread = null;

    prefetchUnreadBadge();
    bindIdleUnreadPrefetch();
    bindHoverUnreadPrefetch();
    bindDropdownLoad();
    bindListActions();
    bindPanelActions();
    bindRealtimeUpdates();

    function createPanelContext(root) {
        const dropdownElement = root.querySelector(SELECTORS.dropdown);
        const listElement = root.querySelector(SELECTORS.list);
        if (!dropdownElement || !listElement) {
            return null;
        }

        const configElement = document.getElementById("web-notification-config");
        return {
            dropdown: dropdownElement,
            listHost: listElement,
            badge: root.querySelector(SELECTORS.badge),
            csrfToken: configElement ? (configElement.dataset.requestVerificationToken || "") : "",
            pageSize: readPageSize(root.dataset.pageSize),
            urls: {
                load: root.dataset.loadUrl || "",
                unread: root.dataset.unreadUrl || "",
                markRead: root.dataset.markReadUrl || "",
                markAllRead: root.dataset.markAllReadUrl || ""
            },
            messages: {
                loadFailed: root.dataset.loadFailed || "Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch th\u00f4ng b\u00e1o.",
                defaultTitle: root.dataset.defaultTitle || "Th\u00f4ng b\u00e1o",
                justNow: root.dataset.justNow || "V\u1eeba xong",
                markRead: root.dataset.markRead || "\u0110\u00e3 \u0111\u1ecdc"
            }
        };
    }

    function readPageSize(value) {
        const parsed = Number.parseInt(value || "5", 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
    }

    function bindIdleUnreadPrefetch() {
        if (!unreadUrl) {
            return;
        }

        const run = function () {
            prefetchUnreadBadge();
        };

        if (typeof globalThis.requestIdleCallback === "function") {
            globalThis.requestIdleCallback(run, { timeout: 2500 });
            return;
        }

        if (document.readyState === "complete") {
            globalThis.setTimeout(run, 0);
            return;
        }

        globalThis.addEventListener("load", function () {
            globalThis.setTimeout(run, 0);
        }, { once: true });
    }

    function bindHoverUnreadPrefetch() {
        if (!unreadUrl) {
            return;
        }

        dropdown.addEventListener("pointerenter", function () {
            prefetchUnreadBadge();
        }, { once: true });
    }

    function prefetchUnreadBadge() {
        if (unreadPrefetchStarted || !unreadUrl) {
            return;
        }

        unreadPrefetchStarted = true;
        fetch(unreadUrl, {
            method: "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        })
            .then(function (response) {
                if (!response.ok) {
                    return null;
                }
                return response.json();
            })
            .then(function (payload) {
                if (!payload) {
                    return;
                }
                const hasUnread = payload.hasUnread === true
                    || (typeof payload.unreadCount === "number" && payload.unreadCount > 0);
                serverHasUnread = hasUnread;
                showBadge(hasUnread);
            })
            .catch(function () {
                unreadPrefetchStarted = false;
            });
    }

    function bindDropdownLoad() {
        dropdown.addEventListener("shown.bs.dropdown", ensureInitialLoad);
        panel.addEventListener("shown.bs.dropdown", ensureInitialLoad);
        dropdown.addEventListener("click", function () {
            scheduleInitialLoad(0);
        });
    }

    function scheduleInitialLoad(delayMs) {
        globalThis.setTimeout(function () { ensureInitialLoad(); }, delayMs);
    }

    function bindListActions() {
        listHost.addEventListener("click", function (event) {
            handleListClick(event);
        });
    }

    function handleListClick(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const itemLink = target.closest(SELECTORS.item);
        if (itemLink && !target.closest(SELECTORS.markRead)) {
            event.preventDefault();
            event.stopPropagation();
            const href = itemLink.dataset.notificationLinkUrl || "";
            if (isInternalPath(href)) {
                const id = itemLink.dataset.notificationId;
                const isUnread = itemLink.dataset.notificationIsRead === "false" || itemLink.dataset.notificationIsRead === "False";
                if (isUnread && id) {
                    postMarkRead([id]).then(function (result) {
                        if (result.ok) {
                            applyReadState(itemLink);
                        }
                        if (typeof result.hasUnread === "boolean") {
                            serverHasUnread = result.hasUnread;
                            showBadge(serverHasUnread);
                        }
                        globalThis.location.assign(href);
                    });
                } else {
                    globalThis.location.assign(href);
                }
            }
        }

        const markReadButton = target.closest(SELECTORS.markRead);
        if (markReadButton) {
            event.preventDefault();
            event.stopPropagation();
            onMarkSingle(markReadButton);
            return;
        }

        const loadMoreButton = target.closest(SELECTORS.loadMore);
        if (!loadMoreButton) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (isLoading) {
            return;
        }

        const nextCursor = loadMoreButton.dataset.nextCursor || "";
        const nextPage = Number.parseInt(loadMoreButton.dataset.nextPage || "0", 10);
        if (!nextCursor && (!Number.isFinite(nextPage) || nextPage <= 0)) {
            return;
        }

        loadPage(nextPage || 1, true, nextCursor);
    }

    function bindPanelActions() {
        panel.addEventListener("click", function (event) {
            handlePanelClick(event);
        });
    }

    function handlePanelClick(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const markAllButton = target.closest("[data-notification-mark-all='true']");
        if (!markAllButton) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        onMarkAll(markAllButton);
    }

    function bindRealtimeUpdates() {
        document.addEventListener("fap:notification-received", function (event) {
            showBadge(true);
            if (!isLoaded) {
                return;
            }

            prependRealtimeItem(event?.detail || {});
        });
    }

    function ensureInitialLoad() {
        if (isLoaded || isLoading) {
            return;
        }

        loadPage(1, false);
    }

    function loadPage(pageIndex, append, cursor) {
        if (isLoading || !loadUrl) {
            return;
        }

        isLoading = true;
        const currentLoadMoreButton = append ? listHost.querySelector(SELECTORS.loadMore) : null;
        if (currentLoadMoreButton) {
            currentLoadMoreButton.disabled = true;
        }

        const separator = loadUrl.includes("?") ? "&" : "?";
        const requestUrl = loadUrl + separator + "pageIndex=" + encodeURIComponent(pageIndex)
            + "&pageSize=" + encodeURIComponent(pageSize)
            + (cursor ? "&cursor=" + encodeURIComponent(cursor) : "");

        requestText(requestUrl)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("LOAD_FAILED");
                }

                return response.text();
            })
            .then(function (html) {
                if (append) {
                    removeLoadMoreButton();
                    listHost.insertAdjacentHTML("beforeend", html);
                } else {
                    listHost.innerHTML = html;
                }

                isLoaded = true;
                currentPageIndex = pageIndex;
                updateBadgeByList();
            })
            .catch(function () {
                if (!append) {
                    listHost.innerHTML = "<div class='dropdown-item text-danger' data-notification-error='true'>" + escapeHtml(loadFailedMessage) + "</div>";
                } else if (currentLoadMoreButton) {
                    currentLoadMoreButton.disabled = false;
                }
            })
            .finally(function () {
                isLoading = false;
            });
    }

    function onMarkSingle(button) {
        if (isSubmitting) {
            return;
        }

        const item = button.closest(SELECTORS.item);
        if (!item) {
            return;
        }

        const id = item.dataset.notificationId;
        if (!id) {
            return;
        }

        isSubmitting = true;
        button.disabled = true;

        postMarkRead([id])
            .then(function (result) {
                if (typeof result.hasUnread === "boolean") {
                    serverHasUnread = result.hasUnread;
                    showBadge(serverHasUnread);
                }
                if (!result.ok) {
                    return;
                }

                applyReadState(item);
            })
            .finally(function () {
                isSubmitting = false;
                button.disabled = false;
            });
    }

    function onMarkAll(button) {
        if (isSubmitting) {
            return;
        }

        const unreadItems = getUnreadItems();
        if (unreadItems.length === 0) {
            updateBadgeByList();
            return;
        }

        isSubmitting = true;
        button.disabled = true;

        postMarkAll()
            .then(function (result) {
                if (typeof result.hasUnread === "boolean") {
                    serverHasUnread = result.hasUnread;
                    showBadge(serverHasUnread);
                }
                if (!result.ok) {
                    return;
                }

                for (const unreadItem of unreadItems) {
                    applyReadState(unreadItem);
                }

            })
            .finally(function () {
                isSubmitting = false;
                button.disabled = false;
            });
    }

    function postMarkRead(ids) {
        if (!markReadUrl || !ids || ids.length === 0) {
            return Promise.resolve({ ok: false, hasUnread: null });
        }

        return postNotification(markReadUrl, {
            "Content-Type": "application/json"
        }, JSON.stringify({ notificationIds: ids }));
    }

    function postMarkAll() {
        if (!markAllReadUrl) {
            return Promise.resolve({ ok: false, hasUnread: null });
        }

        return postNotification(markAllReadUrl);
    }

    function requestText(url) {
        return fetch(url, {
            method: "GET",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            },
            credentials: "same-origin"
        });
    }

    function postNotification(url, extraHeaders, body) {
        const baseHeaders = {
            "X-Requested-With": "XMLHttpRequest",
            "RequestVerificationToken": csrfToken
        };
        const headers = extraHeaders ? { ...baseHeaders, ...extraHeaders } : baseHeaders;

        return fetch(url, {
            method: "POST",
            headers: headers,
            credentials: "same-origin",
            body: body
        })
            .then(function (response) {
                return response.json().catch(function () { return {}; }).then(function (payload) {
                    return { ok: response.ok, hasUnread: payload.hasUnread };
                });
            })
            .catch(function () {
                return { ok: false, hasUnread: null };
            });
    }

    function prependRealtimeItem(detail) {
        const notificationId = normalize(detail.notificationId);
        if (notificationId && listHost.querySelector("[data-notification-id='" + cssEscape(notificationId) + "']")) {
            return;
        }
        const messageId = normalize(detail.messageId);
        if (messageId) {
            const selector = "[data-notification-fcm-id='" + cssEscape(messageId) + "']";
            if (listHost.querySelector(selector)) {
                return;
            }
        }

        const title = normalize(detail.title) || defaultTitle;
        const body = normalize(detail.body);
        const linkUrl = normalize(detail.webRedirectPath || detail.linkUrl || detail.link || detail.url || detail.attachmentUrl);
        const createdAtText = normalize(detail.createdAtText) || justNowLabel;
        const canMarkRead = !!notificationId;

        removeTransientRows();
        listHost.insertAdjacentHTML("afterbegin", renderRealtimeItem({
            notificationId: notificationId,
            messageId: messageId,
            title: title,
            body: body,
            linkUrl: linkUrl,
            createdAtText: createdAtText,
            canMarkRead: canMarkRead
        }));

        if (currentPageIndex <= 1) {
            trimItemsForFirstPage();
        }

        updateBadgeByList();
    }

    function renderRealtimeItem(item) {
        const rootAttributes = [
            "data-notification-item='true'",
            "data-notification-is-read='false'",
            item.notificationId ? "data-notification-id='" + escapeHtml(item.notificationId) + "'" : "",
            item.linkUrl ? "data-notification-link-url='" + escapeHtml(item.linkUrl) + "'" : "",
            item.messageId ? "data-notification-fcm-id='" + escapeHtml(item.messageId) + "'" : ""
        ].filter(Boolean).join(" ");

        return ""
            + "<div class='dropdown-item p-0 notify-item jidox-notification-item unread-noti' " + rootAttributes + ">"
            + "<div class='jidox-notification-item__body'>"
            + "<span class='jidox-notification-item__dot' aria-hidden='true'></span>"
            + "<div class='jidox-notification-item__content'>"
            + renderRealtimeMeta(item.title, item.createdAtText)
            + "<small class='noti-item-subtitle jidox-notification-item__message text-muted d-block text-truncate' title='" + escapeHtml(item.body) + "'>" + escapeHtml(item.body) + "</small>"
            + renderMarkReadAction(item)
            + "</div></div></div>";
    }

    function renderRealtimeMeta(title, createdAtText) {
        return ""
            + "<div class='jidox-notification-item__meta'>"
            + "<h5 class='noti-item-title jidox-notification-item__title fw-medium fs-14 text-truncate mb-1 fw-semibold' title='" + escapeHtml(title) + "'>" + escapeHtml(title) + "</h5>"
            + "<small class='jidox-notification-item__time text-muted'>" + escapeHtml(createdAtText) + "</small>"
            + "</div>";
    }

    function renderMarkReadAction(item) {
        if (!item.canMarkRead) {
            return "";
        }

        return ""
            + "<div class='jidox-notification-item__actions'>"
            + "<button type='button' class='btn btn-sm btn-outline-secondary jidox-notification-item__mark-read' data-notification-mark-read='true' data-notification-id='" + escapeHtml(item.notificationId) + "'>"
            + escapeHtml(markReadLabel)
            + "</button></div>";
    }

    function trimItemsForFirstPage() {
        const items = listHost.querySelectorAll(SELECTORS.item);
        if (!items || items.length <= pageSize) {
            return;
        }

        for (const item of Array.prototype.slice.call(items, pageSize)) {
            item.remove();
        }
    }

    function removeTransientRows() {
        const selectors = [
            "[data-notification-loading='true']",
            "[data-notification-empty='true']",
            "[data-notification-error='true']"
        ];

        for (const selector of selectors) {
            const rows = listHost.querySelectorAll(selector);
            for (const row of rows) {
                row.remove();
            }
        }
    }

    function removeLoadMoreButton() {
        const button = listHost.querySelector(SELECTORS.loadMore);
        if (button) {
            button.remove();
        }
    }

    function applyReadState(item) {
        item.dataset.notificationIsRead = "true";
        item.classList.remove("unread-noti");
        item.classList.add("read-noti");

        const title = item.querySelector(".noti-item-title");
        if (title) {
            title.classList.remove("fw-semibold");
        }

        const button = item.querySelector(SELECTORS.markRead);
        if (button) {
            button.remove();
        }
    }

    function getUnreadItems() {
        return Array.prototype.slice.call(
            listHost.querySelectorAll("[data-notification-item='true'][data-notification-is-read='False'], [data-notification-item='true'][data-notification-is-read='false']")
        );
    }

    function updateBadgeByList() {
        if (serverHasUnread !== null) {
            showBadge(serverHasUnread);
        }
    }

    function showBadge(hasUnread) {
        if (!badge) {
            return;
        }

        badge.textContent = "";
        badge.classList.toggle("d-none", !hasUnread);
    }

    function normalize(value) {
        if (typeof value !== "string") {
            return "";
        }

        return value.trim();
    }

    function isInternalPath(value) {
        return value.startsWith("/")
            && !value.startsWith("//")
            && !value.startsWith("/\\")
            && !value.includes("\\")
            && !value.includes("://")
            && !Array.from(value).some(function (ch) {
                const code = ch.charCodeAt(0);
                return code < 32 || code === 127;
            });
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#39;");
    }

    function cssEscape(value) {
        if (globalThis.CSS && typeof globalThis.CSS.escape === "function") {
            return globalThis.CSS.escape(value);
        }

        return Array.from(String(value), function (ch) {
            return ch === '"' || ch === "'" || ch === "\\" ? "\\" + ch : ch;
        }).join("");
    }
})();
