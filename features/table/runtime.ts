export function createMinimalTable(rowCount = 2, columnCount = 2): HTMLTableElement {
    const tableElement = document.createElement("table");
    tableElement.className = "wh-table";

    const tableBodyElement = document.createElement("tbody");
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        const bodyRowElement = document.createElement("tr");
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
            const bodyCellElement = document.createElement("td");
            bodyRowElement.appendChild(bodyCellElement);
        }
        tableBodyElement.appendChild(bodyRowElement);
    }

    tableElement.appendChild(tableBodyElement);
    return tableElement;
}

export function ensureTextAnchorInTableCell(cellElement: HTMLElement): Text {
    let textNode = cellElement.firstChild;

    if (!textNode || textNode.nodeType !== 3) {
        textNode = document.createTextNode("\u200B");
        cellElement.insertBefore(textNode, cellElement.firstChild || null);
    } else if (textNode.nodeValue.length === 0) {
        textNode.nodeValue = "\u200B";
    }

    return textNode as Text;
}

export function placeCaretAtTextNodeEnd(textNode: Text): void {
    const selectionRange = document.createRange();
    selectionRange.setStart(textNode, textNode.nodeValue.length);
    selectionRange.collapse(true);

    const windowSelection = window.getSelection();
    if (!windowSelection) return;

    windowSelection.removeAllRanges();
    windowSelection.addRange(selectionRange);
}
