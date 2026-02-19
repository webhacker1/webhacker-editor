import { createCommandButton } from "./createCommandButton.js";

export function createItalicButton(editor, t) {
    return createCommandButton(editor, {
        title: t.italic,
        iconClassName: "fa-solid fa-italic",
        commandName: "italic",
        trackToggleState: true,
        toggleKey: "italic"
    });
}

