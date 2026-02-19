import { createCommandButton } from "./createCommandButton.js";

export function createAlignRightButton(editor, t) {
    return createCommandButton(editor, {
        title: t.alignRight,
        iconClassName: "fa-solid fa-align-right",
        commandName: "justifyRight",
        trackToggleState: true,
        toggleKey: "alignRight"
    });
}

