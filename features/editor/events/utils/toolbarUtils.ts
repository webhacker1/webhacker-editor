import type { EditorEventContext } from "@/features/editor/events/eventTypes";

export function triggerToolbarControl(editor: EditorEventContext, controlId: string): boolean {
    const controlButtonElement = editor.toolbarElement.querySelector(
        `.webhacker-button[data-control-id="${controlId}"]`,
    ) as HTMLButtonElement | null;

    if (!controlButtonElement || controlButtonElement.disabled) return false;

    controlButtonElement.dispatchEvent(
        new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        }),
    );
    return true;
}
