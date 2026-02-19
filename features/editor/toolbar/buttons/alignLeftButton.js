import { createCommandButton } from "./createCommandButton.js";

export function createAlignLeftButton(editor, t) {
    return createCommandButton(editor, {
        title: t.alignLeft,
        iconClassName: "fa-solid fa-align-left",
        commandName: "justifyLeft",
        trackToggleState: true,
        toggleKey: "alignLeft"
    });
}

