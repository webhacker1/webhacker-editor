import { executeRichCommand } from "../../../../core/commands.js";
import { createToolbarButton } from "../ui.js";

export function createCommandButton(
    editor,
    { title, iconClassName, commandName, commandValue = null, trackToggleState = false, toggleKey = null }
) {
    return createToolbarButton(editor, {
        iconClassName,
        buttonTitleText: title,
        onClickHandler: () => {
            executeRichCommand(commandName, commandValue);
            if (typeof editor.highlightCodeBlocks === "function") editor.highlightCodeBlocks();
        },
        trackToggleState,
        toggleKey
    });
}
