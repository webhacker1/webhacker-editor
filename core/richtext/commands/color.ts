import { normalizeCssColorToHex } from "@/sanitize/indexSanitize";
import { getAnchorElement, getSelectionRange, placeCaretAfterNode, placeCaretAtNodeEnd } from "@/core/richtext/selection";
import { normalizeInvalidInlineMarkContainers, unwrapElementKeepChildren } from "@/core/richtext/utils/indexUtils";
import type { EditorCommandContext } from "@/core/richtext/commands/types";
import { selectInsertedFragment } from "@/core/richtext/commands/dom";

function clearElementColorStyles(element: Element): boolean {
    if (!element || !element.getAttribute) return false;

    let changed = false;
    const htmlElement = element as HTMLElement;

    if (htmlElement.style && htmlElement.style.color) {
        htmlElement.style.removeProperty("color");
        changed = true;
    }

    if (element.hasAttribute("color")) {
        element.removeAttribute("color");
        changed = true;
    }

    if (element.getAttribute("style") === "") {
        element.removeAttribute("style");
    }

    if (changed && !element.attributes.length) {
        unwrapElementKeepChildren(element);
    }

    return changed;
}

function normalizeColorStylesInElement(rootElement: Element | null): void {
    if (!rootElement || !rootElement.querySelectorAll) return;
    rootElement.querySelectorAll("span,font").forEach(element => {
        clearElementColorStyles(element);
    });
}

function wrapTextNodesInColorSpan(fragment: DocumentFragment, colorValue: string): DocumentFragment {
    const containerElement = document.createElement("div");
    containerElement.appendChild(fragment);

    normalizeColorStylesInElement(containerElement);

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

        const colorElement = document.createElement("span");
        colorElement.style.color = colorValue;
        parentElement.replaceChild(colorElement, currentTextNode);
        colorElement.appendChild(currentTextNode);
    });

    const wrappedFragment = document.createDocumentFragment();
    while (containerElement.firstChild) wrappedFragment.appendChild(containerElement.firstChild);

    return wrappedFragment;
}

export function applyForeColor(editor: EditorCommandContext, colorValue: string | null): boolean {
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

    const extractedContent = range.extractContents();
    const wrappedContent = wrapTextNodesInColorSpan(extractedContent, normalizedColor);
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

export function removeForeColor(editor: EditorCommandContext): boolean {
    const range = getSelectionRange(editor);
    if (!range) return false;

    const touchedElements = new Set<Element>();

    if (range.collapsed) {
        const anchorElement = getAnchorElement(editor);
        if (!anchorElement) return false;

        let currentElement: Element | null = anchorElement;
        while (currentElement && editor.contentEditableElement.contains(currentElement)) {
            if (currentElement.matches("span,font")) touchedElements.add(currentElement);
            currentElement = currentElement.parentElement;
        }
    } else {
        const commonAncestorElement =
            range.commonAncestorContainer.nodeType === 1
                ? (range.commonAncestorContainer as Element)
                : range.commonAncestorContainer.parentElement;
        if (!commonAncestorElement) return false;

        const candidates = commonAncestorElement.matches("span,font")
            ? [commonAncestorElement]
            : [...commonAncestorElement.querySelectorAll("span,font")];

        candidates.forEach(candidateElement => {
            if (range.intersectsNode(candidateElement)) {
                touchedElements.add(candidateElement);
            }
        });
    }

    let hasChanges = false;
    touchedElements.forEach(element => {
        if (!editor.contentEditableElement.contains(element)) return;
        if (element.closest("pre,figure")) return;

        hasChanges = clearElementColorStyles(element) || hasChanges;
    });

    return hasChanges;
}
