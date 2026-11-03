(function () {
    "use strict";

    const configElement = document.getElementById("web-notification-config");
    if (!configElement) {
        return;
    }

    const isAuthenticated = toBool(configElement.dataset.isAuthenticated);
    if (!isAuthenticated) {
        return;
    }

    const STORAGE_KEYS = {
        fcmToken: "fap.web.notification.fcmToken",
        lastSyncedToken: "fap.web.notification.lastSyncedToken",
        lastSyncedBrowser: "fap.web.notification.lastSyncedBrowser",
        legacyDeviceId: "fap.web.notification.deviceId",
        asked: "fap.web.notification.asked",
        receivedMessageIds: "fap.web.notification.receivedMessageIds",
        tokenUnavailableWarn: "fap.web.notification.tokenUnavailable.warned.session"
    };
    const LIMITS = {
        maxReceivedMessageIds: 100
    };
    const runtimeState = {
        currentUserId: (configElement.dataset.userId || "").trim().toLowerCase(),
        receivedMessageIdsCache: null
    };
    runtimeState.sessionSyncKey = "fap.web.notification.synced.session." + (runtimeState.currentUserId || "anonymous");
    const payloadReader = globalThis.fapNotificationPayload;

    const promptAfterLogin = toBool(configElement.dataset.promptAfterLogin);
    const debugEnabled = toBool(configElement.dataset.debugLogEnabled);
    const csrfToken = configElement.dataset.requestVerificationToken || "";
    const foregroundListenerKey = "__fapForegroundMessageListenerBound";
    const browserKey = getOrCreateBrowserKey();
    const loginRegistrationId = (configElement.dataset.loginRegistrationId || "").trim();

    bindServiceWorkerChannel();
    exposeApi();
    startNotificationSync(readStartupState());

    function readStartupState() {
        const hasAsked = toBool(localStorage.getItem(STORAGE_KEYS.asked));
        const permission = readPermission();
        return {
            hasStoredToken: !!getStoredFcmToken(),
            hasSyncedInSession: toBool(sessionStorage.getItem(runtimeState.sessionSyncKey)),
            needAsk: permission === "default" && promptAfterLogin && !hasAsked
        };
    }

    function startNotificationSync(state) {
        if (!state.needAsk && state.hasSyncedInSession && state.hasStoredToken) {
            updatePermissionBadge(readPermission());
            return;
        }

        if (state.needAsk) {
            askPermissionAndSync();
            return;
        }

        syncCurrentPermission();
    }

    function askPermissionAndSync() {
        const permission = readPermission();
        if (permission !== "default") {
            markPermissionAsked();
            syncCurrentPermission(permission);
            return;
        }

        const allowByConfirm = confirmNotificationPrompt();

        if (!allowByConfirm) {
            markPermissionAsked();
            syncCurrentPermission(readPermission());
            return;
        }

        if (!("Notification" in globalThis) || typeof Notification.requestPermission !== "function") {
            markPermissionAsked();
            syncCurrentPermission("unsupported");
            return;
        }

        requestBrowserPermission()
            .then(function (permission) {
                markPermissionAsked();
                syncCurrentPermission(permission);
            })
            .catch(function () {
                markPermissionAsked();
                syncCurrentPermission(readPermission());
            });
    }

    function confirmNotificationPrompt() {
        return globalThis.confirm(
            (configElement.dataset.askPermissionTitle || "Th\u00f4ng b\u00e1o") + "\n\n" + (configElement.dataset.askPermission || ""));
    }

    function markPermissionAsked() {
        localStorage.setItem(STORAGE_KEYS.asked, "true");
    }

    function requestBrowserPermission() {
        return Notification.requestPermission();
    }

    function syncCurrentPermission(permissionInput) {
        const permission = permissionInput || readPermission();
        debugLog("sync.permission", { permission: permission });

        if (permission !== "granted") {
            clearStoredFcmTokenWhenDenied(permission);
            syncWithStoredToken(false, permission);
            return;
        }

        if (!toBool(configElement.dataset.firebaseWebEnabled)) {
            syncWithStoredToken(true, permission);
            return;
        }

        tryGetFcmToken()
            .then(function (fcmToken) {
                if (!fcmToken) {
                    notifyTokenUnavailable();
                    syncWithStoredToken(true, permission);
                    return;
                }

                storeFcmToken(fcmToken);
                syncDevice(true, permission, fcmToken);
            })
            .catch(function () {
                notifyTokenUnavailable();
                syncWithStoredToken(true, permission);
            });
    }

    function syncWithStoredToken(isEnabled, permission) {
        const token = getStoredFcmToken();
        if (!token) {
            updatePermissionBadge(permission || readPermission());
            return;
        }

        syncDevice(isEnabled, permission, token);
    }

    async function tryGetFcmToken() {
        if (!canUseFirebaseMessaging()) {
            return null;
        }

        if (!globalThis.fapFirebaseLoader || typeof globalThis.fapFirebaseLoader.ensureLoaded !== "function") {
            debugLog("token.resolve.null", {
                reason: "lazy_firebase_loader_missing"
            });
            return null;
        }

        try {
            const firebaseLoaded = await globalThis.fapFirebaseLoader.ensureLoaded();
            if (!firebaseLoaded) {
                debugLog("token.resolve.null", {
                    reason: "firebase_scripts_load_failed"
                });
                return null;
            }

            const firebaseContext = createFirebaseMessagingContext();
            if (!firebaseContext) {
                return null;
            }

            const registration = await navigator.serviceWorker.register(firebaseContext.serviceWorkerUrl);
            debugLog("service-worker.registered", {
                scope: registration?.scope || ""
            });

            const token = await firebaseContext.messaging.getToken({
                vapidKey: firebaseContext.config.vapidKey,
                serviceWorkerRegistration: registration
            });

            return normalizeToken(token);
        } catch (error) {
            debugLog("token.resolve.null", {
                reason: "service_worker_or_get_token_failed",
                error: error?.message || String(error || "")
            });
            return null;
        }
    }

    function createFirebaseMessagingContext() {
        if (!canUseFirebaseMessaging()) {
            return null;
        }

        const config = getFirebaseConfig();
        const serviceWorkerUrl = isFirebaseConfigReady(config) ? buildServiceWorkerUrl(config) : null;
        if (!serviceWorkerUrl) {
            return null;
        }

        const app = resolveFirebaseApp(config);
        if (!app) {
            return null;
        }

        const messaging = resolveFirebaseMessaging(app);
        if (!messaging) {
            return null;
        }

        setupForegroundMessageListener(messaging);
        return {
            config: config,
            serviceWorkerUrl: serviceWorkerUrl,
            messaging: messaging
        };
    }

    function canUseFirebaseMessaging() {
        if (!toBool(configElement.dataset.firebaseWebEnabled)
            || !("serviceWorker" in navigator)) {
            return false;
        }

        // Nếu có lazy loader, chỉ cần kiểm tra loader sẵn sàng (firebase sẽ load khi cần)
        if (globalThis.fapFirebaseLoader
            && typeof globalThis.fapFirebaseLoader.ensureLoaded === "function") {
            return true;
        }

        // Fallback: firebase đã load sẵn (trường hợp cũ)
        return !!globalThis.firebase
            && typeof globalThis.firebase.initializeApp === "function"
            && typeof globalThis.firebase.messaging === "function";
    }

    function resolveFirebaseApp(firebaseConfig) {
        try {
            return globalThis.firebase.apps?.length > 0
                ? globalThis.firebase.app()
                : globalThis.firebase.initializeApp(firebaseConfig);
        } catch (error) {
            debugLog("firebase.init.failed", { error: error?.message || String(error || "") });
            return null;
        }
    }

    function resolveFirebaseMessaging(app) {
        try {
            return globalThis.firebase.messaging(app);
        } catch (error) {
            debugLog("firebase.init.failed", { error: error?.message || String(error || "") });
            return null;
        }
    }

    function normalizeToken(token) {
        if (!token || token.trim().length === 0) {
            return null;
        }

        return token.trim();
    }

    function getFirebaseConfig() {
        return {
            apiKey: configElement.dataset.firebaseApiKey || "",
            authDomain: configElement.dataset.firebaseAuthDomain || "",
            projectId: configElement.dataset.firebaseProjectId || "",
            storageBucket: configElement.dataset.firebaseStorageBucket || "",
            messagingSenderId: configElement.dataset.firebaseMessagingSenderId || "",
            appId: configElement.dataset.firebaseAppId || "",
            measurementId: configElement.dataset.firebaseMeasurementId || "",
            vapidKey: configElement.dataset.firebaseVapidKey || "",
            serviceWorkerPath: configElement.dataset.firebaseServiceWorkerPath || "/firebase-messaging-sw.js"
        };
    }

    function isFirebaseConfigReady(firebaseConfig) {
        return !!(
            firebaseConfig?.apiKey &&
            firebaseConfig.projectId &&
            firebaseConfig.messagingSenderId &&
            firebaseConfig.appId &&
            firebaseConfig.vapidKey
        );
    }

    function buildServiceWorkerUrl(firebaseConfig) {
        if (!firebaseConfig?.serviceWorkerPath) {
            return null;
        }

        const search = new URLSearchParams();
        search.set("apiKey", firebaseConfig.apiKey || "");
        search.set("authDomain", firebaseConfig.authDomain || "");
        search.set("projectId", firebaseConfig.projectId || "");
        search.set("storageBucket", firebaseConfig.storageBucket || "");
        search.set("messagingSenderId", firebaseConfig.messagingSenderId || "");
        search.set("appId", firebaseConfig.appId || "");
        search.set("measurementId", firebaseConfig.measurementId || "");
        search.set("debug", debugEnabled ? "1" : "0");

        return firebaseConfig.serviceWorkerPath + "?" + search.toString();
    }

    function bindServiceWorkerChannel() {
        if (!("serviceWorker" in navigator)) {
            return;
        }

        navigator.serviceWorker.addEventListener("message", function (event) {
            if (event?.data?.source !== "firebase-messaging-sw") {
                return;
            }

            const payload = event.data.message || {};
            const messageId = payload.messageId?.toString().trim() || "";
            if (messageId) {
                rememberReceivedMessageId(messageId);
            }

            debugLog("notification.sw.message", {
                type: payload.type || "",
                messageId: messageId || "",
                notificationId: payload?.notificationId || "",
                title: payload.title || ""
            });

            if (payload.type === "notification.received") {
                notifyBell(payload);
            }
        });
    }

    function exposeApi() {
        if (!globalThis.fapWebNotification) {
            globalThis.fapWebNotification = {};
        }

        globalThis.fapWebNotification.forceSync = function () {
            syncCurrentPermission(readPermission());
        };

        globalThis.fapWebNotification.requestPermissionAndSync = function () {
            if (toBool(localStorage.getItem(STORAGE_KEYS.asked))) {
                syncCurrentPermission(readPermission());
                return;
            }

            askPermissionAndSync();
        };
    }

    function setupForegroundMessageListener(messaging) {
        if (!messaging || typeof messaging.onMessage !== "function") {
            return;
        }

        if (globalThis[foregroundListenerKey] === true) {
            return;
        }

        messaging.onMessage(function (payload) {
            if (!payload?.notification) {
                const data = payload?.data || {};
                notifyBell({
                    messageId: payloadReader.resolveMessageId(payload),
                    notificationId: payloadReader.resolveNotificationId(payload),
                    title: data.title || "Thông báo",
                    body: data.body || "",
                    sourceCode: data.sourceCode || "",
                    createdAt: data.createdAt || "",
                    webRedirectPath: data.webRedirectPath || ""
                });
                return;
            }
            const messageId = payloadReader.resolveMessageId(payload);
            if (messageId && hasReceivedMessageId(messageId)) {
                return;
            }

            if (!("Notification" in globalThis) || Notification.permission !== "granted") {
                return;
            }

            if (messageId) {
                rememberReceivedMessageId(messageId);
            }

            const content = resolveNotificationContent(payload);
            const title = content.title;
            const body = content.body;
            new Notification(formatPushTitle(title), {
                body: body,
                icon: "/assets/images/favicon.ico",
                tag: messageId ? "fap-push-" + messageId : undefined
            });

            notifyBell({
                type: "notification.received",
                messageId: messageId,
                notificationId: payloadReader.resolveNotificationId(payload),
                title: title,
                body: body,
                linkUrl: payloadReader.resolveNotificationLink(payload)
            });
        });

        globalThis[foregroundListenerKey] = true;
    }

    function notifyBell(payload) {
        const title = payload?.title || (configElement.dataset.notificationDefaultTitle || "Th\u00f4ng b\u00e1o");
        const body = payload?.body || "";
        const messageId = payload?.messageId || "";
        const notificationId = payload?.notificationId || "";
        const linkUrl = payload?.linkUrl || payload?.dataLinkUrl || "";
        const sourceCode = payload?.sourceCode || "";
        const createdAt = payload?.createdAt || "";
        const webRedirectPath = payload?.webRedirectPath || linkUrl;

        document.dispatchEvent(new CustomEvent("fap:notification-received", {
            detail: {
                messageId: messageId,
                notificationId: notificationId,
                title: title,
                body: body,
                linkUrl: linkUrl,
                sourceCode: sourceCode,
                createdAt: createdAt,
                webRedirectPath: webRedirectPath,
                createdAtText: configElement.dataset.notificationJustNow || "V\u1eeba xong"
            }
        }));
    }

    function formatPushTitle(title) {
        const prefix = "[FAP] - ";
        const normalizedTitle = typeof title === "string" && title.trim()
            ? title.trim()
            : (configElement.dataset.notificationDefaultTitle || "Notification");
        return normalizedTitle.startsWith(prefix) ? normalizedTitle : prefix + normalizedTitle;
    }

    function syncDevice(isEnabled, permission, existingDeviceId) {
        const syncUrl = configElement.dataset.syncUrl;
        if (!syncUrl) {
            return;
        }

        const deviceToSync = existingDeviceId || getStoredFcmToken();
        if (!deviceToSync) {
            updatePermissionBadge(permission || readPermission());
            return;
        }

        const canSkipSync = !!isEnabled
            && !loginRegistrationId
            && localStorage.getItem(STORAGE_KEYS.lastSyncedToken) === deviceToSync
            && localStorage.getItem(STORAGE_KEYS.lastSyncedBrowser) === browserKey;
        if (canSkipSync) {
            sessionStorage.setItem(runtimeState.sessionSyncKey, "true");
            updatePermissionBadge(permission || readPermission());
            return;
        }

        const payload = {
            browserKey: browserKey,
            loginRegistrationId: loginRegistrationId || null,
            deviceId: safeTruncate(deviceToSync, 500),
            isEnabled: !!isEnabled,
            browserName: safeTruncate(detectBrowserName(), 50),
            platformName: safeTruncate(detectPlatformName(), 50),
            userAgent: safeTruncate(navigator.userAgent || "", 500)
        };

        postDeviceSync(syncUrl, payload)
            .then(function (response) {
                return response.text().then(function () {
                    if (!response.ok) {
                        throw new Error("SYNC_FAILED");
                    }

                    sessionStorage.setItem(runtimeState.sessionSyncKey, "true");
                    if (payload.isEnabled) {
                        localStorage.setItem(STORAGE_KEYS.lastSyncedToken, deviceToSync);
                        localStorage.setItem(STORAGE_KEYS.lastSyncedBrowser, browserKey);
                    }
                    updatePermissionBadge(permission || readPermission());
                    notifyPage(payload);
                });
            })
            .catch(function () {
                updatePermissionBadge(permission || readPermission());
            });
    }

    function postDeviceSync(syncUrl, payload) {
        return fetch(syncUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "RequestVerificationToken": csrfToken
            },
            body: JSON.stringify(payload),
            credentials: "same-origin"
        });
    }

    function notifyPage(payload) {
        document.dispatchEvent(new CustomEvent("fap:web-notification-synced", {
            detail: payload
        }));
    }

    function updatePermissionBadge(permission) {
        const badge = document.getElementById("notification-permission-status");
        if (!badge) {
            return;
        }

        const label = permissionToLabel(permission);
        badge.textContent = label;
        badge.classList.remove("bg-green", "bg-yellow", "bg-red", "bg-secondary", "text-green-fg", "text-yellow-fg", "text-red-fg", "text-secondary-fg");

        if (permission === "granted") {
            badge.classList.add("bg-green", "text-green-fg");
            return;
        }

        if (permission === "denied") {
            badge.classList.add("bg-red", "text-red-fg");
            return;
        }

        if (permission === "unsupported") {
            badge.classList.add("bg-secondary", "text-secondary-fg");
            return;
        }

        badge.classList.add("bg-yellow", "text-yellow-fg");
    }

    function notifyTokenUnavailable() {
        if (sessionStorage.getItem(STORAGE_KEYS.tokenUnavailableWarn) === "true") {
            return;
        }

        sessionStorage.setItem(STORAGE_KEYS.tokenUnavailableWarn, "true");
        if (globalThis.appToast && typeof globalThis.appToast.warning === "function") {
            globalThis.appToast.warning(
                configElement.dataset.tokenUnavailable
                || "\u0110\u00e3 c\u1ea5p quy\u1ec1n th\u00f4ng b\u00e1o nh\u01b0ng ch\u01b0a l\u1ea5y \u0111\u01b0\u1ee3c FCM token. Vui l\u00f2ng t\u1ea3i l\u1ea1i tr\u00ecnh duy\u1ec7t.");
        }
    }

    function permissionToLabel(permission) {
        if (permission === "granted") {
            return configElement.dataset.permissionGranted || "\u0110\u00e3 cho ph\u00e9p";
        }

        if (permission === "denied") {
            return configElement.dataset.permissionDenied || "\u0110\u00e3 t\u1eeb ch\u1ed1i";
        }

        if (permission === "unsupported") {
            return configElement.dataset.permissionUnsupported || "Kh\u00f4ng h\u1ed7 tr\u1ee3";
        }

        return configElement.dataset.permissionDefault || "Ch\u01b0a thi\u1ebft l\u1eadp";
    }

    function readPermission() {
        if (!("Notification" in globalThis)) {
            return "unsupported";
        }

        return Notification.permission || "default";
    }

    function getStoredFcmToken() {
        const token = localStorage.getItem(STORAGE_KEYS.fcmToken);
        if (!token || token.trim().length === 0) {
            const legacy = localStorage.getItem(STORAGE_KEYS.legacyDeviceId);
            if (!legacy || legacy.trim().length === 0) {
                return null;
            }

            const normalizedLegacy = legacy.trim();
            if (!isLikelyFcmToken(normalizedLegacy)) {
                return null;
            }

            localStorage.setItem(STORAGE_KEYS.fcmToken, normalizedLegacy);
            return normalizedLegacy;
        }

        return token.trim();
    }

    function getOrCreateBrowserKey() {
        const keyName = "fap.web.notification.browserKey";
        try {
            const existing = (localStorage.getItem(keyName) || "").trim();
            if (existing) {
                return existing;
            }

            const generated = globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
                ? globalThis.crypto.randomUUID()
                : "browser-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
            localStorage.setItem(keyName, generated);
            return generated;
        } catch (error) {
            return "browser-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
        }
    }

    function storeFcmToken(token) {
        if (!token || token.trim().length === 0) {
            return;
        }

        localStorage.setItem(STORAGE_KEYS.fcmToken, token.trim());
    }

    function clearStoredFcmTokenWhenDenied(permission) {
        if (permission !== "denied") {
            return;
        }

        localStorage.removeItem(STORAGE_KEYS.fcmToken);
        localStorage.removeItem(STORAGE_KEYS.legacyDeviceId);
    }

    function isLikelyFcmToken(token) {
        if (!token || token.length < 40) {
            return false;
        }

        const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (guidPattern.test(token)) {
            return false;
        }

        return !token.includes(" ");
    }

    function resolveNotificationContent(payload) {
        const defaultTitle = configElement.dataset.notificationDefaultTitle || "Th\u00f4ng b\u00e1o";
        return payloadReader.resolveNotificationContent(payload, defaultTitle);
    }

    function getReceivedMessageIds() {
        if (runtimeState.receivedMessageIdsCache) {
            return runtimeState.receivedMessageIdsCache;
        }

        const raw = localStorage.getItem(STORAGE_KEYS.receivedMessageIds);
        if (!raw) {
            runtimeState.receivedMessageIdsCache = [];
            return runtimeState.receivedMessageIdsCache;
        }

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                runtimeState.receivedMessageIdsCache = [];
                return runtimeState.receivedMessageIdsCache;
            }

            runtimeState.receivedMessageIdsCache = parsed
                .map(function (x) { return typeof x === "string" ? x.trim() : ""; })
                .filter(function (x) { return x.length > 0; })
                .slice(0, LIMITS.maxReceivedMessageIds);
            return runtimeState.receivedMessageIdsCache;
        } catch (error) {
            debugLog("received-message-cache.parse-failed", { error: error?.message || String(error || "") });
            runtimeState.receivedMessageIdsCache = [];
            return runtimeState.receivedMessageIdsCache;
        }
    }

    function hasReceivedMessageId(messageId) {
        if (!messageId) {
            return false;
        }

        const normalized = messageId.trim();
        if (!normalized) {
            return false;
        }

        return getReceivedMessageIds().includes(normalized);
    }

    function rememberReceivedMessageId(messageId) {
        if (!messageId) {
            return;
        }

        const normalized = messageId.trim();
        if (!normalized) {
            return;
        }

        let ids = getReceivedMessageIds();
        if (ids.includes(normalized)) {
            return;
        }

        ids.unshift(normalized);
        if (ids.length > LIMITS.maxReceivedMessageIds) {
            ids = ids.slice(0, LIMITS.maxReceivedMessageIds);
        }

        runtimeState.receivedMessageIdsCache = ids;
        localStorage.setItem(STORAGE_KEYS.receivedMessageIds, JSON.stringify(ids));
    }

    function detectBrowserName() {
        const ua = navigator.userAgent || "";
        if (ua.includes("Edg/")) {
            return "Edge";
        }

        if (ua.includes("Chrome/")) {
            return "Chrome";
        }

        if (ua.includes("Firefox/")) {
            return "Firefox";
        }

        if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
            return "Safari";
        }

        return "Unknown";
    }

    function detectPlatformName() {
        return navigator.userAgentData?.platform || navigator.userAgent || "Unknown";
    }

    function toBool(value) {
        if (typeof value !== "string") {
            return !!value;
        }

        return value.toLowerCase() === "true";
    }

    function safeTruncate(value, maxLength) {
        if (typeof value !== "string") {
            return "";
        }

        const normalized = value.trim();
        if (!normalized) {
            return "";
        }

        if (!maxLength || normalized.length <= maxLength) {
            return normalized;
        }

        return normalized.substring(0, maxLength);
    }

    function debugLog(eventName, detail) {
        if (!debugEnabled || typeof console === "undefined" || typeof console.debug !== "function") {
            return;
        }

        console.debug("[FAP Notification]", eventName, detail || {});
    }
})();
