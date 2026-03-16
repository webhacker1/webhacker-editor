import { normalizeCssColorToHex } from "../../sanitize/utils";
import {
    ensureTextAnchor,
    getAnchorElement,
    getClosestBlock,
    getSelectionRange,
    placeCaretAfterNode,
    placeCaretAtNodeEnd
} from "./selection";

const INLINE_MARK_BLOCK_SELECTOR =
    "p,h1,h2,h3,h4,h5,h6,div,blockquote,ul,ol,li,table,thead,tbody,tfoot,tr,td,th,pre,figure";

function unwrapElementKeepChildren(element) {
    if (!element || !element.parentNode) return;
    const parentElement = element.parentNode;
    while (element.firstChild) parentElement.insertBefore(element.firstChild, element);
    parentElement.removeChild(element);
}

function setSelectionRange(range) {
    if (!range) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
}

function selectInsertedFragment(firstNode, lastNode) {
    if (!firstNode || !lastNode) return;
    const range = document.createRange();
    try {
        range.setStartBefore(firstNode);
        range.setEndAfter(lastNode);
        setSelectionRange(range);
    } catch {
    }
}

function insertFragmentAndRestoreSelection(range, fragment) {
    if (!range || !fragment) return false;
    const startMarker = document.createComment("wh-range-start");
    const endMarker = document.createComment("wh-range-end");
    const wrappedFragment = document.createDocumentFragment();
    wrappedFragment.appendChild(startMarker);
    wrappedFragment.appendChild(fragment);
    wrappedFragment.appendChild(endMarker);
    range.insertNode(wrappedFragment);

    const restoredRange = document.createRange();
    try {
        restoredRange.setStartAfter(startMarker);
        restoredRange.setEndBefore(endMarker);
        setSelectionRange(restoredRange);
    } catch {
    }

    if (startMarker.parentNode) startMarker.parentNode.removeChild(startMarker);
    if (endMarker.parentNode) endMarker.parentNode.removeChild(endMarker);
    return true;
}

function resolveMarkFamily(tagName) {
    const normalizedTag = String(tagName || "").toLowerCase();
    if (normalizedTag === "strong" || normalizedTag === "b") return "bold";
    if (normalizedTag === "em" || normalizedTag === "i") return "italic";
    if (normalizedTag === "u") return "underline";
    return "";
}

function isSameMarkFamily(firstElement, secondElement) {
    if (!firstElement || !secondElement) return false;
    const firstFamily = resolveMarkFamily(firstElement.tagName);
    const secondFamily = resolveMarkFamily(secondElement.tagName);
    return Boolean(firstFamily) && firstFamily === secondFamily;
}

function normalizeInvalidInlineMarkContainers(rootElement) {
    if (!rootElement || !rootElement.querySelectorAll) return;
    const selector = "strong,b,em,i,u";

    rootElement.querySelectorAll(selector).forEach(markElement => {
        if (markElement.querySelector(INLINE_MARK_BLOCK_SELECTOR)) {
            unwrapElementKeepChildren(markElement);
        }
    });

    let hasNestedMarks = true;
    while (hasNestedMarks) {
        hasNestedMarks = false;
        rootElement.querySelectorAll(selector).forEach(markElement => {
            const parentElement = markElement.parentElement;
            if (parentElement && parentElement.matches(selector) && isSameMarkFamily(markElement, parentElement)) {
                unwrapElementKeepChildren(markElement);
                hasNestedMarks = true;
            }
        });
    }

    rootElement.querySelectorAll(selector).forEach(markElement => {
        const meaningfulText = (markElement.textContent || "").replace(/\u200B/g, "").trim();
        const hasAtomicContent = Boolean(
            markElement.querySelector("img,svg,video,audio,iframe,canvas,math")
        );
        if (!meaningfulText.length && !hasAtomicContent) {
            unwrapElementKeepChildren(markElement);
        }
    });
}

