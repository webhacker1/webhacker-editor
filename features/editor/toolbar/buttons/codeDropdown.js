import { createElement } from "../../../../ui/elements.js";
import { executeRichCommand } from "../../../../core/commands.js";
import { getSelectionAnchorElement, placeCaretInElement } from "../../selection.js";
import { escapeHtml } from "../../../../sanitize/utils.js";
import { createDropdown, createMenuAction } from "../ui.js";

function unwrapElementKeepChildren(element) {
    const parentElement = element.parentNode;
    while (element.firstChild) parentElement.insertBefore(element.firstChild, element);
    parentElement.removeChild(element);
}

function replacePreWithPlainText(preElement, plainTextValue) {
    const lines = String(plainTextValue).split(/\r?\n/);
    const htmlValue = lines.map(line => escapeHtml(line)).join("<br>");

    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNode(preElement);
    selection.removeAllRanges();
    selection.addRange(range);
    executeRichCommand("insertHTML", htmlValue);
}

function normalizeInlineCodeText(value) {
    return String(value).replace(/\u200B/g, "").replace(/\r?\n+/g, " ");
}

function toggleInlineCode(editor) {
    const anchorElement = getSelectionAnchorElement();
    const nearestCodeElement = anchorElement && anchorElement.closest ? anchorElement.closest("code") : null;
    const isInsideCodeBlock =
        nearestCodeElement && nearestCodeElement.closest ? nearestCodeElement.closest("pre") : null;

    if (nearestCodeElement && !isInsideCodeBlock) {
        unwrapElementKeepChildren(nearestCodeElement);
        return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const codeElement = document.createElement("code");

    if (!selection.isCollapsed) {
        const selectedText = normalizeInlineCodeText(selection.toString());
        range.deleteContents();
        codeElement.textContent = selectedText || "\u200B";
        range.insertNode(codeElement);
        placeCaretInElement(codeElement);
    } else {
        range.insertNode(codeElement);
        if (!codeElement.firstChild) codeElement.appendChild(document.createTextNode("\u200B"));
        placeCaretInElement(codeElement);
    }
}

function toggleCodeBlock(editor, language) {
    const anchorElement = getSelectionAnchorElement();
    const nearestPreElement = anchorElement && anchorElement.closest ? anchorElement.closest("pre") : null;
    const nearestInlineCodeElement = anchorElement && anchorElement.closest ? anchorElement.closest("code") : null;
    const normalizedLanguage = language ?? "plaintext";

    if (nearestPreElement) {
        const codeElement = nearestPreElement.querySelector("code");
        const plainText = (
            codeElement
                ? codeElement.innerText ?? codeElement.textContent ?? ""
                : nearestPreElement.innerText ?? nearestPreElement.textContent ?? ""
        ).replace(/\u200B/g, "");
        replacePreWithPlainText(nearestPreElement, plainText);
        return;
    }

    if (
        nearestInlineCodeElement &&
        (!nearestInlineCodeElement.closest || !nearestInlineCodeElement.closest("pre"))
    ) {
        const preElement = document.createElement("pre");
        const codeElement = document.createElement("code");
        codeElement.className = `language-${normalizedLanguage}`;
        codeElement.textContent = nearestInlineCodeElement.textContent || "\u200B";
        preElement.appendChild(codeElement);
        nearestInlineCodeElement.replaceWith(preElement);
        placeCaretInElement(codeElement);
        editor.highlightCodeElement(codeElement);
        editor.ensureCodeLanguageBadge(preElement);
        return;
    }

    const selection = window.getSelection();
    const preElement = document.createElement("pre");
    const codeElement = document.createElement("code");
    codeElement.className = `language-${normalizedLanguage}`;
    codeElement.textContent =
        selection && selection.rangeCount > 0 && selection.toString() ? selection.toString() : "\u200B";
    preElement.appendChild(codeElement);

    if (!selection || selection.rangeCount === 0) {
        editor.contentEditableElement.appendChild(preElement);
    } else {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(preElement);
    }

    placeCaretInElement(codeElement);
    editor.highlightCodeElement(codeElement);
    editor.ensureCodeLanguageBadge(preElement);
}

export function createCodeDropdown(editor, t) {
    const codeT = t.code;
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-code",
        codeT.label
    );

    const inlineCodeItemElement = createElement("div", "webhacker-menu__item");
    inlineCodeItemElement.textContent = codeT.inline;
    inlineCodeItemElement.addEventListener("mousedown", event => event.preventDefault());
    inlineCodeItemElement.addEventListener(
        "click",
        createMenuAction(editor, () => toggleInlineCode(editor))
    );

    const blockCodeItemElement = createElement("div", "webhacker-menu__item");
    blockCodeItemElement.textContent = codeT.block;
    blockCodeItemElement.addEventListener("mousedown", event => event.preventDefault());
    blockCodeItemElement.addEventListener(
        "click",
        createMenuAction(editor, () => toggleCodeBlock(editor, "plaintext"))
    );

    dropdownMenuElement.append(inlineCodeItemElement, blockCodeItemElement);
    return dropdownWrapperElement;
}
