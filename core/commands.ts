import { getActiveEditor } from "./richtext/registry";
import { runEditorCommand } from "./richtext/runtime";

export function executeRichCommand(commandName, commandValue = null, editor = null) {
    const resolvedEditor = editor || getActiveEditor();
    if (!resolvedEditor) return false;
    return runEditorCommand(resolvedEditor, commandName, commandValue);
}
