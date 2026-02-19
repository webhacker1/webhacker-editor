import { createCommandButton } from "./createCommandButton.js";

export function createOrderedListButton(editor, t) {
    return createCommandButton(editor, {
        title: t.orderedList,
        iconClassName: "fa-solid fa-list-ol",
        commandName: "insertOrderedList",
        trackToggleState: true,
        toggleKey: "orderedList"
    });
}

