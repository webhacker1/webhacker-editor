import { getSelectionAnchorElement } from "@/features/editor/selection";
import type { EditorEventContext } from "@/features/editor/events/eventTypes";

export function bindSelectionEvents(editor: EditorEventContext): void {
    ["mouseup", "keyup"].forEach(eventName => {
        editor.contentEditableElement.addEventListener(eventName, () => {
            editor.currentSavedSelectionRange = editor.saveSelectionRange();
            editor.syncToggleStates();
        });
    });

    editor.contentEditableElement.addEventListener("mousedown", event => {
        if (!(event.target instanceof Element)) return;
        const targetCellElement = event.target.closest("td,th");
        if (targetCellElement instanceof HTMLElement) {
            editor.ensureCaretAnchorInTableCell(targetCellElement, false);
        }
    });

    editor.contentEditableElement.addEventListener("click", event => {
        if (!(event.target instanceof Element)) return;
        const anchorElement = event.target.closest("a");
        if (anchorElement) event.preventDefault();
    });

    document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const anchorNode = getSelectionAnchorElement(selection);
        if (anchorNode && editor.contentEditableElement.contains(anchorNode)) {
            editor.currentSavedSelectionRange = editor.saveSelectionRange();
            editor.syncToggleStates();
            const tableCellElement = anchorNode.closest && anchorNode.closest("td,th");
            if (tableCellElement instanceof HTMLElement) {
                editor.ensureCaretAnchorInTableCell(tableCellElement, false);
            }
        }
    });
}
