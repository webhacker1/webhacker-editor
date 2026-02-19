export function getSelectionAnchorElement() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const node = selection.anchorNode;
    return node && node.nodeType === 3 ? node.parentNode : node;
}

export function placeCaretInElement(element) {
    const selectionRange = document.createRange();
    selectionRange.selectNodeContents(element);
    selectionRange.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(selectionRange);
}