function unwrapSelectorInFragment(fragment, selector) {
    const containerElement = document.createElement("div");
    containerElement.appendChild(fragment);
    [...containerElement.querySelectorAll(selector)].forEach(unwrapElementKeepChildren);
    const cleanedFragment = document.createDocumentFragment();
    while (containerElement.firstChild) cleanedFragment.appendChild(containerElement.firstChild);
    return cleanedFragment;
}

function wrapTextNodesInFragment(fragment, tagName, selector) {
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

function isEveryTextNodeMarked(fragment, selector) {
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

function getMarkCoverageInFragment(fragment, selector) {
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

function shouldRemoveInlineMarkFromSelection(fragment, selector) {
    const { totalTextLength, markedTextLength } = getMarkCoverageInFragment(fragment, selector);
    if (totalTextLength === 0) return false;
    if (markedTextLength === totalTextLength) return true;

    const unmarkedTextLength = totalTextLength - markedTextLength;
    const markedRatio = markedTextLength / totalTextLength;
    return markedRatio >= 0.97 && unmarkedTextLength <= 3;
}

function selectionIntersectsInlineMark(editor, range, selector) {
    if (!editor || !range || !selector) return false;
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
        try {
            return range.intersectsNode(candidateElement);
        } catch {
            return false;
        }
    });
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

function getIntersectingBlocks(editor, range) {
    const blockSelector = "p,h1,h2,h3,h4,h5,h6,li,blockquote,div,td,th";
    const blocks = [...editor.contentEditableElement.querySelectorAll(blockSelector)] as HTMLElement[];

    if (range.collapsed) {
        const anchorElement = getAnchorElement(editor);
        const blockElement = anchorElement?.closest(blockSelector) as HTMLElement | null;
        return blockElement ? [blockElement] : [];
    }

    return blocks.filter(blockElement => {
        if (!editor.contentEditableElement.contains(blockElement)) return false;
        if (blockElement.closest("pre,figure,table")) return false;
        try {
            return range.intersectsNode(blockElement);
        } catch {
            return false;
        }
    });
}

function normalizeColorStylesInElement(rootElement) {
    if (!rootElement || !rootElement.querySelectorAll) return;
    rootElement.querySelectorAll("span,font").forEach(element => {
        clearElementColorStyles(element);
    });
}

function wrapTextNodesInColorSpan(fragment, colorValue) {
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

function moveCaretOutsideMarkedElementAtRange(markedElement, range) {
    if (!markedElement || !range || !range.collapsed) return false;
    if (!markedElement.contains(range.startContainer)) return false;

    const lastChildNode = markedElement.lastChild;
    if (lastChildNode) {
        const tailRange = range.cloneRange();
        try {
            tailRange.setEndAfter(lastChildNode);
            const tailFragment = tailRange.extractContents();
            if (tailFragment.childNodes.length) {
                const tailMarkedElement = markedElement.cloneNode(false) as HTMLElement;
                tailMarkedElement.appendChild(tailFragment);
                markedElement.insertAdjacentElement("afterend", tailMarkedElement);
            }
        } catch {
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
    setSelectionRange(caretRange);
    return true;
}

function removeSelectionInsideSingleMarkedElement(range, markedElement, aliasSelector) {
    if (!range || !markedElement || range.collapsed) return false;
    const extractedFragment = range.extractContents();
    const cleanedFragment = unwrapSelectorInFragment(extractedFragment, aliasSelector);

    let insertBeforeNode = markedElement.nextSibling;
    const lastChildNode = markedElement.lastChild;
    if (lastChildNode) {
        const tailRange = range.cloneRange();
        try {
            tailRange.setEndAfter(lastChildNode);
            const tailFragment = tailRange.extractContents();
            if (tailFragment.childNodes.length) {
                const tailMarkedElement = markedElement.cloneNode(false) as HTMLElement;
                tailMarkedElement.appendChild(tailFragment);
                markedElement.insertAdjacentElement("afterend", tailMarkedElement);
                insertBeforeNode = tailMarkedElement;
            }
        } catch {
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

function toggleInlineMark(editor, tagName, aliasSelector) {
    normalizeInvalidInlineMarkContainers(editor.contentEditableElement);
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
    const selection = window.getSelection();
    const anchorMarkedElement = getClosestMarkedElement(
        selection?.anchorNode || null,
        aliasSelector,
        editor.contentEditableElement
    );
    const focusMarkedElement = getClosestMarkedElement(
        selection?.focusNode || null,
        aliasSelector,
        editor.contentEditableElement
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
            isEveryTextNodeMarked(clonedSelectionFragment, aliasSelector) ||
            shouldRemoveInlineMarkFromSelection(clonedSelectionFragment, aliasSelector) ||
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

function setAlign(editor, alignValue) {
    const range = getSelectionRange(editor);
    if (!range) return false;
    const targetBlocks = getIntersectingBlocks(editor, range);
    if (!targetBlocks.length) return false;

    let changed = false;
    targetBlocks.forEach(blockElement => {
        const isListItem = blockElement.tagName.toLowerCase() === "li";
        if (alignValue === "left") {
            if (blockElement.style.textAlign || blockElement.hasAttribute("align")) {
                blockElement.style.removeProperty("text-align");
                blockElement.removeAttribute("align");
                changed = true;
            }
            if (isListItem && blockElement.style.listStylePosition) {
                blockElement.style.removeProperty("list-style-position");
                changed = true;
            }
            return;
        }
        if (blockElement.style.textAlign !== alignValue) {
            blockElement.style.textAlign = alignValue;
            changed = true;
        }
        if (isListItem && blockElement.style.listStylePosition !== "inside") {
            blockElement.style.listStylePosition = "inside";
            changed = true;
        }
    });

    return changed;
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
                while (listItemElement.firstChild) {
                    const childNode = listItemElement.firstChild as ChildNode;
                    if (childNode.nodeType === 1 && (childNode as Element).matches("ul,ol")) {
                        if (paragraphElement.childNodes.length > 0) {
                            ensureTextAnchor(paragraphElement);
                            fragment.appendChild(paragraphElement);
                        }
                        fragment.appendChild(childNode);
                        continue;
                    }
                    paragraphElement.appendChild(childNode);
                }
                if (paragraphElement.childNodes.length > 0) {
                    ensureTextAnchor(paragraphElement);
                    fragment.appendChild(paragraphElement);
                }
            });
            if (!fragment.childNodes.length) {
                const paragraphElement = document.createElement("p");
                ensureTextAnchor(paragraphElement);
                fragment.appendChild(paragraphElement);
            }
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

function clearElementColorStyles(element) {
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

function removeForeColor(editor) {
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
            try {
                if (range.intersectsNode(candidateElement)) {
                    touchedElements.add(candidateElement);
                }
            } catch {
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

function formatBlock(editor, tagName) {
    const blockElement = getClosestBlock(editor);
    if (!blockElement) return false;
    if (blockElement.closest("pre,figure,table")) return false;
    if (blockElement.closest("li")) return false;

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

function getListItemOwnTextContent(listItemElement) {
    if (!listItemElement) return "";
    const cloneElement = listItemElement.cloneNode(true) as HTMLElement;
    cloneElement.querySelectorAll("ul,ol").forEach(listElement => listElement.remove());
    return (cloneElement.textContent || "").replace(/\u200B/g, "").trim();
}

function splitListItem(editor) {
    const range = getSelectionRange(editor);
    if (!range) return false;

    if (!range.collapsed) range.deleteContents();

    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;
    const listItemElement = anchorElement.closest("li");
    if (!listItemElement) return false;

    const listItemText = getListItemOwnTextContent(listItemElement);
    if (!listItemText.length) {
        return outdentListItem(editor);
    }

    const splitRange = getSelectionRange(editor);
    if (!splitRange) return false;

    const tailRange = splitRange.cloneRange();
    tailRange.setEndAfter(listItemElement.lastChild || listItemElement);
    const tailFragment = tailRange.extractContents();

    if (!listItemElement.textContent || !listItemElement.textContent.replace(/\u200B/g, "").length) {
        ensureTextAnchor(listItemElement);
    }

    const nextListItemElement = document.createElement("li");
    nextListItemElement.appendChild(tailFragment);
    if (!nextListItemElement.textContent || !nextListItemElement.textContent.replace(/\u200B/g, "").length) {
        ensureTextAnchor(nextListItemElement);
    }

    listItemElement.insertAdjacentElement("afterend", nextListItemElement);
    placeCaretAtNodeEnd(nextListItemElement);
    return true;
}

function outdentListItem(editor) {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;
    const listItemElement = anchorElement.closest("li");
    if (!listItemElement) return false;

    const parentListElement = listItemElement.parentElement?.closest("ul,ol");
    if (!parentListElement) return false;

    const parentListItemElement = parentListElement.parentElement?.closest("li");
    if (parentListItemElement) {
        const outerListElement = parentListItemElement.parentElement?.closest("ul,ol");
        if (!outerListElement) return false;
        outerListElement.insertBefore(listItemElement, parentListItemElement.nextSibling);
        if (!parentListElement.querySelector("li")) parentListElement.remove();
        ensureTextAnchor(listItemElement);
        placeCaretAtNodeEnd(listItemElement);
        return true;
    }

    const paragraphElement = document.createElement("p");
    const nestedListElements: HTMLElement[] = [];
    while (listItemElement.firstChild) {
        const childNode = listItemElement.firstChild as ChildNode;
        if (childNode.nodeType === 1 && (childNode as Element).matches("ul,ol")) {
            nestedListElements.push(childNode as HTMLElement);
            listItemElement.removeChild(childNode);
            continue;
        }
        paragraphElement.appendChild(childNode);
    }
    ensureTextAnchor(paragraphElement);

    parentListElement.insertAdjacentElement("afterend", paragraphElement);
    let insertionAnchorElement: HTMLElement = paragraphElement;
    nestedListElements.forEach(nestedListElement => {
        insertionAnchorElement.insertAdjacentElement("afterend", nestedListElement);
        insertionAnchorElement = nestedListElement;
    });
    listItemElement.remove();
    if (!parentListElement.querySelector("li")) parentListElement.remove();

    placeCaretAtNodeEnd(paragraphElement);
    return true;
}

function sinkListItem(editor) {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;
    const listItemElement = anchorElement.closest("li");
    if (!listItemElement) return false;

    const parentListElement = listItemElement.parentElement?.closest("ul,ol");
    if (!parentListElement) return false;

    const previousListItemElement = listItemElement.previousElementSibling as HTMLElement | null;
    if (!previousListItemElement || previousListItemElement.tagName.toLowerCase() !== "li") return false;

    const parentListTagName = parentListElement.tagName.toLowerCase();
    let nestedListElement = previousListItemElement.lastElementChild as HTMLElement | null;
    if (!nestedListElement || nestedListElement.tagName.toLowerCase() !== parentListTagName) {
        nestedListElement = document.createElement(parentListTagName);
        previousListItemElement.appendChild(nestedListElement);
    }

    nestedListElement.appendChild(listItemElement);
    ensureTextAnchor(listItemElement);
    placeCaretAtNodeEnd(listItemElement);
    return true;
}

function backspaceListItem(editor) {
    const range = getSelectionRange(editor);
    if (!range || !range.collapsed) return false;

    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;
    const listItemElement = anchorElement.closest("li");
    if (!listItemElement) return false;

    const previousListItemElement = listItemElement.previousElementSibling as HTMLElement | null;
    if (!previousListItemElement || previousListItemElement.tagName.toLowerCase() !== "li") {
        return outdentListItem(editor);
    }

    while (listItemElement.firstChild) {
        previousListItemElement.appendChild(listItemElement.firstChild);
    }
    listItemElement.remove();
    ensureTextAnchor(previousListItemElement);
    placeCaretAtNodeEnd(previousListItemElement);
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
        case "removeColor":
            return removeForeColor(editor);
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
        case "splitListItem":
            return splitListItem(editor);
        case "sinkListItem":
            return sinkListItem(editor);
        case "backspaceListItem":
            return backspaceListItem(editor);
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
