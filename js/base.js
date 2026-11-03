(function () {
    const lang = (document.documentElement.lang || "en").toLowerCase();
    const isVi = lang.startsWith("vi");

    function initDatePicker(element) {
        if (!globalThis.flatpickr || element._flatpickr) {
            return;
        }

        const options = {
            allowInput: true,
            altInput: true,
            altFormat: "d/m/Y",
            dateFormat: "Y-m-d",
            maxDate: element.dataset.maxDate || element.getAttribute("max") || undefined
        };

        if (isVi && globalThis.flatpickr.l10ns?.vn) {
            options.locale = globalThis.flatpickr.l10ns.vn;
        }

        globalThis.flatpickr(element, options);
    }

    function initDatePickers(container) {
        const scope = container || document;
        scope.querySelectorAll("input.js-date-picker").forEach(initDatePicker);
    }

    const i18n = {
        loading: isVi ? "Đang tải..." : "Loading...",
        cannotLoad: isVi ? "Không tải được dữ liệu." : "Cannot load data.",
        systemError: isVi ? "Có lỗi hệ thống." : "System error.",
        noPermission: isVi ? "Bạn không có quyền" : "You do not have permission",
        rateLimited: isVi
            ? "Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại."
            : "You are doing that too quickly. Please wait a moment and try again.",
        retryAfter: isVi ? "Thử lại sau {0} giây." : "Try again in {0} seconds.",
        confirmSubmit: isVi
            ? "Bạn có chắc chắn muốn thực hiện thao tác này?"
            : "Are you sure you want to perform this action?",
        confirmDelete: isVi
            ? "Bạn có chắc chắn muốn xóa bản ghi này không?"
            : "Are you sure you want to delete this record?",
        success: isVi ? "Thành công" : "Success"
    };

    const modalElement = document.getElementById("addUpdateModal");
    const modalBody = modalElement?.querySelector(".modal-body") || null;
    const modalTitle = modalElement?.querySelector(".modal-title") || null;
    const modalInstance = modalElement
        ? globalThis.bootstrap?.Modal?.getOrCreateInstance(modalElement) || null
        : null;

    function setModalLoading(title) {
        if (!modalBody || !modalTitle) {
            return;
        }

        modalTitle.textContent = title || "";
        modalBody.innerHTML = `
            <div class="text-center p-3">
                <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
                <div class="small text-muted mt-2">${i18n.loading}</div>
            </div>`;
    }

    function handleFeedbackRequired(response) {
        if (!response) {
            return false;
        }

        const required = response.headers.get("X-Feedback-Required");
        if (required !== "1") {
            return false;
        }

        const redirectUrl = response.headers.get("X-Feedback-Redirect") || "/Feedback?required=1";
        globalThis.location.assign(redirectUrl);
        return true;
    }

    function isPermissionResponse(response) {
        return response?.status === 403
            || response?.headers?.get("X-FAP-Permission-Normalized") === "1";
    }

    function isCredentialAuthMessage(message) {
        if (!message) {
            return false;
        }

        const normalized = message.toString().toLowerCase();
        return normalized.includes("thông tin đăng nhập")
            || normalized.includes("tên đăng nhập")
            || normalized.includes("mật khẩu")
            || normalized.includes("không đúng")
            || normalized.includes("không chính xác")
            || normalized.includes("password")
            || normalized.includes("credential");
    }

    function isPermissionCode(code, message) {
        const normalized = (code || "").toString().toUpperCase();
        if (normalized === "FORBIDDEN") {
            return true;
        }

        return normalized === "UNAUTHORIZED" && !isCredentialAuthMessage(message);
    }

    let lastNoPermissionToastAt = 0;

    function showNoPermission() {
        const now = Date.now();
        if (now - lastNoPermissionToastAt < 1200) {
            return;
        }

        lastNoPermissionToastAt = now;
        showAjaxError(i18n.noPermission);
    }

    function renderNoPermissionAlert() {
        return `<div class="alert alert-warning mb-0">${i18n.noPermission}</div>`;
    }

    globalThis.isFetchPermissionResponse = isPermissionResponse;
    globalThis.handleFetchPermissionResponse = function handleFetchPermissionResponse(response, target) {
        if (!isPermissionResponse(response)) {
            return false;
        }

        if (target) {
            if (target.jquery) {
                target.html(renderNoPermissionAlert());
            } else if ("innerHTML" in target) {
                target.innerHTML = renderNoPermissionAlert();
            }
        }

        showNoPermission();
        return true;
    };

    async function shouldNormalizeFetchPermissionResponse(response) {
        if (!response) {
            return false;
        }

        if (response.status === 403) {
            return true;
        }

        if (response.status !== 401) {
            return false;
        }

        try {
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                return true;
            }

            const json = await response.clone().json();
            const code = (json?.code || json?.Code || "").toString().toUpperCase();
            const message = (json?.message || json?.Message || "").toString();

            if (code === "FORBIDDEN") {
                return true;
            }

            return (code === "UNAUTHORIZED" || response.status === 401)
                && !isCredentialAuthMessage(message);
        } catch {
            return true;
        }
    }

    (function normalizeFetchPermissionResponses() {
        if (typeof globalThis.fetch !== "function" || globalThis.fetch.__fapPermissionWrapped) {
            return;
        }

        const nativeFetch = globalThis.fetch.bind(globalThis);
        const wrappedFetch = async function fapPermissionAwareFetch() {
            const response = await nativeFetch.apply(null, arguments);
            if (response.headers.get("X-Feedback-Required") === "1"
                || !await shouldNormalizeFetchPermissionResponse(response)) {
                return response;
            }

            const headers = new Headers(response.headers);
            headers.set("content-type", "application/json; charset=utf-8");
            headers.set("X-FAP-Permission-Normalized", "1");
            return new Response(
                JSON.stringify({
                    isSuccess: false,
                    success: false,
                    code: response.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
                    message: i18n.noPermission
                }),
                {
                    status: response.status,
                    statusText: response.statusText,
                    headers
                });
        };

        wrappedFetch.__fapPermissionWrapped = true;
        globalThis.fetch = wrappedFetch;
    })();

    if (globalThis.jQuery) {
        $(document).ajaxError(function (_event, xhr) {
            const message = (
                xhr?.responseJSON?.message
                || xhr?.responseJSON?.Message
                || xhr?.responseText
                || ""
            ).toString();
            if (xhr?.status === 403
                || isPermissionCode(xhr?.responseJSON?.code, message)
                || (xhr?.status === 401 && !isCredentialAuthMessage(message))) {
                showNoPermission();
            }
        });
    }

    async function openPartialInModal(url, title) {
        if (!url || !modalBody || !modalInstance) {
            return;
        }

        setModalLoading(title);
        modalInstance.show();

        try {
            const response = await fetch(url, {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (handleFeedbackRequired(response)) {
                return;
            }

            if (isPermissionResponse(response)) {
                modalBody.innerHTML = renderNoPermissionAlert();
                showNoPermission();
                return;
            }

            const rateLimitMessage = await readRateLimitMessage(response);
            if (rateLimitMessage) {
                throw new Error(rateLimitMessage);
            }

            if (!response.ok) {
                throw new Error(i18n.cannotLoad);
            }

            const html = await response.text();
            modalBody.innerHTML = html;
            document.dispatchEvent(new CustomEvent("partial:loaded", { detail: { modal: modalElement } }));
        } catch (error) {
            modalBody.innerHTML = `<div class="alert alert-danger mb-0">${error.message || i18n.cannotLoad}</div>`;
        }
    }


    function showAjaxError(message) {
        if (typeof globalThis.AppToast?.error === "function") {
            globalThis.AppToast.error(message);
            return;
        }
        alert(message);
    }

    async function readRateLimitMessage(response) {
        if (response?.status !== 429) {
            return null;
        }

        let message = i18n.rateLimited;
        try {
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const json = await response.clone().json();
                message = json?.message || message;
            } else {
                const text = await response.clone().text();
                message = text || message;
            }
        } catch {
            // Keep the generic rate limit message.
        }

        const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "", 10);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
            message = `${message} ${i18n.retryAfter.replace("{0}", retryAfter)}`;
        }

        return message;
    }

    function completeSuccessfulAjaxForm(message) {
        if (modalInstance) {
            modalInstance.hide();
        }
        sessionStorage.setItem("toast_message", message || i18n.success);
        sessionStorage.setItem("toast_type", "success");
        globalThis.location.reload();
    }

    async function handleJsonAjaxResponse(response) {
        const rateLimitMessage = await readRateLimitMessage(response);
        if (rateLimitMessage) {
            showAjaxError(rateLimitMessage);
            return;
        }

        const json = await response.json();
        if (json?.isSuccess === true) {
            completeSuccessfulAjaxForm(json.message);
            return;
        }

        if (isPermissionCode(json?.code, json?.message || json?.Message)) {
            showNoPermission();
            return;
        }

        showAjaxError(json?.message || i18n.systemError);
    }

    async function submitAjaxForm(form) {
        if (!form || form.dataset.ajaxSubmitting === "true") {
            return;
        }

        if (form.classList.contains("js-confirm")) {
            const message = form.dataset.confirmMessage || i18n.confirmSubmit;
            if (!globalThis.confirm(message)) {
                return;
            }
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const action = form.dataset.action || form.getAttribute("action") || globalThis.location.href;
        const method = (form.getAttribute("method") || "POST").toUpperCase();
        const submitButton = form.querySelector('button[type="submit"]');

        form.dataset.ajaxSubmitting = "true";
        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const response = await fetch(action, {
                method,
                body: new FormData(form),
                credentials: "same-origin",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (handleFeedbackRequired(response)) {
                return;
            }

            if (isPermissionResponse(response)) {
                showNoPermission();
                return;
            }

            const rateLimitMessage = await readRateLimitMessage(response);
            if (rateLimitMessage) {
                showAjaxError(rateLimitMessage);
                return;
            }

            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                await handleJsonAjaxResponse(response);
                return;
            }

            const html = await response.text();
            if (!response.ok) {
                showAjaxError(i18n.systemError);
                return;
            }

            if (modalBody) {
                modalBody.innerHTML = html;
                document.dispatchEvent(new CustomEvent("partial:loaded", { detail: { modal: modalElement } }));
            }
        } catch (error) {
            console.debug("Ajax form submit failed.", error);
            showAjaxError(i18n.systemError);
        } finally {
            form.dataset.ajaxSubmitting = "false";
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }

    document.addEventListener("click", function (event) {
        const openModalTrigger = event.target.closest(".js-open-modal");
        if (openModalTrigger) {
            event.preventDefault();
            const url = openModalTrigger.dataset.action;
            const title = openModalTrigger.dataset.title || "";
            openPartialInModal(url, title);
            return;
        }

        const deleteTrigger = event.target.closest(".js-delete");
        if (!deleteTrigger) {
            return;
        }

        event.preventDefault();
        const url = deleteTrigger.dataset.action;
        if (!url) {
            return;
        }

        const message = deleteTrigger.dataset.message || i18n.confirmDelete;
        if (!globalThis.confirm(message)) {
            return;
        }

        const formId = deleteTrigger.getAttribute("form");
        const targetForm = formId
            ? document.getElementById(formId)
            : deleteTrigger.closest("form");

        if (targetForm) {
            if (url && targetForm.getAttribute("action") !== url) {
                targetForm.setAttribute("action", url);
            }

            if (typeof targetForm.requestSubmit === "function") {
                targetForm.requestSubmit();
            } else {
                targetForm.submit();
            }
            return;
        }

        fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        }).then(function (response) {
            if (handleFeedbackRequired(response)) {
                return;
            }

            if (isPermissionResponse(response)) {
                showNoPermission();
                return;
            }

            return readRateLimitMessage(response).then(function (rateLimitMessage) {
                if (rateLimitMessage) {
                    showAjaxError(rateLimitMessage);
                    return;
                }

                globalThis.location.reload();
            });
        }).catch(function () {
            showAjaxError(i18n.systemError);
        });
    });

    document.addEventListener("submit", function (event) {
        const form = event.target.closest("form.js-ajax-form");
        if (!form) {
            return;
        }

        event.preventDefault();
        submitAjaxForm(form);
    });

    initDatePickers(document);
    document.addEventListener("partial:loaded", function (event) {
        initDatePickers(event.detail?.modal || event.target);
    });
})();
