export function executeRichCommand(commandName, commandValue = null) {
    document.execCommand(commandName, false, commandValue);
}
