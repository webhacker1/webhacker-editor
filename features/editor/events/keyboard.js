import { executeRichCommand } from "../../../core/commands.js";
import { getSelectionAnchorElement } from "./utils.js";
import { placeCaretAfterElement } from "../selection.js";
import { SHORTCUT_ACTIONS, matchesShortcutEvent } from "../shortcuts.js";

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

export function bindKeyboardEvents(editor) {
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
            if (!codeElement) {
                event.preventDefault();
                return;
            }

            if (!activeCodeElement) {
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

        if (hasCommandModifier && event.code === "KeyA" && !event.shiftKey && !event.altKey && activeCodeElement) {
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
                executeRichCommand(matchingShortcutAction.command);
                editor.emitChange();
                editor.syncToggleStates();
                return;
            }
        }

        if (event.key === "Tab" && activeCodeElement) {
            event.preventDefault();
            executeRichCommand("insertText", "    ");
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
            executeRichCommand("insertParagraph");
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
                    if (text === "") {
                        event.preventDefault();
                        executeRichCommand("outdent");
                        editor.emitChange();
                        editor.syncToggleStates();
                        return;
                    }
                }
            }
        }

    });
}
