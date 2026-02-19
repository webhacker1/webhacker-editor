import { createCommandButton } from "./createCommandButton.js";

export function createUnderlineButton(editor, t) {
    return createCommandButton(editor, {
        title: t.underline,
        iconClassName: "fa-solid fa-underline",
        commandName: "underline",
        trackToggleState: true,
        toggleKey: "underline"
    });
}

