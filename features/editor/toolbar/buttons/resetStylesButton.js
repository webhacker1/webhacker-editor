import { createCommandButton } from "./createCommandButton.js";

export function createResetStylesButton(editor, t) {
    return createCommandButton(editor, {
        title: t.reset_styles,
        iconClassName: "fa-solid fa-eraser",
        commandName: "removeFormat"
    });
}

