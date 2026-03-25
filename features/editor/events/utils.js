export function getSelectionAnchorElement(selection) {
    if (!selection) return null;
    return selection.anchorNode && selection.anchorNode.nodeType === 3
        ? selection.anchorNode.parentNode
        : selection.anchorNode;
}

