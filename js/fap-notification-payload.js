(function () {
    "use strict";

    function firstNonEmptyText() {
        for (const value of arguments) {
            if (typeof value !== "string") {
                continue;
            }

            const normalized = value.trim();
            if (normalized.length > 0) {
                return normalized;
            }
        }

        return "";
    }

    function readPayloadDataText(payload, key) {
        if (!payload?.data || !key) {
            return "";
        }

        const value = payload.data[key];
        if (typeof value !== "string") {
            return "";
        }

        return value.trim();
    }

    function resolveMessageId(payload) {
        if (!payload) {
            return null;
        }

        return firstNonEmptyText(
            payload.data?.messageId || "",
            payload.messageId || "",
            payload.fcmMessageId || "") || null;
    }

    function resolveNotificationId(payload) {
        if (!payload) {
            return "";
        }

        return firstNonEmptyText(
            payload.data?.notificationId || "",
            payload.notificationId || "");
    }

    function resolveNotificationLink(payload) {
        if (!payload?.data) {
            return "";
        }

        return firstNonEmptyText(
            payload.data.linkUrl,
            payload.data.link,
            payload.data.url,
            payload.data.attachmentUrl,
            "");
    }

    function resolveNotificationContent(payload, defaultTitle) {
        const notification = payload?.notification || null;
        const title = firstNonEmptyText(
            notification?.title || "",
            readPayloadDataText(payload, "title"),
            readPayloadDataText(payload, "pushTitle"),
            readPayloadDataText(payload, "bellTitle"),
            defaultTitle || "");
        const body = firstNonEmptyText(
            notification?.body || "",
            readPayloadDataText(payload, "body"),
            readPayloadDataText(payload, "pushBody"),
            readPayloadDataText(payload, "bellBody"),
            "");

        return {
            title: title,
            body: body
        };
    }

    function copyNotificationData(rawData, messageId) {
        const data = {};
        const source = rawData || {};

        Object.keys(source).forEach(function (key) {
            data[key] = source[key];
        });

        if (messageId) {
            data.messageId = messageId;
        }

        return data;
    }

    globalThis.fapNotificationPayload = {
        firstNonEmptyText: firstNonEmptyText,
        readPayloadDataText: readPayloadDataText,
        resolveMessageId: resolveMessageId,
        resolveNotificationId: resolveNotificationId,
        resolveNotificationLink: resolveNotificationLink,
        resolveNotificationContent: resolveNotificationContent,
        copyNotificationData: copyNotificationData
    };
})();
