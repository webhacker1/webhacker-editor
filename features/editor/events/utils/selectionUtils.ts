import type { EditorEventContext } from "@/features/editor/events/eventTypes";

export function isCaretAtCodeStart(codeElement: Element, selection: Selection | null): boolean {
    if (!selection || selection.rangeCount === 0) return false;
    const currentRange = selection.getRangeAt(0);
    if (!selection.isCollapsed || !codeElement.contains(currentRange.startContainer)) return false;

    const beforeCaretRange = currentRange.cloneRange();
    beforeCaretRange.selectNodeContents(codeElement);
    beforeCaretRange.setEnd(currentRange.startContainer, currentRange.startOffset);
    const beforeCaretText = beforeCaretRange.toString().replace(/\u200B/g, "");
    return beforeCaretText.length === 0;
}

export function isCaretAtElementStart(element: Element, selection: Selection | null): boolean {
    if (!selection || selection.rangeCount === 0) return false;
    const currentRange = selection.getRangeAt(0);
    if (!selection.isCollapsed || !element.contains(currentRange.startContainer)) return false;

    const beforeCaretRange = currentRange.cloneRange();
    beforeCaretRange.selectNodeContents(element);
    beforeCaretRange.setEnd(currentRange.startContainer, currentRange.startOffset);
    const beforeCaretText = beforeCaretRange.toString().replace(/\u200B/g, "");
    return beforeCaretText.length === 0;
}

function resolveListItemFromNode(node: Node | null): HTMLElement | null {
    if (!node) return null;
    if (node.nodeType === 3) return (node.parentElement?.closest("li") as HTMLElement | null) || null;
    if (node.nodeType === 1) return ((node as Element).closest("li") as HTMLElement | null) || null;
    return null;
}

export function getSelectionListItem(selection: Selection | null): HTMLElement | null {
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);

    const fromStartContainer = resolveListItemFromNode(range.startContainer);
    if (fromStartContainer) return fromStartContainer;

    if (range.startContainer.nodeType === 1) {
        const containerElement = range.startContainer as Element;
        const childNodes = containerElement.childNodes;
        const beforeNode = range.startOffset > 0 ? childNodes[range.startOffset - 1] : null;
        const afterNode = range.startOffset < childNodes.length ? childNodes[range.startOffset] : null;

        const fromBeforeNode = resolveListItemFromNode(beforeNode);
        if (fromBeforeNode) return fromBeforeNode;

        const fromAfterNode = resolveListItemFromNode(afterNode);
        if (fromAfterNode) return fromAfterNode;
    }

    return null;
}

export function getAdjacentTableCell(tableCellElement: HTMLElement | null, step: number): HTMLElement | null {
    if (!(tableCellElement instanceof HTMLTableCellElement)) return null;
    const tableElement = tableCellElement.closest("table");
    if (!tableElement) return null;

    const tableCells = [...tableElement.rows].flatMap(tableRowElement => [...tableRowElement.cells]);
    const currentCellIndex = tableCells.indexOf(tableCellElement);
    if (currentCellIndex === -1) return null;
    return (tableCells[currentCellIndex + step] as HTMLElement | undefined) || null;
}

function isMathFigureElement(element: Element | null): boolean {
    if (!element || element.nodeType !== 1) return false;
    return Boolean(
        element.matches("figure.webhacker-math, figure.webhacker-mermaid") ||
            element.querySelector("code.language-math, code.language-mermaid"),
    );
}

function findAdjacentElementFromBoundary(node: Node, direction: number, rootElement: HTMLElement): Element | null {
    let currentNode: Node | null = node;
    while (currentNode && currentNode !== rootElement) {
        const siblingNode = direction < 0 ? currentNode.previousSibling : currentNode.nextSibling;
        if (siblingNode) {
            if (siblingNode.nodeType === 1) return siblingNode as Element;
            if (siblingNode.nodeType === 3 && (siblingNode.nodeValue || "").trim().length === 0) {
                currentNode = siblingNode;
                continue;
            }
            return null;
        }
        currentNode = currentNode.parentNode;
    }
    return null;
}

export function getAdjacentElementForDelete(
    editor: EditorEventContext,
    selection: Selection | null,
    direction: number,
): Element | null {
    if (!selection || !selection.isCollapsed || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    if (!editor.contentEditableElement.contains(range.startContainer)) return null;

    const containerNode = range.startContainer;
    if (containerNode.nodeType === 3) {
        const textLength = (containerNode.nodeValue || "").length;
        if (direction < 0 && range.startOffset !== 0) return null;
        if (direction > 0 && range.startOffset !== textLength) return null;
        return findAdjacentElementFromBoundary(containerNode, direction, editor.contentEditableElement);
    }

    if (containerNode.nodeType === 1) {
        const boundaryIndex = direction < 0 ? range.startOffset - 1 : range.startOffset;
        const boundaryNode = containerNode.childNodes[boundaryIndex];
        if (boundaryNode && boundaryNode.nodeType === 1) return boundaryNode as Element;
        if (boundaryNode && boundaryNode.nodeType === 3) {
            if ((boundaryNode.nodeValue || "").trim().length > 0) return null;
            return findAdjacentElementFromBoundary(boundaryNode, direction, editor.contentEditableElement);
        }
        return findAdjacentElementFromBoundary(containerNode, direction, editor.contentEditableElement);
    }

    return null;
}

export function selectionIntersectsMathFigure(editor: EditorEventContext, selection: Selection | null): boolean {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;
    const range = selection.getRangeAt(0);
    const figureElements = [...editor.contentEditableElement.querySelectorAll("figure")].filter(figureElement =>
        figureElement.querySelector("code.language-math, code.language-mermaid"),
    );

    return figureElements.some(figureElement => range.intersectsNode(figureElement));
}

export function shouldBlockMathFigureDeletion(
    editor: EditorEventContext,
    selection: Selection | null,
    direction: number,
): boolean {
    if (selectionIntersectsMathFigure(editor, selection)) return true;
    const adjacentElement = getAdjacentElementForDelete(editor, selection, direction);
    return isMathFigureElement(adjacentElement);
}
