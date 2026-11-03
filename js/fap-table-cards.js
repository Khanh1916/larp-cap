(function () {
    "use strict";

    const STACK_CLASS = "fap-table--stack";
    const EMPTY_ROW_CLASS = "fap-table-card--empty";
    const ACTION_CELL_CLASS = "fap-table-card__actions";
    const PROCESSED_ATTR = "data-fap-table-cards";
    const MIN_COLUMNS = 3;
    const MAX_GRID_COLUMNS = 14;
    const KEEP_GRID_SELECTOR = [
        ".weekly-timetable-grid",
        ".srb-grid-scroll",
        ".lrb-grid-scroll",
        ".fap-table-keep-grid",
        ".d-none.d-md-block"
    ].join(",");

    function normalizeLabel(value) {
        return (value || "").replace(/\s+/g, " ").trim();
    }

    function headerLabels(table) {
        const headerRow = table.tHead?.rows?.[0];
        if (!headerRow) {
            return [];
        }

        return Array.from(headerRow.cells).map(function (cell) {
            return normalizeLabel(cell.textContent);
        });
    }

    function shouldSkip(table) {
        if (!(table instanceof HTMLTableElement)) {
            return true;
        }

        if (table.getAttribute(PROCESSED_ATTR) === "1") {
            return true;
        }

        if (table.closest("td, th")) {
            return true;
        }

        if (table.classList.contains("dataTable")
            || table.classList.contains("dt-responsive")
            || table.closest(".dataTables_wrapper")) {
            return true;
        }

        if (table.classList.contains("w-auto")
            || table.classList.contains("fap-table-keep-grid")
            || table.classList.contains("lf-report-table")
            || table.classList.contains("student-mark-sheet")) {
            return true;
        }

        if (KEEP_GRID_SELECTOR && table.closest(KEEP_GRID_SELECTOR)) {
            return true;
        }

        if (table.querySelector("tbody td[rowspan], tbody th[rowspan]")) {
            return true;
        }

        const labels = headerLabels(table);
        return labels.length < MIN_COLUMNS || labels.length > MAX_GRID_COLUMNS;
    }

    function isActionCell(cell, index, total, label) {
        if (!(cell instanceof HTMLElement)) {
            return false;
        }

        if (cell.classList.contains("text-end")
            || cell.classList.contains(ACTION_CELL_CLASS)
            || cell.classList.contains("lecture-change-schedule-table__action")) {
            return true;
        }

        const lower = (label || "").toLowerCase();
        if (lower === "action" || lower === "thao tác" || lower === "hành động") {
            return true;
        }

        return index === total - 1
            && (cell.querySelector(".btn, form, .fap-row-actions") !== null);
    }

    function attachMyClassesActions(table, labels) {
        const shell = table.closest(".my-classes-table-shell");
        if (!shell || table.querySelector("." + ACTION_CELL_CLASS)) {
            return labels;
        }

        const actionCells = shell.querySelectorAll(".my-classes-action-pane__cell");
        if (!actionCells.length) {
            return labels;
        }

        const actionLabel = normalizeLabel(
            shell.querySelector(".my-classes-action-pane__header")?.textContent
        ) || "Action";

        Array.from(table.tBodies).forEach(function (tbody) {
            Array.from(tbody.rows).forEach(function (row, rowIndex) {
                if (row.querySelector("td[colspan]")) {
                    return;
                }

                const source = actionCells[rowIndex];
                if (!source) {
                    return;
                }

                const td = document.createElement("td");
                td.className = ACTION_CELL_CLASS;
                td.setAttribute("data-label", actionLabel);
                td.append(...Array.from(source.childNodes).map(function (node) {
                    return node.cloneNode(true);
                }));
                row.appendChild(td);
            });
        });

        return labels.concat(actionLabel);
    }

    function enhanceTable(table) {
        if (shouldSkip(table)) {
            return;
        }

        let labels = headerLabels(table);
        labels = attachMyClassesActions(table, labels);

        Array.from(table.tBodies).forEach(function (tbody) {
            Array.from(tbody.rows).forEach(function (row) {
                const cells = Array.from(row.cells);
                const hasColspan = cells.some(function (cell) {
                    return cell.colSpan > 1;
                });

                if (hasColspan && cells.length === 1) {
                    row.classList.add(EMPTY_ROW_CLASS);
                    return;
                }

                cells.forEach(function (cell, index) {
                    if (!cell.hasAttribute("data-label") && labels[index]) {
                        cell.setAttribute("data-label", labels[index]);
                    }

                    if (isActionCell(cell, index, cells.length, labels[index])) {
                        cell.classList.add(ACTION_CELL_CLASS);
                    }
                });
            });
        });

        table.classList.add(STACK_CLASS);
        table.setAttribute(PROCESSED_ATTR, "1");
    }

    function enhance(root) {
        const scope = root instanceof Element ? root : document;
        scope.querySelectorAll("table.table").forEach(enhanceTable);
    }

    let scheduled = false;
    function scheduleEnhance() {
        if (scheduled) {
            return;
        }

        scheduled = true;
        globalThis.requestAnimationFrame(function () {
            scheduled = false;
            enhance(document);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            enhance(document);
        });
    } else {
        enhance(document);
    }

    document.addEventListener("partial:loaded", function (event) {
        enhance(event.detail?.modal || document);
    });

    const observer = new MutationObserver(function (mutations) {
        const shouldRun = mutations.some(function (mutation) {
            return Array.from(mutation.addedNodes).some(function (node) {
                return node.nodeType === 1
                    && (node.matches?.("table.table, .table-responsive")
                        || node.querySelector?.("table.table"));
            });
        });

        if (shouldRun) {
            scheduleEnhance();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
