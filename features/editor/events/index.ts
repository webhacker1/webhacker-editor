import { executeRichCommand } from "../../../core/commands";
import { escapeHtml } from "../../../sanitize/utils";
import { stripMathRuntimeUi } from "../../math/index";
import { placeCaretAfterElement, getSelectionAnchorElement } from "../selection";
import { SHORTCUT_ACTIONS, matchesShortcutEvent } from "../shortcuts";

let installed = false;

function isCaretAtCodeStart(codeElement, selection) {
    if (!selection || selection.rangeCount === 0) return false;
    const currentRange = selection.getRangeAt(0);
    if (!selection.isCollapsed || !codeElement.contains(currentRange.startContainer)) return false;

    const beforeCaretRange = currentRange.cloneRange();
    beforeCaretRange.selectNodeContents(codeElement);
    beforeCaretRange.setEnd(currentRange.startContainer, currentRange.startOffset);
    const beforeCaretText = beforeCaretRange.toString().replace(/\u200B/g, "");
    return beforeCaretText.length === 0;
}

function isCaretAtElementEnd(element, selection) {
    if (!selection || selection.rangeCount === 0) return false;
    const currentRange = selection.getRangeAt(0);
    if (!selection.isCollapsed || !element.contains(currentRange.startContainer)) return false;

    const afterCaretRange = currentRange.cloneRange();
    afterCaretRange.selectNodeContents(element);
    afterCaretRange.setStart(currentRange.startContainer, currentRange.startOffset);
    const afterCaretText = afterCaretRange.toString().replace(/\u200B/g, "");
    return afterCaretText.length === 0;
}

function placeCaretAtElementStart(element) {
    if (!element) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function getAdjacentTableCell(tableCellElement, step) {
    if (!tableCellElement) return null;
    const tableElement = tableCellElement.closest("table");
    if (!tableElement) return null;

    const tableCells = [...tableElement.rows].flatMap(tableRowElement => [...tableRowElement.cells]);
    const currentCellIndex = tableCells.indexOf(tableCellElement);
    if (currentCellIndex === -1) return null;
    return tableCells[currentCellIndex + step] || null;
}

function triggerToolbarControl(editor, controlId) {
    const controlButtonElement = editor.toolbarElement.querySelector(
        `.webhacker-button[data-control-id="${controlId}"]`
    );
    if (!controlButtonElement || controlButtonElement.disabled) return false;

    controlButtonElement.dispatchEvent(
        new MouseEvent("click", {
            bubbles: true,
            cancelable: true
        })
    );
    return true;
}

function extractPlainTextFromClipboard(htmlData, textData) {
    if (typeof textData === "string" && textData.length) return textData;
    if (!htmlData) return "";
    const templateElement = document.createElement("template");
    templateElement.innerHTML = String(htmlData);
    return templateElement.content.textContent || "";
}

function bindInputEvents(editor) {
    editor.contentEditableElement.addEventListener("input", () => {
        if (typeof editor.captureHistorySnapshot === "function") {
            editor.captureHistorySnapshot("input");
        }
        requestAnimationFrame(() => editor.highlightCodeAtCaret());
        editor.emitChange();
        editor.syncToggleStates();
    });
}

function bindClipboardEvents(editor) {
    editor.contentEditableElement.addEventListener("paste", event => {
        event.preventDefault();
        const clipboardData = event.clipboardData || window.clipboardData;
        const htmlData = clipboardData.getData("text/html");
        const textData = clipboardData.getData("text/plain");
        const pasteText = extractPlainTextFromClipboard(htmlData, textData);
        const selection = window.getSelection();
        const anchorNode = getSelectionAnchorElement(selection);
        const activeCodeElement = anchorNode && anchorNode.closest ? anchorNode.closest("pre code") : null;

        if (activeCodeElement) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(pasteText);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            if (typeof editor.captureHistorySnapshot === "function") {
                editor.captureHistorySnapshot("input");
            }
            editor.emitChange();
            editor.syncToggleStates();
            requestAnimationFrame(() => {
                editor.highlightCodeElement(activeCodeElement);
                editor.ensureCodeLanguageBadge(activeCodeElement.closest("pre"));
            });
            return;
        }

        if (pasteText) {
            const safeTextHtml = escapeHtml(pasteText).replace(/\r?\n/g, "<br>");
            executeRichCommand("insertHTML", safeTextHtml, editor);
        }
        if (typeof editor.captureHistorySnapshot === "function") {
            editor.captureHistorySnapshot("input");
        }
        editor.emitChange();
        editor.syncToggleStates();
        editor.highlightCodeBlocks();
    });

    editor.contentEditableElement.addEventListener("copy", event => {
        if (!event.clipboardData) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const fragment = selection.getRangeAt(0).cloneContents();
        const containerElement = document.createElement("div");
        containerElement.appendChild(fragment);
        containerElement.querySelectorAll(".webhacker-code-language").forEach(element => element.remove());
        stripMathRuntimeUi(containerElement);
        const htmlValue = containerElement.innerHTML;
        const textValue = containerElement.textContent ?? "";

        event.clipboardData.setData("text/html", htmlValue);
        event.clipboardData.setData("text/plain", textValue);
        event.preventDefault();
    });
}

