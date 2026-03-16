import type { EditorEventContext } from "@/features/editor/events/eventTypes";
import { normalizeInvalidInlineMarkContainers } from "@/core/richtext/utils/indexUtils";

export function bindInputEvents(editor: EditorEventContext): void {
    editor.contentEditableElement.addEventListener("input", () => {
        normalizeInvalidInlineMarkContainers(editor.contentEditableElement);
        if (typeof editor.captureHistorySnapshot === "function") {
            editor.captureHistorySnapshot("input");
        }
        requestAnimationFrame(() => editor.highlightCodeAtCaret());
        editor.emitChange();
        editor.syncToggleStates();
    });
}
