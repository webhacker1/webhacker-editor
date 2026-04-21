const BLOCK_SELECTOR = "p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,figure,td,th,div";

export function getSelectionAnchorElement(selection = window.getSelection()) {
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

export function placeCaretAfterElement(element) {
    if (!element || !element.parentNode) return;
    const range = document.createRange();
    range.setStartAfter(element);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

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
    return anchorElement.closest(BLOCK_SELECTOR) as HTMLElement | null;
}

export function splitBlockAtCaret(editor, newElement: HTMLElement): void {
    const currentBlock = getClosestBlock(editor);
    const range = getSelectionRange(editor);

    if (!currentBlock || !range || currentBlock === editor.contentEditableElement) return;

    range.deleteContents();

    const afterRange = document.createRange();
    afterRange.setStart(range.endContainer, range.endOffset);
    if (currentBlock.lastChild) afterRange.setEndAfter(currentBlock.lastChild);
    else afterRange.setEnd(currentBlock, 0);

    const afterFragment = afterRange.extractContents();
    const isEmpty = afterFragment.textContent === "" && !afterFragment.querySelector("br, img");
    newElement.appendChild(isEmpty ? document.createElement("br") : afterFragment);

    currentBlock.after(newElement);
}
