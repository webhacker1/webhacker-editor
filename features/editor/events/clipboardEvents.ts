import { executeRichCommand } from "@/core/indexCore";
import { escapeHtml } from "@/sanitize/indexSanitize";
import type { EditorEventContext } from "@/features/editor/events/eventTypes";
import { extractPlainTextFromClipboard } from "@/features/editor/events/utils/indexEventUtils";
import { getSelectionAnchorElement } from "@/features/editor/selection";
import { stripMathRuntimeUi } from "@/features/math/indexMath";
import { stripMermaidRuntimeUi } from "@/features/mermaid/indexMermaid";

export function bindClipboardEvents(editor: EditorEventContext): void {
    editor.contentEditableElement.addEventListener("paste", event => {
        event.preventDefault();
        const clipboardData = event.clipboardData || window.clipboardData;
        const htmlData = clipboardData.getData("text/html");
        const textData = clipboardData.getData("text/plain");
        const pasteText = extractPlainTextFromClipboard(htmlData, textData);
        const selection = window.getSelection();
        const anchorNode = getSelectionAnchorElement(selection);
        const activeCodeElement = anchorNode && anchorNode.closest ? anchorNode.closest("pre code") : null;

        if (activeCodeElement instanceof HTMLElement && selection && selection.rangeCount > 0) {
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
                const preElement = activeCodeElement.closest("pre");
                editor.ensureCodeLanguageBadge(preElement instanceof HTMLElement ? preElement : null);
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
        stripMermaidRuntimeUi(containerElement);
        const htmlValue = containerElement.innerHTML;
        const textValue = containerElement.textContent ?? "";

        event.clipboardData.setData("text/html", htmlValue);
        event.clipboardData.setData("text/plain", textValue);
        event.preventDefault();
    });
}
