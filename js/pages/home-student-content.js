(function () {
    "use strict";

    function loadScriptOnce(url) {
        if (!url) {
            return Promise.resolve();
        }

        const existing = document.querySelector('script[data-home-dyn-src="' + url + '"]');
        if (existing) {
            return existing.dataset.loaded === "1"
                ? Promise.resolve()
                : new Promise(function (resolve, reject) {
                    existing.addEventListener("load", function () { resolve(); });
                    existing.addEventListener("error", function () { reject(new Error("Failed to load " + url)); });
                });
        }

        return new Promise(function (resolve, reject) {
            const script = document.createElement("script");
            script.src = url;
            script.async = true;
            script.dataset.homeDynSrc = url;
            script.onload = function () {
                script.dataset.loaded = "1";
                resolve();
            };
            script.onerror = function () {
                reject(new Error("Failed to load " + url));
            };
            document.body.appendChild(script);
        });
    }

    // CSP style-src/script-src deny inline styles & handlers. Must strip from the
    // HTML *string* before innerHTML — assigning first already applies styles and
    // logs CSP violations (e.g. pinned news @Html.Raw content).
    function stripCspUnsafeMarkup(html) {
        if (!html) {
            return "";
        }

        return String(html)
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
            .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    }

    function sanitizeParsed(root) {
        const all = root.querySelectorAll("*");
        for (let i = 0; i < all.length; i++) {
            const el = all[i];
            if (el.tagName === "STYLE") {
                el.remove();
                continue;
            }

            const attrs = Array.prototype.slice.call(el.attributes);
            for (const element of attrs) {
                const name = element.name;
                if (name === "style" || name.toLowerCase().indexOf("on") === 0) {
                    el.removeAttribute(name);
                }
            }
        }
    }

    function applySlot(parsed, slotName, targetId) {
        const target = document.getElementById(targetId);
        const source = parsed.querySelector('[data-home-slot="' + slotName + '"]');
        if (!target || !source) {
            return null;
        }

        target.replaceWith(source);
        return source;
    }

    function attach() {
        const shell = document.getElementById("home-student-shell");
        if (!shell) {
            return;
        }

        const fetchUrl = shell.dataset.fetchUrl;
        if (!fetchUrl) {
            return;
        }

        const loadErrorText = shell.dataset.loadErrorText || "Unable to load home content.";

        fetch(fetchUrl, {
            method: "GET",
            credentials: "same-origin",
            headers: { Accept: "text/html", "X-Requested-With": "XMLHttpRequest" }
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }
                return response.text();
            })
            .then(function (html) {
                const parsed = document.createElement("div");
                parsed.innerHTML = stripCspUnsafeMarkup(html);
                sanitizeParsed(parsed);

                applySlot(parsed, "fee", "home-fee-slot");
                applySlot(parsed, "student", "home-student-slot");
                applySlot(parsed, "news", "home-news-slot");
                const extras = applySlot(parsed, "extras", "home-extras-slot");

                const tasks = [];
                if (extras?.dataset.hasPinned === "1") {
                    tasks.push(loadScriptOnce(shell.dataset.pinnedScriptUrl));
                }
                if (extras?.dataset.loadPayment === "1") {
                    tasks.push(
                        loadScriptOnce(shell.dataset.bootboxScriptUrl)
                            .then(function () { return loadScriptOnce(shell.dataset.paymentScriptUrl); })
                    );
                }

                return Promise.all(tasks);
            })
            .catch(function (err) {
                if (isLikelyCanceled(err)) {
                    return;
                }

                const newsSlot = document.getElementById("home-news-slot");
                if (newsSlot) {
                    newsSlot.innerHTML =
                        '<div class="card"><div class="alert alert-danger m-3" role="alert">' +
                        loadErrorText +
                        "</div></div>";
                }
            });
    }

    function isLikelyCanceled(err) {
        if (!err) {
            return false;
        }
        if (err.name === "AbortError") {
            return true;
        }
        const message = String(err.message || err).toLowerCase();
        return message.includes("abort") || message.includes("cancel");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attach);
    } else {
        attach();
    }
})();
