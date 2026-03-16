import WebHackerEditor from "@/core/indexCore";
import {
    createMinimalTable,
    ensureTextAnchorInTableCell,
    placeCaretAtTextNodeEnd,
} from "@/features/table/runtime";

let installed = false;

export function installTableFeature(WebHackerEditorClass = WebHackerEditor): void {
    if (installed) return;
    installed = true;

    WebHackerEditorClass.prototype.insertMinimalTable = function (
        rowCount = 2,
        columnCount = 2,
    ): void {
        const tableElement = createMinimalTable(rowCount, columnCount);

        const selection = window.getSelection();
        if (selection && selection.rangeCount) {
            const insertionRange = selection.getRangeAt(0);
            insertionRange.deleteContents();
            insertionRange.insertNode(tableElement);
        } else {
            this.contentEditableElement.appendChild(tableElement);
        }

        const firstCellElement = tableElement.querySelector("tbody td") as HTMLElement | null;
        if (firstCellElement) {
            const textNode = ensureTextAnchorInTableCell(firstCellElement);
            placeCaretAtTextNodeEnd(textNode);
        }

        if (typeof this.captureHistorySnapshot === "function") {
            this.captureHistorySnapshot("command");
        }
    };

    WebHackerEditorClass.prototype.ensureCaretAnchorInTableCell = function (
        cellElement: HTMLElement,
        shouldPlaceCaret = false,
    ): void {
        if (!cellElement) return;

        const textNode = ensureTextAnchorInTableCell(cellElement);
        if (shouldPlaceCaret) {
            placeCaretAtTextNodeEnd(textNode);
        }
    };

    WebHackerEditorClass.prototype.exitTableToNextLine = function (
        tableCellElement: HTMLElement | null,
    ): boolean {
        const tableElement =
            tableCellElement && tableCellElement.closest ? tableCellElement.closest("table") : null;
        if (!tableElement || !tableElement.parentNode) return false;

        const paragraphElement = document.createElement("p");
        const caretTextNode = document.createTextNode("\u200B");
        paragraphElement.appendChild(caretTextNode);
        tableElement.insertAdjacentElement("afterend", paragraphElement);

        placeCaretAtTextNodeEnd(caretTextNode);

        if (typeof this.captureHistorySnapshot === "function") {
            this.captureHistorySnapshot("command");
        }
        this.emitChange();
        this.syncToggleStates();

        return true;
    };
}
