import { createCommandButton } from "./createCommandButton.js";

export function createAlignCenterButton(editor, t) {
    return createCommandButton(editor, {
        title: t.alignCenter,
        iconClassName: "fa-solid fa-align-center",
        commandName: "justifyCenter",
        trackToggleState: true,
        toggleKey: "alignCenter"
    });
}

