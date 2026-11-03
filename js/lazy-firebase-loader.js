(function () {
    "use strict";

    /**
     * Lazy-load Firebase Messaging only when a token is requested.
     * Keeps ~69KB off the critical path of every authenticated page.
     */
    var RUNTIME = {
        loadedPromise: null
    };

    var SCRIPT_SRCS = [
        "/assets/vendor/firebase/firebase-app-compat.js",
        "/assets/vendor/firebase/firebase-messaging-compat.js"
    ];

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var existing = document.querySelector('script[data-fap-firebase-src="' + src + '"]');
            if (existing) {
                if (existing.dataset.loaded === "1") {
                    resolve();
                    return;
                }
                existing.addEventListener("load", function () { resolve(); });
                existing.addEventListener("error", function () {
                    reject(new Error("Failed to load: " + src));
                });
                return;
            }

            var script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.dataset.fapFirebaseSrc = src;
            script.onload = function () {
                script.dataset.loaded = "1";
                resolve();
            };
            script.onerror = function () {
                reject(new Error("Failed to load: " + src));
            };
            document.head.appendChild(script);
        });
    }

    function isFirebaseReady() {
        return !!globalThis.firebase
            && typeof globalThis.firebase.initializeApp === "function"
            && typeof globalThis.firebase.messaging === "function";
    }

    function ensureFirebaseLoaded() {
        if (isFirebaseReady()) {
            return Promise.resolve(true);
        }

        if (RUNTIME.loadedPromise) {
            return RUNTIME.loadedPromise;
        }

        // Sequential: messaging depends on app globals.
        RUNTIME.loadedPromise = SCRIPT_SRCS.reduce(function (chain, src) {
            return chain.then(function () { return loadScript(src); });
        }, Promise.resolve()).then(function () {
            return isFirebaseReady();
        }).catch(function () {
            RUNTIME.loadedPromise = null;
            return false;
        });

        return RUNTIME.loadedPromise;
    }

    if (!globalThis.fapFirebaseLoader) {
        globalThis.fapFirebaseLoader = {
            ensureLoaded: ensureFirebaseLoaded,
            isReady: isFirebaseReady
        };
    }
})();
