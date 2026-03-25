import { createCommandButton } from "./createCommandButton.js";

export function createBoldButton(editor, t) {
    return createCommandButton(editor, {
        title: t.bold,
        iconClassName: "fa-solid fa-bold",
        commandName: "bold",
        trackToggleState: true,
        toggleKey: "bold"
    });
}

