import WebHackerEditor from "../../core/WebHackerEditor.js";

WebHackerEditor.prototype.insertMinimalTable = function (rowCount = 2, columnCount = 2) {
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

    const selection = window.getSelection();
    if (selection && selection.rangeCount) {
        const insertionRange = selection.getRangeAt(0);
        insertionRange.deleteContents();
        insertionRange.insertNode(tableElement);
    } else {
        this.contentEditableElement.appendChild(tableElement);
    }

    const firstCellElement = tableElement.querySelector("tbody td");
    if (firstCellElement) {
        if (firstCellElement.childNodes.length === 0) {
            firstCellElement.appendChild(document.createTextNode("\u200B"));
        }
        const caretTextNode = firstCellElement.firstChild;
        const selectionRange = document.createRange();
        selectionRange.setStart(caretTextNode, caretTextNode.nodeValue.length);
        selectionRange.collapse(true);
        const windowSelection = window.getSelection();
        windowSelection.removeAllRanges();
        windowSelection.addRange(selectionRange);
    }
};

WebHackerEditor.prototype.ensureCaretAnchorInTableCell = function (
    cellElement,
    shouldPlaceCaret = false
) {
    if (!cellElement) return;

    let textNode = cellElement.firstChild;
    if (!textNode || textNode.nodeType !== 3) {
        textNode = document.createTextNode("\u200B");
        cellElement.insertBefore(textNode, cellElement.firstChild || null);
    } else if (textNode.nodeValue.length === 0) {
        textNode.nodeValue = "\u200B";
    }

    if (shouldPlaceCaret) {
        const selectionRange = document.createRange();
        selectionRange.setStart(textNode, textNode.nodeValue.length);
        selectionRange.collapse(true);
        const windowSelection = window.getSelection();
        windowSelection.removeAllRanges();
        windowSelection.addRange(selectionRange);
    }
};
