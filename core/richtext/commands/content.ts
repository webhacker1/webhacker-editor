import { getSelectionRange, placeCaretAfterNode } from "@/core/richtext/selection";
import type { EditorCommandContext } from "@/core/richtext/commands/types";

export function insertHtmlAtSelection(editor: EditorCommandContext, htmlValue: string | null): boolean {
    const range = getSelectionRange(editor);
    if (!range) return false;

    range.deleteContents();
    const fragment = range.createContextualFragment(String(htmlValue || ""));
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);

    if (lastNode) placeCaretAfterNode(lastNode);

    return true;
}

export function insertTextAtSelection(editor: EditorCommandContext, textValue: string | null): boolean {
    const range = getSelectionRange(editor);
    if (!range) return false;

    range.deleteContents();
    const textNode = document.createTextNode(String(textValue || ""));
    range.insertNode(textNode);

    const selection = window.getSelection();
    if (!selection) return false;

    const caretRange = document.createRange();
    caretRange.setStartAfter(textNode);
    caretRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(caretRange);

    return true;
}

export function deleteSelection(editor: EditorCommandContext): boolean {
    const range = getSelectionRange(editor);
    if (!range) return false;

    range.deleteContents();
    return true;
}

export function insertParagraph(editor: EditorCommandContext): boolean {
    return insertHtmlAtSelection(editor, "<p>\u200B</p>");
}
