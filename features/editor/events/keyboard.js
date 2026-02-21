import { executeRichCommand } from "../../../core/commands.js";
import { getSelectionAnchorElement } from "./utils.js";
import { placeCaretAfterElement } from "../selection.js";

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

export function bindKeyboardEvents(editor) {
    editor.contentEditableElement.addEventListener("keydown", event => {
        const pressedKey = event.key.toLowerCase();
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

        if (hasCommandModifier && pressedKey === "a" && activeCodeElement) {
            event.preventDefault();
            return;
        }

        if (event.key === "Tab" && activeCodeElement) {
            event.preventDefault();
            executeRichCommand("insertText", "    ");
            requestAnimationFrame(() => editor.highlightCodeAtCaret());
            editor.emitChange();
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

        if (hasCommandModifier && pressedKey === "b" && !activeCodeElement) {
            event.preventDefault();
            executeRichCommand("bold");
            editor.emitChange();
            editor.syncToggleStates();
        }
        if (hasCommandModifier && pressedKey === "i" && !activeCodeElement) {
            event.preventDefault();
            executeRichCommand("italic");
            editor.emitChange();
            editor.syncToggleStates();
        }
        if (hasCommandModifier && pressedKey === "u" && !activeCodeElement) {
            event.preventDefault();
            executeRichCommand("underline");
            editor.emitChange();
            editor.syncToggleStates();
        }
        if (hasCommandModifier && pressedKey === "z" && !event.shiftKey) {
            event.preventDefault();
            executeRichCommand("undo");
            editor.emitChange();
            editor.syncToggleStates();
        }
        if (
            (hasCommandModifier && pressedKey === "y") ||
            (hasCommandModifier && event.shiftKey && pressedKey === "z")
        ) {
            event.preventDefault();
            executeRichCommand("redo");
            editor.emitChange();
            editor.syncToggleStates();
        }
    });
}
