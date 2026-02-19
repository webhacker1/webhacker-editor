import { executeRichCommand } from "../../../core/commands.js";
import { getSelectionAnchorElement } from "./utils.js";

export function bindKeyboardEvents(editor) {
    editor.contentEditableElement.addEventListener("keydown", event => {
        const pressedKey = event.key.toLowerCase();
        const hasCommandModifier = event.ctrlKey || event.metaKey;
        const selection = window.getSelection();
        const anchorNode = getSelectionAnchorElement(selection);
        const activeCodeElement = anchorNode && anchorNode.closest ? anchorNode.closest("pre code") : null;

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

        if (hasCommandModifier && pressedKey === "b") {
            event.preventDefault();
            executeRichCommand("bold");
            editor.emitChange();
            editor.syncToggleStates();
        }
        if (hasCommandModifier && pressedKey === "i") {
            event.preventDefault();
            executeRichCommand("italic");
            editor.emitChange();
            editor.syncToggleStates();
        }
        if (hasCommandModifier && pressedKey === "u") {
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

