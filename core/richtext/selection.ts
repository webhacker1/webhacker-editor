const BLOCK_SELECTOR = "p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,figure,td,th,div";

export function getSelectionRange(editor) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);

    if (
        !editor.contentEditableElement.contains(range.startContainer) ||
        !editor.contentEditableElement.contains(range.endContainer)
    ) {
        return null;
    }

    return range;
}

export function getAnchorElement(editor) {
    const range = getSelectionRange(editor);
    if (!range) return null;
    return (range.startContainer.nodeType === 3
        ? range.startContainer.parentNode
        : range.startContainer) as HTMLElement | null;
}

export function getClosestBlock(editor) {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement || !anchorElement.closest) return null;
    const blockElement = anchorElement.closest(BLOCK_SELECTOR) as HTMLElement | null;
    if (!blockElement || blockElement === editor.contentEditableElement) return null;
    return blockElement;
}

export function placeCaretAtNodeEnd(node) {
    if (!node) return;
    const range = document.createRange();
    if (node.nodeType === 3) {
        range.setStart(node, node.nodeValue.length);
    } else {
        range.selectNodeContents(node);
        range.collapse(false);
    }
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

export function placeCaretAfterNode(node) {
    if (!node || !node.parentNode) return;
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

export function ensureTextAnchor(element) {
    if (!element) return null;
    let textNode = element.firstChild;
    if (!textNode || textNode.nodeType !== 3) {
        textNode = document.createTextNode("\u200B");
        element.insertBefore(textNode, element.firstChild || null);
    }
    if (!textNode.nodeValue.length) textNode.nodeValue = "\u200B";
    return textNode;
}
