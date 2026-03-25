import { normalizeCssColorToHex } from "../../sanitize/utils";
import {
    ensureTextAnchor,
    getAnchorElement,
    getClosestBlock,
    getSelectionRange,
    placeCaretAfterNode,
    placeCaretAtNodeEnd
} from "./selection";

function unwrapElementKeepChildren(element) {
    if (!element || !element.parentNode) return;
    const parentElement = element.parentNode;
    while (element.firstChild) parentElement.insertBefore(element.firstChild, element);
    parentElement.removeChild(element);
}

function replaceElementTag(element, targetTagName) {
    if (!element || !element.parentNode) return null;
    const replacementElement = document.createElement(targetTagName);
    [...element.attributes].forEach(attribute => {
        if (attribute.name !== "align") {
            replacementElement.setAttribute(attribute.name, attribute.value);
        }
    });
    while (element.firstChild) replacementElement.appendChild(element.firstChild);
    element.replaceWith(replacementElement);
    return replacementElement;
}

function insertHtmlAtSelection(editor, htmlValue) {
    const range = getSelectionRange(editor);
    if (!range) return false;
    range.deleteContents();
    const fragment = range.createContextualFragment(String(htmlValue || ""));
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);
    if (lastNode) placeCaretAfterNode(lastNode);
    return true;
}

function insertTextAtSelection(editor, textValue) {
    const range = getSelectionRange(editor);
    if (!range) return false;
    range.deleteContents();
    const textNode = document.createTextNode(String(textValue || ""));
    range.insertNode(textNode);
    const selection = window.getSelection();
    const caretRange = document.createRange();
    caretRange.setStartAfter(textNode);
    caretRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caretRange);
    return true;
}

function getClosestMarkedElement(node, selector, rootElement) {
    if (!node) return null;
    const baseElement = node.nodeType === 1 ? node : node.parentElement;
    if (!baseElement || !baseElement.closest) return null;
    const markedElement = baseElement.closest(selector);
    if (!markedElement || !rootElement.contains(markedElement)) return null;
    return markedElement;
}

function toggleInlineMark(editor, tagName, aliasSelector) {
    const range = getSelectionRange(editor);
    if (!range) return false;
    const startMarkedElement = getClosestMarkedElement(
        range.startContainer,
        aliasSelector,
        editor.contentEditableElement
    );
    const endMarkedElement = getClosestMarkedElement(
        range.endContainer,
        aliasSelector,
        editor.contentEditableElement
    );

    if (startMarkedElement && startMarkedElement === endMarkedElement) {
        unwrapElementKeepChildren(startMarkedElement);
        return true;
    }

    const wrapperElement = document.createElement(tagName);

    if (range.collapsed) {
        wrapperElement.appendChild(document.createTextNode("\u200B"));
        range.insertNode(wrapperElement);
        placeCaretAtNodeEnd(wrapperElement);
        return true;
    }

    try {
        range.surroundContents(wrapperElement);
    } catch {
        const extractedContent = range.extractContents();
        wrapperElement.appendChild(extractedContent);
        range.insertNode(wrapperElement);
    }
    placeCaretAtNodeEnd(wrapperElement);
    return true;
}

function setAlign(editor, alignValue) {
    const blockElement = getClosestBlock(editor);
    if (!blockElement) return false;
    if (alignValue === "left") {
        blockElement.style.removeProperty("text-align");
        blockElement.removeAttribute("align");
    } else {
        blockElement.style.textAlign = alignValue;
    }
    return true;
}

function toggleList(editor, listType) {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;
    const activeListElement = anchorElement.closest("ul,ol");

    if (activeListElement) {
        if (activeListElement.tagName.toLowerCase() === listType) {
            const fragment = document.createDocumentFragment();
            [...activeListElement.querySelectorAll(":scope > li")].forEach(listItemElement => {
                const paragraphElement = document.createElement("p");
                while (listItemElement.firstChild) paragraphElement.appendChild(listItemElement.firstChild);
                ensureTextAnchor(paragraphElement);
                fragment.appendChild(paragraphElement);
            });
            activeListElement.replaceWith(fragment);
            return true;
        }

        const convertedListElement = replaceElementTag(activeListElement, listType);
        if (!convertedListElement) return false;
        const targetListItemElement = getAnchorElement(editor)?.closest("li");
        if (targetListItemElement) placeCaretAtNodeEnd(targetListItemElement);
        return true;
    }

    const blockElement = getClosestBlock(editor);
    if (!blockElement) return false;
    if (blockElement.closest("pre,figure,table")) return false;

    const listElement = document.createElement(listType);
    const listItemElement = document.createElement("li");
    while (blockElement.firstChild) listItemElement.appendChild(blockElement.firstChild);
    ensureTextAnchor(listItemElement);
    listElement.appendChild(listItemElement);
    blockElement.replaceWith(listElement);
    placeCaretAtNodeEnd(listItemElement);
    return true;
}

function applyForeColor(editor, colorValue) {
    const normalizedColor = normalizeCssColorToHex(colorValue) || String(colorValue || "").trim();
    if (!normalizedColor) return false;

    const range = getSelectionRange(editor);
    if (!range) return false;
    const spanElement = document.createElement("span");
    spanElement.style.color = normalizedColor;

    if (range.collapsed) {
        spanElement.appendChild(document.createTextNode("\u200B"));
        range.insertNode(spanElement);
        placeCaretAtNodeEnd(spanElement);
        return true;
    }

    try {
        range.surroundContents(spanElement);
    } catch {
        const extractedContent = range.extractContents();
        spanElement.appendChild(extractedContent);
        range.insertNode(spanElement);
    }

    placeCaretAtNodeEnd(spanElement);
    return true;
}

