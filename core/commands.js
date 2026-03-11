import { executeFormattingCommand } from "./selection.js";

export function executeRichCommand(commandName, commandValue = null) {
    if (["bold", "italic", "underline"].includes(commandName)) {
        executeFormattingCommand(commandName, commandValue);
    } else {
        document.execCommand(commandName, false, commandValue);
    }
}
