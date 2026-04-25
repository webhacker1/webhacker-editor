export interface EditorEventContext {
    contentEditableElement: HTMLElement;
    toolbarElement: HTMLElement;
    currentSavedSelectionRange: Range | null;
    saveSelectionRange: () => Range | null;
    syncToggleStates: () => void;
    ensureCaretAnchorInTableCell: (cellElement: HTMLElement, shouldPlaceCaret?: boolean) => void;
    exitTableToNextLine: (tableCellElement: HTMLElement | null) => boolean;
    exitCodeBlockToNextLine: (codeElement: HTMLElement) => boolean;
    highlightCodeAtCaret: () => void;
    highlightCodeElement: (codeElement: HTMLElement) => void;
    ensureCodeLanguageBadge: (preElement: HTMLElement | null) => void;
    highlightCodeBlocks: () => void;
    captureHistorySnapshot?: (kind?: string) => unknown;
    emitChange: () => void;
}
