import {
    getAnchorElement,
    getSelectionRange,
    placeCaretAfterNode,
    placeCaretAtNodeEnd,
} from "@/core/richtext/selection";
import { normalizeInvalidInlineMarkContainers, unwrapElementKeepChildren } from "@/core/richtext/utils/indexUtils";
import type { EditorCommandContext } from "@/core/richtext/commands/types";
import { insertFragmentAndRestoreSelection, selectInsertedFragment } from "@/core/richtext/commands/dom";

function unwrapSelectorInFragment(fragment: DocumentFragment, selector: string): DocumentFragment {
    const containerElement = document.createElement("div");
    containerElement.appendChild(fragment);

    [...containerElement.querySelectorAll(selector)].forEach(unwrapElementKeepChildren);

    const cleanedFragment = document.createDocumentFragment();
    while (containerElement.firstChild) cleanedFragment.appendChild(containerElement.firstChild);

    return cleanedFragment;
}

function wrapTextNodesInFragment(
    fragment: DocumentFragment,
    tagName: string,
    selector: string,
): DocumentFragment {
    const containerElement = document.createElement("div");
    containerElement.appendChild(fragment);

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(containerElement, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode() as Text | null;

    while (textNode) {
        textNodes.push(textNode);
        textNode = walker.nextNode() as Text | null;
    }

    textNodes.forEach(currentTextNode => {
        const textValue = currentTextNode.nodeValue || "";
        if (!textValue.length || textValue === "\u200B") return;

        const parentElement = currentTextNode.parentElement;
        if (!parentElement) return;
        if (parentElement.closest("pre,figure,table")) return;
        if (parentElement.closest(selector)) return;

        const wrapperElement = document.createElement(tagName);
        parentElement.replaceChild(wrapperElement, currentTextNode);
        wrapperElement.appendChild(currentTextNode);
    });

    const wrappedFragment = document.createDocumentFragment();
    while (containerElement.firstChild) wrappedFragment.appendChild(containerElement.firstChild);

    return wrappedFragment;
}

function isEveryTextNodeMarked(fragment: DocumentFragment, selector: string): boolean {
    const containerElement = document.createElement("div");
    containerElement.appendChild(fragment);

    const walker = document.createTreeWalker(containerElement, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    let hasMeaningfulText = false;

    while (textNode) {
        const textValue = (textNode.nodeValue || "").replace(/\u200B/g, "");
        if (textValue.trim().length > 0) {
            hasMeaningfulText = true;
            const parentElement = textNode.parentElement;
            if (!parentElement || !parentElement.closest(selector)) return false;
        }
        textNode = walker.nextNode();
    }

    return hasMeaningfulText;
}

function getMarkCoverageInFragment(
    fragment: DocumentFragment,
    selector: string,
): { totalTextLength: number; markedTextLength: number } {
    const containerElement = document.createElement("div");
    containerElement.appendChild(fragment);

    const walker = document.createTreeWalker(containerElement, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode() as Text | null;
    let totalTextLength = 0;
    let markedTextLength = 0;

    while (textNode) {
        const rawTextValue = textNode.nodeValue || "";
        const normalizedTextValue = rawTextValue.replace(/\u200B/g, "");
        if (normalizedTextValue.trim().length > 0) {
            const currentLength = normalizedTextValue.length;
            totalTextLength += currentLength;

            const parentElement = textNode.parentElement;
            if (parentElement && parentElement.closest(selector)) {
                markedTextLength += currentLength;
            }
        }

        textNode = walker.nextNode() as Text | null;
    }

    return { totalTextLength, markedTextLength };
}

function shouldRemoveInlineMarkFromSelection(fragment: DocumentFragment, selector: string): boolean {
    const { totalTextLength, markedTextLength } = getMarkCoverageInFragment(fragment, selector);
    if (totalTextLength === 0) return false;
    if (markedTextLength === totalTextLength) return true;

    const unmarkedTextLength = totalTextLength - markedTextLength;
    const markedRatio = markedTextLength / totalTextLength;

    return markedRatio >= 0.97 && unmarkedTextLength <= 3;
}

function selectionIntersectsInlineMark(
    editor: EditorCommandContext,
    range: Range,
    selector: string,
): boolean {
    const rootElement = editor.contentEditableElement;
    const commonAncestorElement =
        range.commonAncestorContainer.nodeType === 1
            ? (range.commonAncestorContainer as Element)
            : range.commonAncestorContainer.parentElement;
    if (!commonAncestorElement) return false;

    const candidates = commonAncestorElement.matches(selector)
        ? [commonAncestorElement]
        : [...commonAncestorElement.querySelectorAll(selector)];

    return candidates.some(candidateElement => {
        if (!rootElement.contains(candidateElement)) return false;
        return range.intersectsNode(candidateElement);
    });
}

function getClosestMarkedElement(node: Node | null, selector: string, rootElement: HTMLElement): Element | null {
    if (!node) return null;

    const baseElement = node.nodeType === 1 ? (node as Element) : node.parentElement;
    if (!baseElement || !baseElement.closest) return null;

    const markedElement = baseElement.closest(selector);
    if (!markedElement || !rootElement.contains(markedElement)) return null;

    return markedElement;
}

function moveCaretOutsideMarkedElementAtRange(markedElement: Element, range: Range): boolean {
    if (!range.collapsed) return false;
    if (!markedElement.contains(range.startContainer)) return false;

    const lastChildNode = markedElement.lastChild;
    if (lastChildNode) {
        const tailRange = range.cloneRange();
        tailRange.setEndAfter(lastChildNode);
        const tailFragment = tailRange.extractContents();
        if (tailFragment.childNodes.length) {
            const tailMarkedElement = markedElement.cloneNode(false) as HTMLElement;
            tailMarkedElement.appendChild(tailFragment);
            markedElement.insertAdjacentElement("afterend", tailMarkedElement);
        }
    }

    const parentNode = markedElement.parentNode;
    if (!parentNode) return false;

    let plainAnchorNode = markedElement.nextSibling;
    let insertedAnchorNode = false;

    if (!plainAnchorNode || plainAnchorNode.nodeType !== 3) {
        plainAnchorNode = document.createTextNode("\u200B");
        parentNode.insertBefore(plainAnchorNode, markedElement.nextSibling || null);
        insertedAnchorNode = true;
    } else if (!(plainAnchorNode.nodeValue || "").length) {
        plainAnchorNode.nodeValue = "\u200B";
        insertedAnchorNode = true;
    }

    const caretRange = document.createRange();
    caretRange.setStart(plainAnchorNode, insertedAnchorNode ? 1 : 0);
    caretRange.collapse(true);

    const selection = window.getSelection();
    if (!selection) return false;

    selection.removeAllRanges();
    selection.addRange(caretRange);

    return true;
}

function removeSelectionInsideSingleMarkedElement(
    range: Range,
    markedElement: Element,
    aliasSelector: string,
): boolean {
    if (range.collapsed) return false;

    const extractedFragment = range.extractContents();
    const cleanedFragment = unwrapSelectorInFragment(extractedFragment, aliasSelector);

    let insertBeforeNode = markedElement.nextSibling;
    const lastChildNode = markedElement.lastChild;

    if (lastChildNode) {
        const tailRange = range.cloneRange();
        tailRange.setEndAfter(lastChildNode);
        const tailFragment = tailRange.extractContents();
        if (tailFragment.childNodes.length) {
            const tailMarkedElement = markedElement.cloneNode(false) as HTMLElement;
            tailMarkedElement.appendChild(tailFragment);
            markedElement.insertAdjacentElement("afterend", tailMarkedElement);
            insertBeforeNode = tailMarkedElement;
        }
    }

    const insertRange = document.createRange();
    if (insertBeforeNode && insertBeforeNode.parentNode) {
        insertRange.setStartBefore(insertBeforeNode);
    } else {
        insertRange.setStartAfter(markedElement);
    }
    insertRange.collapse(true);

    insertFragmentAndRestoreSelection(insertRange, cleanedFragment);

    return true;
}

export function toggleInlineMark(
    editor: EditorCommandContext,
    tagName: "strong" | "em" | "u",
    aliasSelector: string,
): boolean {
    normalizeInvalidInlineMarkContainers(editor.contentEditableElement);

    const range = getSelectionRange(editor);
    if (!range) return false;

    const startMarkedElement = getClosestMarkedElement(
        range.startContainer,
        aliasSelector,
        editor.contentEditableElement,
    );
    const endMarkedElement = getClosestMarkedElement(
        range.endContainer,
        aliasSelector,
        editor.contentEditableElement,
    );

    const selection = window.getSelection();
    const anchorMarkedElement = getClosestMarkedElement(
        selection?.anchorNode || null,
        aliasSelector,
        editor.contentEditableElement,
    );
    const focusMarkedElement = getClosestMarkedElement(
        selection?.focusNode || null,
        aliasSelector,
        editor.contentEditableElement,
    );

    if (startMarkedElement && startMarkedElement === endMarkedElement && range.collapsed) {
        if (!moveCaretOutsideMarkedElementAtRange(startMarkedElement, range)) {
            placeCaretAfterNode(startMarkedElement);
        }

        normalizeInvalidInlineMarkContainers(editor.contentEditableElement);
        return true;
    }

    const clonedSelectionFragment = !range.collapsed ? range.cloneContents() : null;
    const shouldRemoveInlineMark =
        !range.collapsed &&
        (selectionIntersectsInlineMark(editor, range, aliasSelector) ||
            (clonedSelectionFragment && isEveryTextNodeMarked(clonedSelectionFragment, aliasSelector)) ||
            (clonedSelectionFragment &&
                shouldRemoveInlineMarkFromSelection(clonedSelectionFragment, aliasSelector)) ||
            ((Boolean(startMarkedElement) ||
                Boolean(endMarkedElement) ||
                Boolean(anchorMarkedElement) ||
                Boolean(focusMarkedElement)) &&
                selectionIntersectsInlineMark(editor, range, aliasSelector)));

    if (shouldRemoveInlineMark) {
        if (startMarkedElement && startMarkedElement === endMarkedElement) {
            removeSelectionInsideSingleMarkedElement(range, startMarkedElement, aliasSelector);
            normalizeInvalidInlineMarkContainers(editor.contentEditableElement);
            return true;
        }

        const extractedFragment = range.extractContents();
        const cleanedFragment = unwrapSelectorInFragment(extractedFragment, aliasSelector);
        insertFragmentAndRestoreSelection(range, cleanedFragment);
        normalizeInvalidInlineMarkContainers(editor.contentEditableElement);

        return true;
    }

    const wrapperElement = document.createElement(tagName);
    if (range.collapsed) {
        wrapperElement.appendChild(document.createTextNode("\u200B"));
        range.insertNode(wrapperElement);
        placeCaretAtNodeEnd(wrapperElement);

        return true;
    }

    const extractedContent = range.extractContents();
    const wrappedContent = wrapTextNodesInFragment(extractedContent, tagName, aliasSelector);
    const firstInsertedNode = wrappedContent.firstChild;
    const lastInsertedNode = wrappedContent.lastChild;

    range.insertNode(wrappedContent);

    if (firstInsertedNode && lastInsertedNode) {
        selectInsertedFragment(firstInsertedNode, lastInsertedNode);
    } else if (lastInsertedNode) {
        placeCaretAfterNode(lastInsertedNode);
    }

    normalizeInvalidInlineMarkContainers(editor.contentEditableElement);

    return true;
}

export function removeFormattingMarksWithinElement(rootElement: Element): void {
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
}

export function unlinkAtSelection(editor: EditorCommandContext): boolean {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;

    const linkElement = anchorElement.closest("a");
    if (!linkElement || !editor.contentEditableElement.contains(linkElement)) return false;

    unwrapElementKeepChildren(linkElement);
    return true;
}
