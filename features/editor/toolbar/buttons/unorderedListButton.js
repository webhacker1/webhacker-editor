import { createCommandButton } from "./createCommandButton.js";

export function createUnorderedListButton(editor, t) {
    return createCommandButton(editor, {
        title: t.unorderedList,
        iconClassName: "fa-solid fa-list-ul",
        commandName: "insertUnorderedList",
        trackToggleState: true,
        toggleKey: "unorderedList"
    });
}