function formatBlock(editor, tagName) {
    const blockElement = getClosestBlock(editor);
    if (!blockElement) return false;
    if (blockElement.closest("pre,figure,table")) return false;

    const normalizedTag = String(tagName || "P").toUpperCase();
    const allowed = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6"]);
    if (!allowed.has(normalizedTag)) return false;
    replaceElementTag(blockElement, normalizedTag.toLowerCase());
    return true;
}

function removeFormat(editor) {
    const blockElement = getClosestBlock(editor);
    if (!blockElement) return false;
    if (blockElement.closest("pre,figure")) return false;

    const rootElement = blockElement.closest("li") || blockElement;
    rootElement.querySelectorAll("strong,b,em,i,u,font").forEach(unwrapElementKeepChildren);
    rootElement.querySelectorAll("span").forEach(spanElement => {
        if (spanElement.closest("pre,figure")) return;
        spanElement.removeAttribute("style");
        if (!spanElement.attributes.length) unwrapElementKeepChildren(spanElement);
    });
    rootElement.querySelectorAll("*").forEach(nodeElement => {
        nodeElement.removeAttribute("align");
        const htmlElement = nodeElement as HTMLElement;
        if (htmlElement.style) htmlElement.style.removeProperty("text-align");
    });

    return true;
}

function unlinkAtSelection(editor) {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;
    const linkElement = anchorElement.closest("a");
    if (!linkElement || !editor.contentEditableElement.contains(linkElement)) return false;
    unwrapElementKeepChildren(linkElement);
    return true;
}

function deleteSelection(editor) {
    const range = getSelectionRange(editor);
    if (!range) return false;
    range.deleteContents();
    return true;
}

function insertParagraph(editor) {
    return insertHtmlAtSelection(editor, "<p>\u200B</p>");
}

function outdentListItem(editor) {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;
    const listItemElement = anchorElement.closest("li");
    if (!listItemElement) return false;
    const paragraphElement = document.createElement("p");
    while (listItemElement.firstChild) paragraphElement.appendChild(listItemElement.firstChild);
    ensureTextAnchor(paragraphElement);
    listItemElement.replaceWith(paragraphElement);
    const parentListElement = paragraphElement.closest("ul,ol");
    if (parentListElement && !parentListElement.querySelector("li")) {
        parentListElement.remove();
    }
    placeCaretAtNodeEnd(paragraphElement);
    return true;
}

export function executeEditorCommand(editor, commandName, commandValue = null) {
    switch (commandName) {
        case "undo":
            return editor.undoFromHistory();
        case "redo":
            return editor.redoFromHistory();
        case "bold":
            return toggleInlineMark(editor, "strong", "strong,b");
        case "italic":
            return toggleInlineMark(editor, "em", "em,i");
        case "underline":
            return toggleInlineMark(editor, "u", "u");
        case "justifyLeft":
            return setAlign(editor, "left");
        case "justifyCenter":
            return setAlign(editor, "center");
        case "justifyRight":
            return setAlign(editor, "right");
        case "insertUnorderedList":
            return toggleList(editor, "ul");
        case "insertOrderedList":
            return toggleList(editor, "ol");
        case "foreColor":
            return applyForeColor(editor, commandValue);
        case "formatBlock":
            return formatBlock(editor, commandValue);
        case "removeFormat":
            return removeFormat(editor);
        case "insertHTML":
            return insertHtmlAtSelection(editor, commandValue);
        case "insertText":
            return insertTextAtSelection(editor, commandValue);
        case "unlink":
            return unlinkAtSelection(editor);
        case "delete":
            return deleteSelection(editor);
        case "insertParagraph":
            return insertParagraph(editor);
        case "outdent":
            return outdentListItem(editor);
        default:
            return false;
    }
}

function getCurrentAlignState(editor) {
    const blockElement = getClosestBlock(editor);
    if (!blockElement) return "left";

    const inlineAlign = (blockElement.style.textAlign || "").toLowerCase();
    const alignAttr = String(blockElement.getAttribute("align") || "").toLowerCase();
    const resolvedAlign = inlineAlign || alignAttr || "left";

    if (resolvedAlign === "center") return "center";
    if (resolvedAlign === "right" || resolvedAlign === "end") return "right";
    return "left";
}

export function queryEditorCommandState(editor, commandName) {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;

    switch (commandName) {
        case "bold":
            return Boolean(anchorElement.closest("strong,b"));
        case "italic":
            return Boolean(anchorElement.closest("em,i"));
        case "underline":
            return Boolean(anchorElement.closest("u"));
        case "insertUnorderedList":
            return Boolean(anchorElement.closest("ul"));
        case "insertOrderedList":
            return Boolean(anchorElement.closest("ol"));
        case "justifyLeft":
            return getCurrentAlignState(editor) === "left";
        case "justifyCenter":
            return getCurrentAlignState(editor) === "center";
        case "justifyRight":
            return getCurrentAlignState(editor) === "right";
        default:
            return false;
    }
}
