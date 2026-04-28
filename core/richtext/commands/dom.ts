function setSelectionRange(range: Range | null): void {
    if (!range) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(range);
}

export function selectInsertedFragment(firstNode: ChildNode | null, lastNode: ChildNode | null): void {
    if (!firstNode || !lastNode) return;
    if (!firstNode.isConnected || !lastNode.isConnected) return;

    const range = document.createRange();
    range.setStartBefore(firstNode);
    range.setEndAfter(lastNode);
    setSelectionRange(range);
}

export function insertFragmentAndRestoreSelection(
    range: Range | null,
    fragment: DocumentFragment | null,
): boolean {
    if (!range || !fragment) return false;

    const startMarker = document.createComment("wh-range-start");
    const endMarker = document.createComment("wh-range-end");
    const wrappedFragment = document.createDocumentFragment();

    wrappedFragment.append(startMarker, fragment, endMarker);
    range.insertNode(wrappedFragment);

    const restoredRange = document.createRange();
    if (startMarker.parentNode && endMarker.parentNode) {
        restoredRange.setStartAfter(startMarker);
        restoredRange.setEndBefore(endMarker);
        setSelectionRange(restoredRange);
    }

    startMarker.remove();
    endMarker.remove();

    return true;
}

export function replaceElementTag(element: Element | null, targetTagName: string): HTMLElement | null {
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
