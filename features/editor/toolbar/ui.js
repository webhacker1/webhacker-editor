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

function getInteractiveMenuItems(dropdownMenuElement, itemSelector = '[data-menu-item="true"]') {
    return [...dropdownMenuElement.querySelectorAll(itemSelector)].filter(itemElement => {
        if (!itemElement) return false;
        if (itemElement.disabled) return false;
        if (itemElement.getAttribute("aria-hidden") === "true") return false;
        if (itemElement.hasAttribute("hidden")) return false;
        return true;
    });
}

export function focusFirstMenuItem(dropdownMenuElement, itemSelector = '[data-menu-item="true"]') {
    const [firstItemElement] = getInteractiveMenuItems(dropdownMenuElement, itemSelector);
    if (firstItemElement) firstItemElement.focus();
}

export function bindMenuKeyboardNavigation(
    editor,
    dropdownMenuElement,
    { itemSelector = '[data-menu-item="true"]', columnsCount = 1 } = {}
) {
    if (!dropdownMenuElement || dropdownMenuElement.dataset.keyboardNavBound === "true") return;
    dropdownMenuElement.dataset.keyboardNavBound = "true";

    dropdownMenuElement.addEventListener("keydown", event => {
        if (dropdownMenuElement.classList.contains("webhacker-menu--hidden")) return;

        const menuItems = getInteractiveMenuItems(dropdownMenuElement, itemSelector);
        if (!menuItems.length) return;

        const resolvedColumnsCount = Math.max(1, Number(columnsCount) || 1);
        const activeIndex = menuItems.indexOf(document.activeElement);

        const moveFocus = offset => {
            event.preventDefault();
            const nextIndex =
                activeIndex === -1
                    ? offset < 0
                        ? menuItems.length - 1
                        : 0
                    : (activeIndex + offset + menuItems.length) % menuItems.length;
            menuItems[nextIndex].focus();
        };

        if (event.key === "Tab") {
            moveFocus(event.shiftKey ? -1 : 1);
            return;
        }
        if (event.key === "ArrowRight") {
            moveFocus(1);
            return;
        }
        if (event.key === "ArrowLeft") {
            moveFocus(-1);
            return;
        }
        if (event.key === "ArrowDown") {
            moveFocus(resolvedColumnsCount);
            return;
        }
        if (event.key === "ArrowUp") {
            moveFocus(-resolvedColumnsCount);
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            if (document.activeElement && menuItems.includes(document.activeElement)) {
                event.preventDefault();
                document.activeElement.click();
            }
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            editor.closeAllMenus();
            editor.contentEditableElement.focus();
            editor.restoreSelectionRange(editor.currentSavedSelectionRange);
        }
    });
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
        if (typeof editor.highlightCodeBlocks === "function") editor.highlightCodeBlocks();

        editor.emitChange();
        editor.syncToggleStates();

        window.scrollTo(0, scrollY);
    };
}
