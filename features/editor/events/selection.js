import { getSelectionAnchorElement } from "./utils.js";

export function bindSelectionEvents(editor) {
    ["mouseup", "keyup"].forEach(eventName => {
        editor.contentEditableElement.addEventListener(eventName, () => editor.syncToggleStates());
    });

    editor.contentEditableElement.addEventListener("mousedown", event => {
        const targetCellElement =
            event.target && event.target.closest ? event.target.closest("td,th") : null;
        if (targetCellElement) {
            editor.ensureCaretAnchorInTableCell(targetCellElement, false);
        }
    });

    editor.contentEditableElement.addEventListener("click", event => {
        const anchorElement = event.target && event.target.closest ? event.target.closest("a") : null;
        if (anchorElement) event.preventDefault();
    });

    document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const anchorNode = getSelectionAnchorElement(selection);
        if (anchorNode && editor.contentEditableElement.contains(anchorNode)) {
            editor.syncToggleStates();
            const tableCellElement = anchorNode.closest && anchorNode.closest("td,th");
            if (tableCellElement) editor.ensureCaretAnchorInTableCell(tableCellElement, false);
        }
    });
}
