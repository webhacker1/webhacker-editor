import type { EditorEventContext } from "@/features/editor/events/eventTypes";
import { bindClipboardEvents } from "@/features/editor/events/clipboardEvents";
import { bindInputEvents } from "@/features/editor/events/inputEvents";
import { bindKeyboardEvents } from "@/features/editor/events/keyboardEvents";
import { bindSelectionEvents } from "@/features/editor/events/selectionEvents";

let installed = false;

interface EditorWithBindMethod extends EditorEventContext {
    bindEditorEvents?: () => void;
}

export function installEditorEvents(WebHackerEditorClass: { prototype: EditorWithBindMethod }): void {
    if (installed) return;
    installed = true;

    WebHackerEditorClass.prototype.bindEditorEvents = function bindEditorEvents(): void {
        bindInputEvents(this);
        bindClipboardEvents(this);
        bindSelectionEvents(this);
        bindKeyboardEvents(this);
        this.highlightCodeBlocks();
    };
}
