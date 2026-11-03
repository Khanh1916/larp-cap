(function () {
    const lang = (document.documentElement.lang || "en").toLowerCase();
    const isVi = lang.startsWith("vi");

    const headings = {
        success: isVi ? "Thành công" : "Success",
        error: isVi ? "Thông báo" : "Notice",
        warning: isVi ? "Cần lưu ý" : "Warning",
        info: isVi ? "Thông tin" : "Information"
    };

    function send(type, message, heading) {
        if (!message) {
            return;
        }

        if (globalThis.jQuery?.toast) {
            globalThis.jQuery.toast().reset("all");
            globalThis.jQuery.toast({
                heading: heading || headings[type] || headings.info,
                text: message,
                position: "top-right",
                loaderBg: "rgba(0,0,0,0.2)",
                icon: type || "info",
                hideAfter: type === "error" ? 7000 : 4000,
                stack: 3,
                showHideTransition: "fade"
            });
            return;
        }

        alert(message);
    }

    globalThis.AppToast = {
        success: function (message) { send("success", message); },
        error: function (message) { send("error", message); },
        warning: function (message) { send("warning", message); },
        info: function (message) { send("info", message); }
    };

    const pendingMessage = sessionStorage.getItem("toast_message");
    if (pendingMessage) {
        const pendingType = sessionStorage.getItem("toast_type") || "info";
        sessionStorage.removeItem("toast_message");
        sessionStorage.removeItem("toast_type");
        send(pendingType, pendingMessage);
    }
})();
