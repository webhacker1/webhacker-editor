export type RichCommandValue = string | null;

export type RichCommandName =
    | "undo"
    | "redo"
    | "bold"
    | "italic"
    | "underline"
    | "justifyLeft"
    | "justifyCenter"
    | "justifyRight"
    | "insertUnorderedList"
    | "insertOrderedList"
    | "foreColor"
    | "removeColor"
    | "formatBlock"
    | "removeFormat"
    | "insertHTML"
    | "insertText"
    | "unlink"
    | "delete"
    | "insertParagraph"
    | "outdent"
    | "splitListItem"
    | "sinkListItem"
    | "backspaceListItem";

export interface EditorCommandContext {
    contentEditableElement: HTMLElement;
    undoFromHistory: () => boolean;
    redoFromHistory: () => boolean;
}
