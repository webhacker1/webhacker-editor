import { RichTextHistory } from "./history";
import { executeEditorCommand } from "./commands";

export function initEditorRuntime(editor) {
    editor.__richTextHistory = new RichTextHistory(editor.contentEditableElement.innerHTML || "");
}

export function captureHistorySnapshot(editor, kind = "command") {
    if (!editor.__richTextHistory) return false;
    return editor.__richTextHistory.record(editor.contentEditableElement.innerHTML || "", kind);
}

export function resetHistory(editor) {
    if (!editor.__richTextHistory) return;
    editor.__richTextHistory.reset(editor.contentEditableElement.innerHTML || "");
}

export function undoFromHistory(editor) {
    if (!editor.__richTextHistory) return false;
    const htmlValue = editor.__richTextHistory.undo();
    if (htmlValue === null) return false;
    editor.contentEditableElement.innerHTML = htmlValue;
    if (typeof editor.highlightCodeBlocks === "function") editor.highlightCodeBlocks();
    return true;
}

export function redoFromHistory(editor) {
    if (!editor.__richTextHistory) return false;
    const htmlValue = editor.__richTextHistory.redo();
    if (htmlValue === null) return false;
    editor.contentEditableElement.innerHTML = htmlValue;
    if (typeof editor.highlightCodeBlocks === "function") editor.highlightCodeBlocks();
    return true;
}

export function runEditorCommand(editor, commandName, commandValue = null) {
    const result = executeEditorCommand(editor, commandName, commandValue);
    const shouldSkipHistoryRecord = commandName === "undo" || commandName === "redo";
    if (result && !shouldSkipHistoryRecord) {
        captureHistorySnapshot(editor, "command");
    }
    return result;
}
