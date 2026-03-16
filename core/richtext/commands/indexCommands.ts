import { getAnchorElement } from "@/core/richtext/selection";
import { toggleInlineMark, unlinkAtSelection } from "@/core/richtext/commands/inlineMarks";
import { setAlign, formatBlock, removeFormat, getCurrentAlignState } from "@/core/richtext/commands/blockFormatting";
import { toggleList } from "@/core/richtext/commands/lists";
import { applyForeColor, removeForeColor } from "@/core/richtext/commands/color";
import { insertHtmlAtSelection, insertParagraph, insertTextAtSelection, deleteSelection } from "@/core/richtext/commands/content";
import { backspaceListItem, outdentListItem, sinkListItem, splitListItem } from "@/core/richtext/commands/listEditing";
import type { EditorCommandContext, RichCommandName, RichCommandValue } from "@/core/richtext/commands/types";

export function executeEditorCommand(
    editor: EditorCommandContext,
    commandName: RichCommandName | string,
    commandValue: RichCommandValue = null,
): boolean {
    switch (commandName) {
        case "undo":
            return editor.undoFromHistory();
        case "redo":
            return editor.redoFromHistory();
        case "bold":
            return toggleInlineMark(editor, "strong", "strong,b");
        case "italic":
            return toggleInlineMark(editor, "em", "em,i");
        case "underline":
            return toggleInlineMark(editor, "u", "u");
        case "justifyLeft":
            return setAlign(editor, "left");
        case "justifyCenter":
            return setAlign(editor, "center");
        case "justifyRight":
            return setAlign(editor, "right");
        case "insertUnorderedList":
            return toggleList(editor, "ul");
        case "insertOrderedList":
            return toggleList(editor, "ol");
        case "foreColor":
            return applyForeColor(editor, commandValue);
        case "removeColor":
            return removeForeColor(editor);
        case "formatBlock":
            return formatBlock(editor, commandValue);
        case "removeFormat":
            return removeFormat(editor);
        case "insertHTML":
            return insertHtmlAtSelection(editor, commandValue);
        case "insertText":
            return insertTextAtSelection(editor, commandValue);
        case "unlink":
            return unlinkAtSelection(editor);
        case "delete":
            return deleteSelection(editor);
        case "insertParagraph":
            return insertParagraph(editor);
        case "outdent":
            return outdentListItem(editor);
        case "splitListItem":
            return splitListItem(editor);
        case "sinkListItem":
            return sinkListItem(editor);
        case "backspaceListItem":
            return backspaceListItem(editor);
        default:
            return false;
    }
}

export function queryEditorCommandState(editor: EditorCommandContext, commandName: string): boolean {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;

    switch (commandName) {
        case "bold":
            return Boolean(anchorElement.closest("strong,b"));
        case "italic":
            return Boolean(anchorElement.closest("em,i"));
        case "underline":
            return Boolean(anchorElement.closest("u"));
        case "insertUnorderedList":
            return Boolean(anchorElement.closest("ul"));
        case "insertOrderedList":
            return Boolean(anchorElement.closest("ol"));
        case "justifyLeft":
            return getCurrentAlignState(editor) === "left";
        case "justifyCenter":
            return getCurrentAlignState(editor) === "center";
        case "justifyRight":
            return getCurrentAlignState(editor) === "right";
        default:
            return false;
    }
}

export type { EditorCommandContext, RichCommandName, RichCommandValue };
