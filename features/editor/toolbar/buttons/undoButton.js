import { createCommandButton } from "./createCommandButton.js";

export function createUndoButton(editor, t) {
    return createCommandButton(editor, {
        title: t.undo,
        iconClassName: "fa-solid fa-rotate-left",
        commandName: "undo"
    });
}

