import { createCommandButton } from "./createCommandButton.js";

export function createRedoButton(editor, t) {
    return createCommandButton(editor, {
        title: t.redo,
        iconClassName: "fa-solid fa-rotate-right",
        commandName: "redo"
    });
}

