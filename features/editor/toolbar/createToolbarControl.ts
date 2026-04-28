import { createCommandControl } from "@/features/editor/toolbar/controls/indexToolbarControls";
import { createCustomControl } from "@/features/editor/toolbar/controls/customControl";

export function createToolbarControl(controlId, editor, t) {
    const commandControl = createCommandControl(controlId, editor, t);
    if (commandControl) return commandControl;

    const customControl = createCustomControl(controlId, editor, t);
    if (!customControl) throw new Error(`Unknown toolbar control: ${controlId}`);
    return customControl;
}
