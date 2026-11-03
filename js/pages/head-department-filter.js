(function (document) {
    "use strict";

    function initializeDepartmentFilter() {
        document.querySelectorAll("[data-head-department-filter]").forEach(function (filter) {
            var form = filter.form;
            if (!form) {
                return;
            }

            // Look for the sibling "All" flag inside the same form; create one if missing
            // so other pages that include only the <select> still get the right behaviour.
            var allFlag = form.querySelector("[data-head-department-all-flag]");
            if (!allFlag) {
                allFlag = document.createElement("input");
                allFlag.type = "hidden";
                allFlag.name = "headDepartmentAll";
                allFlag.value = "0";
                allFlag.setAttribute("data-head-department-all-flag", "");
                form.appendChild(allFlag);
            }

            filter.addEventListener("change", function () {
                // -1 = the "All departments" sentinel. Tag the request so the controller
                // clears any previously-stored departmentId and reverts the dropdown to All.
                allFlag.value = filter.value === "-1" ? "1" : "0";
                form.submit();
            });
        });
    }

    document.addEventListener("DOMContentLoaded", initializeDepartmentFilter);
})(document);
