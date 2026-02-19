import { sanitizeHtmlStringToSafeHtml } from "../../../sanitize/sanitize.js";
import { escapeHtml } from "../../../sanitize/utils.js";
import { getSelectionAnchorElement } from "./utils.js";

function stripEditorUiFromHtml(rawHtml) {
    const templateElement = document.createElement("template");
    templateElement.innerHTML = String(rawHtml ?? "");
    templateElement.content.querySelectorAll(".webhacker-code-language").forEach(element => {
        element.remove();
    });
    return templateElement.innerHTML;
}

export function bindClipboardEvents(editor) {
    editor.contentEditableElement.addEventListener("paste", event => {
        event.preventDefault();
        const clipboardData = event.clipboardData || window.clipboardData;
        const htmlData = clipboardData.getData("text/html");
        const textData = clipboardData.getData("text/plain");
        const selection = window.getSelection();
        const anchorNode = getSelectionAnchorElement(selection);
        const activeCodeElement = anchorNode && anchorNode.closest ? anchorNode.closest("pre code") : null;

        if (activeCodeElement) {
            const pasteText = textData ?? "";
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

        if (htmlData) {
            const cleanedClipboardHtml = stripEditorUiFromHtml(htmlData);
            const safeHtml = sanitizeHtmlStringToSafeHtml(cleanedClipboardHtml, {
                stripColors: true
            });
            document.execCommand("insertHTML", false, safeHtml);
        } else if (textData) {
            const safeTextHtml = escapeHtml(textData).replace(/\r?\n/g, "<br>");
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

