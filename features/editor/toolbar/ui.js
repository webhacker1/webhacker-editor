import { createElement } from "../../../ui/elements.js";

export function createSeparator() {
    return createElement("div", "webhacker-toolbar__separator");
}

export function createToolbarButton(
    editor,
    { iconClassName, buttonTitleText, onClickHandler, trackToggleState = false, toggleKey = null }
) {
    const buttonElement = createElement("button", "webhacker-button", {
        type: "button",
        "aria-label": buttonTitleText,
        "data-tooltip": buttonTitleText
    });
    const iconElement = createElement("i", iconClassName);
    buttonElement.appendChild(iconElement);
    buttonElement.addEventListener("mousedown", event => event.preventDefault());
    buttonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const scrollY = window.scrollY;
        editor.contentEditableElement.focus();
        onClickHandler();
        editor.emitChange();
        editor.syncToggleStates();
        window.scrollTo(0, scrollY);
    });
    if (trackToggleState && toggleKey) editor.trackedToggleButtonsMap[toggleKey] = buttonElement;
    return buttonElement;
}

export function createDropdown(editor, triggerIconClassName, triggerTitleText) {
    const dropdownWrapperElement = createElement("div", "webhacker-dropdown");
    const triggerButtonElement = createToolbarButton(editor, {
        iconClassName: triggerIconClassName,
        buttonTitleText: triggerTitleText,
        onClickHandler: () => {}
    });
    const dropdownMenuElement = createElement("div", "webhacker-menu webhacker-menu--hidden");
    triggerButtonElement.addEventListener("click", () => {
        editor.currentSavedSelectionRange = editor.saveSelectionRange();
        editor.toggleMenu(dropdownMenuElement);
    });
    dropdownWrapperElement.append(triggerButtonElement, dropdownMenuElement);
    return { dropdownWrapperElement, dropdownMenuElement };
}

export function createMenuAction(editor, actionCallback) {
    return event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const scrollY = window.scrollY;

        editor.closeAllMenus();
        editor.contentEditableElement.focus();
        editor.restoreSelectionRange(editor.currentSavedSelectionRange);

        if (actionCallback) actionCallback();

        editor.emitChange();
        editor.syncToggleStates();

        window.scrollTo(0, scrollY);
    };
}
