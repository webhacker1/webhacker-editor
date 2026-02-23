import { escapeHtml } from "../../../sanitize/utils.js";
import { getSelectionAnchorElement } from "./utils.js";

function extractPlainTextFromClipboard(htmlData, textData) {
    if (typeof textData === "string" && textData.length) return textData;
    if (!htmlData) return "";
    const templateElement = document.createElement("template");
    templateElement.innerHTML = String(htmlData);
    return templateElement.content.textContent || "";
}

export function bindClipboardEvents(editor) {
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
            document.execCommand("insertHTML", false, safeTextHtml);
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
        containerElement.querySelectorAll(".webhacker-code-language").forEach(element => {
            element.remove();
        });
        const htmlValue = containerElement.innerHTML;
        const textValue = containerElement.textContent ?? "";

        event.clipboardData.setData("text/html", htmlValue);
        event.clipboardData.setData("text/plain", textValue);
        event.preventDefault();
    });
}