function bindSelectionEvents(editor) {
    ["mouseup", "keyup"].forEach(eventName => {
        editor.contentEditableElement.addEventListener(eventName, () => {
            editor.currentSavedSelectionRange = editor.saveSelectionRange();
            editor.syncToggleStates();
        });
    });

    editor.contentEditableElement.addEventListener("mousedown", event => {
        const targetCellElement =
            event.target && event.target.closest ? event.target.closest("td,th") : null;
        if (targetCellElement) {
            editor.ensureCaretAnchorInTableCell(targetCellElement, false);
        }
    });

    editor.contentEditableElement.addEventListener("click", event => {
        const anchorElement = event.target && event.target.closest ? event.target.closest("a") : null;
        if (anchorElement) event.preventDefault();
    });

    document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const anchorNode = getSelectionAnchorElement(selection);
        if (anchorNode && editor.contentEditableElement.contains(anchorNode)) {
            editor.currentSavedSelectionRange = editor.saveSelectionRange();
            editor.syncToggleStates();
            const tableCellElement = anchorNode.closest && anchorNode.closest("td,th");
            if (tableCellElement) editor.ensureCaretAnchorInTableCell(tableCellElement, false);
        }
    });
}

function bindKeyboardEvents(editor) {
    editor.contentEditableElement.addEventListener("keydown", event => {
        const hasCommandModifier = event.ctrlKey || event.metaKey;
        const selection = window.getSelection();
        const anchorNode = getSelectionAnchorElement(selection);
        const activePreElement = anchorNode && anchorNode.closest ? anchorNode.closest("pre") : null;
        const activeCodeElement = activePreElement
            ? activePreElement.querySelector("code")
            : anchorNode && anchorNode.closest
              ? anchorNode.closest("pre code")
              : null;
        const nearestCodeElement = anchorNode && anchorNode.closest ? anchorNode.closest("code") : null;
        const activeTableCellElement =
            anchorNode && anchorNode.closest ? anchorNode.closest("td,th") : null;
        const inlineCodeElement =
            nearestCodeElement && nearestCodeElement.closest && !nearestCodeElement.closest("pre")
                ? nearestCodeElement
                : null;

        if ((event.key === "Backspace" || event.key === "Delete") && activePreElement) {
            const codeElement = activePreElement.querySelector("code");
            if (!codeElement || !activeCodeElement) {
                event.preventDefault();
                return;
            }
            if (
                event.key === "Backspace" &&
                selection &&
                selection.isCollapsed &&
                isCaretAtCodeStart(activeCodeElement, selection)
            ) {
                event.preventDefault();
                return;
            }
        }

        if (
            hasCommandModifier &&
            event.code === "KeyA" &&
            !event.shiftKey &&
            !event.altKey &&
            activeCodeElement
        ) {
            event.preventDefault();
            return;
        }

        const matchingShortcutAction = SHORTCUT_ACTIONS.find(shortcutAction =>
            shortcutAction.shortcuts.some(shortcutDef => matchesShortcutEvent(event, shortcutDef))
        );
        if (matchingShortcutAction) {
            if (activeCodeElement && !matchingShortcutAction.allowInCodeBlock) return;

            if (matchingShortcutAction.type === "control") {
                if (triggerToolbarControl(editor, matchingShortcutAction.controlId)) {
                    event.preventDefault();
                    return;
                }
            } else if (matchingShortcutAction.type === "command") {
                event.preventDefault();
                executeRichCommand(matchingShortcutAction.command, null, editor);
                editor.emitChange();
                editor.syncToggleStates();
                return;
            }
        }

        if (event.key === "Tab" && activeCodeElement) {
            event.preventDefault();
            executeRichCommand("insertText", "    ", editor);
            requestAnimationFrame(() => editor.highlightCodeAtCaret());
            editor.emitChange();
            return;
        }

        if (event.key === "Tab" && activeTableCellElement && !activeCodeElement) {
            event.preventDefault();
            const direction = event.shiftKey ? -1 : 1;
            const nextTableCellElement = getAdjacentTableCell(activeTableCellElement, direction);
            if (nextTableCellElement) {
                editor.ensureCaretAnchorInTableCell(nextTableCellElement, true);
                editor.syncToggleStates();
            } else if (!event.shiftKey) {
                editor.exitTableToNextLine(activeTableCellElement);
            }
            return;
        }

        if (event.key === "Enter" && activeCodeElement && hasCommandModifier && !event.shiftKey) {
            event.preventDefault();
            editor.exitCodeBlockToNextLine(activeCodeElement);
            return;
        }

        if (event.key === "Enter" && inlineCodeElement) {
            event.preventDefault();
            placeCaretAfterElement(inlineCodeElement);
            executeRichCommand("insertParagraph", null, editor);
            editor.emitChange();
            editor.syncToggleStates();
            return;
        }

        if (event.key === "Enter" && !event.shiftKey && !activeCodeElement) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount) {
                let node = sel.anchorNode;
                if (node && node.nodeType === 3) node = node.parentNode;
                const li = node && node.closest ? node.closest("li") : null;
                if (li) {
                    const text = li.textContent.replace(/\u200B/g, "").trim();
                    const parentListElement = li.closest("ul,ol");
                    const isLastItem = parentListElement
                        ? li === parentListElement.lastElementChild
                        : false;
                    const nextBlockElement = parentListElement
                        ? (parentListElement.nextElementSibling as HTMLElement | null)
                        : null;

                    if (
                        text !== "" &&
                        isLastItem &&
                        nextBlockElement &&
                        isCaretAtElementEnd(li, sel)
                    ) {
                        event.preventDefault();
                        placeCaretAtElementStart(nextBlockElement);
                        editor.currentSavedSelectionRange = editor.saveSelectionRange();
                        editor.syncToggleStates();
                        return;
                    }

                    if (text === "") {
                        event.preventDefault();
                        executeRichCommand("outdent", null, editor);
                        editor.emitChange();
                        editor.syncToggleStates();
                    }
                }
            }
        }
    });
}

export function installEditorEvents(WebHackerEditorClass) {
    if (installed) return;
    installed = true;

    WebHackerEditorClass.prototype.bindEditorEvents = function () {
        bindInputEvents(this);
        bindClipboardEvents(this);
        bindSelectionEvents(this);
        bindKeyboardEvents(this);
        this.highlightCodeBlocks();
    };
}
