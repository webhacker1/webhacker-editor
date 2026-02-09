import WebHackerEditor from "./WebHackerEditor.js";
import { sanitizeHtmlStringToSafeHtml } from "../sanitize/sanitize.js";
import { escapeHtml } from "../sanitize/utils.js";
import { executeRichCommand } from "./commands.js";

WebHackerEditor.prototype.bindEditorEvents = function () {
    this.contentEditableElement.addEventListener("input", () => {
        this.emitChange();
        this.syncToggleStates();
    });

    this.contentEditableElement.addEventListener("paste", event => {
        event.preventDefault();
        const clipboardData = event.clipboardData || window.clipboardData;
        const htmlData = clipboardData.getData("text/html");
        const textData = clipboardData.getData("text/plain");
        if (htmlData) {
            const safeHtml = sanitizeHtmlStringToSafeHtml(htmlData, {
                stripColors: true
            });
            document.execCommand("insertHTML", false, safeHtml);
        } else if (textData) {
            const safeTextHtml = escapeHtml(textData).replace(/\r?\n/g, "<br>");
            document.execCommand("insertHTML", false, safeTextHtml);
        }
        this.emitChange();
        this.syncToggleStates();
    });

    ["mouseup", "keyup"].forEach(eventName => {
        this.contentEditableElement.addEventListener(eventName, () => this.syncToggleStates());
    });

    this.contentEditableElement.addEventListener("mousedown", event => {
        const targetCellElement =
            event.target && event.target.closest ? event.target.closest("td,th") : null;
        if (targetCellElement) {
            this.ensureCaretAnchorInTableCell(targetCellElement, false);
        }
    });

    document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const anchorNode =
            selection.anchorNode && selection.anchorNode.nodeType === 3
                ? selection.anchorNode.parentNode
                : selection.anchorNode;

        if (anchorNode && this.contentEditableElement.contains(anchorNode)) {
            this.syncToggleStates();

            const tableCellElement = anchorNode.closest && anchorNode.closest("td,th");
            if (tableCellElement) {
                this.ensureCaretAnchorInTableCell(tableCellElement, false);
            }
        }
    });

    this.contentEditableElement.addEventListener("keydown", event => {
        if (event.key === 'Tab') {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const startContainer = range.startContainer;
            const tableCell = startContainer.closest
                ? startContainer.closest('td,th')
                : (startContainer.nodeType === 3
                    ? startContainer.parentNode.closest('td,th')
                    : null);
            
            if (tableCell) {
                event.preventDefault();
                event.stopImmediatePropagation();

                const table = tableCell.closest('table');
                const allCells = Array.from(table.querySelectorAll('td,th'));
                const currentIndex = allCells.indexOf(tableCell);

                if (currentIndex === -1) return;

                let nextIndex;
                if (event.shiftKey) {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : allCells.length - 1;
                } else {
                    nextIndex = currentIndex < allCells.length - 1 ? currentIndex + 1 : 0;
                }
                
                const nextCell = allCells[nextIndex];
                const newRange = document.createRange();

                if (!nextCell.textContent.trim() && nextCell.childNodes.length === 0) {
                    nextCell.textContent = '\u200B';
                }
                if (nextCell.firstChild) {
                    newRange.setStart(nextCell.firstChild, 0);
                    newRange.setEnd(nextCell.firstChild, 0);
                } else {
                    newRange.selectNodeContents(nextCell);
                    newRange.collapse(true);
                }
                
                selection.removeAllRanges();
                selection.addRange(newRange);

                return false;
            }
        }

        const pressedKey = event.key.toLowerCase();
        const hasCommandModifier = event.ctrlKey || event.metaKey;

        if (event.key === "Enter" && !event.shiftKey) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount) {
                let node = sel.anchorNode;
                if (node && node.nodeType === 3) node = node.parentNode;
                const li = node && node.closest ? node.closest("li") : null;
                if (li) {
                    const text = li.textContent.replace(/\u200B/g, "").trim();
                    if (text === "") {
                        event.preventDefault();
                        executeRichCommand("outdent");
                        this.emitChange();
                        this.syncToggleStates();
                        return;
                    }
                }
            }
        }

        if (hasCommandModifier && pressedKey === "b") {
            event.preventDefault();
            executeRichCommand("bold");
            this.emitChange();
            this.syncToggleStates();
        }
        if (hasCommandModifier && pressedKey === "i") {
            event.preventDefault();
            executeRichCommand("italic");
            this.emitChange();
            this.syncToggleStates();
        }
        if (hasCommandModifier && pressedKey === "u") {
            event.preventDefault();
            executeRichCommand("underline");
            this.emitChange();
            this.syncToggleStates();
        }
        if (hasCommandModifier && pressedKey === "z" && !event.shiftKey) {
            event.preventDefault();
            executeRichCommand("undo");
            this.emitChange();
            this.syncToggleStates();
        }
        if (
            (hasCommandModifier && pressedKey === "y") ||
            (hasCommandModifier && event.shiftKey && pressedKey === "z")
        ) {
            event.preventDefault();
            executeRichCommand("redo");
            this.emitChange();
            this.syncToggleStates();
        }
    });
};
