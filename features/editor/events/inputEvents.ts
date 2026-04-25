import type { EditorEventContext } from "@/features/editor/events/eventTypes";
import { normalizeInvalidInlineMarkContainers } from "@/core/richtext/utils/indexUtils";

export function bindInputEvents(editor: EditorEventContext): void {
    editor.contentEditableElement.addEventListener("input", () => {
        const root = editor.contentEditableElement;
        Array.from(root.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE || node.nodeName === "BR") {
                const p = document.createElement("p");
                node.replaceWith(p);
                p.appendChild(node.nodeName === "BR" ? document.createElement("br") : node);

                if (node.nodeType === Node.TEXT_NODE) {
                    const range = document.createRange();
                    range.selectNodeContents(p);
                    range.collapse(false);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        });

        normalizeInvalidInlineMarkContainers(editor.contentEditableElement);
        if (typeof editor.captureHistorySnapshot === "function") {
            editor.captureHistorySnapshot("input");
        }
        requestAnimationFrame(() => editor.highlightCodeAtCaret());
        editor.emitChange();
        editor.syncToggleStates();
    });
}
