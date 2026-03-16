import {
    KEY_ARROW_DOWN,
    KEY_ARROW_LEFT,
    KEY_ARROW_RIGHT,
    KEY_ARROW_UP,
    KEY_ENTER,
    KEY_ESCAPE,
    KEY_SPACE,
    KEY_TAB
} from "@/constants/indexConstants";
import { createElement } from "@/ui/indexUi";

export function createSeparator() {
    return createElement("div", "webhacker-toolbar__separator");
}

export function isRangeInsideEditor(editor, range) {
    return (
        Boolean(range) &&
        editor.contentEditableElement.contains(range.startContainer) &&
        editor.contentEditableElement.contains(range.endContainer)
    );
}

export function getActiveSelectionRangeInEditor(editor) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    return isRangeInsideEditor(editor, range) ? range : null;
}

export function focusEditorContent(editor) {
    editor.contentEditableElement.focus({ preventScroll: true });
}

export function ensureValidSelectionInEditor(editor) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const activeRange = selection.getRangeAt(0);
        if (isRangeInsideEditor(editor, activeRange)) return activeRange;
    }

    const savedRange = editor.currentSavedSelectionRange;
    if (savedRange && isRangeInsideEditor(editor, savedRange)) {
        editor.restoreSelectionRange(savedRange);
        const restoredSelection = window.getSelection();
        if (restoredSelection && restoredSelection.rangeCount > 0) {
            const restoredRange = restoredSelection.getRangeAt(0);
            if (isRangeInsideEditor(editor, restoredRange)) return restoredRange;
        }
    }

    const fallbackRange = document.createRange();
    const fallbackAnchorNode =
        editor.contentEditableElement.lastChild || editor.contentEditableElement;
    if (fallbackAnchorNode.nodeType === 3) {
        fallbackRange.setStart(
            fallbackAnchorNode,
            (fallbackAnchorNode.nodeValue || "").length
        );
        fallbackRange.collapse(true);
    } else {
        fallbackRange.selectNodeContents(fallbackAnchorNode);
        fallbackRange.collapse(false);
    }
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(fallbackRange);
    }
    editor.currentSavedSelectionRange = fallbackRange.cloneRange();
    return fallbackRange;
}

export function createToolbarButton(
    editor,
    {
        iconClassName,
        buttonTitleText,
        onClickHandler,
        trackToggleState = false,
        toggleKey = null,
        focusEditorBeforeClick = true,
        restoreSelectionBeforeClick = true,
        emitChangeAfterClick = true
    }
) {
    const buttonElement = createElement("button", "webhacker-button", {
        type: "button",
        "aria-label": buttonTitleText,
        "data-tooltip": buttonTitleText
    });
    const iconElement = createElement("i", iconClassName);
    buttonElement.appendChild(iconElement);
    buttonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        const activeRangeInEditor = getActiveSelectionRangeInEditor(editor);
        if (activeRangeInEditor) {
            editor.currentSavedSelectionRange = activeRangeInEditor.cloneRange();
        }
    });
    buttonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const scrollY = window.scrollY;
        const activeRangeInEditor = getActiveSelectionRangeInEditor(editor);
        const shouldPreserveExpandedSelection =
            Boolean(activeRangeInEditor) && !activeRangeInEditor.collapsed;
        if (focusEditorBeforeClick && !shouldPreserveExpandedSelection) {
            focusEditorContent(editor);
        }
        if (restoreSelectionBeforeClick) ensureValidSelectionInEditor(editor);
        const result = onClickHandler();
        if (emitChangeAfterClick && result !== false) editor.emitChange();
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
        onClickHandler: () => true,
        focusEditorBeforeClick: false,
        restoreSelectionBeforeClick: false,
        emitChangeAfterClick: false
    });
    const dropdownMenuElement = createElement("div", "webhacker-menu webhacker-menu--hidden");
    triggerButtonElement.addEventListener("click", () => {
        ensureValidSelectionInEditor(editor);
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
        const activeElement = document.activeElement as HTMLElement | null;
        const isTypingFieldFocused =
            Boolean(activeElement) &&
            (activeElement.tagName === "INPUT" ||
                activeElement.tagName === "TEXTAREA" ||
                activeElement.isContentEditable);

        if (isTypingFieldFocused && event.key !== KEY_ESCAPE) return;

        const resolvedColumnsCount = Math.max(1, Number(columnsCount) || 1);
        const activeIndex = menuItems.indexOf(activeElement);

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

        if (event.key === KEY_TAB) {
            moveFocus(event.shiftKey ? -1 : 1);
            return;
        }
        if (event.key === KEY_ARROW_RIGHT) {
            moveFocus(1);
            return;
        }
        if (event.key === KEY_ARROW_LEFT) {
            moveFocus(-1);
            return;
        }
        if (event.key === KEY_ARROW_DOWN) {
            moveFocus(resolvedColumnsCount);
            return;
        }
        if (event.key === KEY_ARROW_UP) {
            moveFocus(-resolvedColumnsCount);
            return;
        }
        if (event.key === KEY_ENTER || event.key === KEY_SPACE) {
            if (document.activeElement && menuItems.includes(document.activeElement)) {
                event.preventDefault();
                (document.activeElement as HTMLElement).click();
            }
            return;
        }
        if (event.key === KEY_ESCAPE) {
            event.preventDefault();
            editor.closeAllMenus();
            focusEditorContent(editor);
            ensureValidSelectionInEditor(editor);
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
        focusEditorContent(editor);
        ensureValidSelectionInEditor(editor);

        const actionResult = actionCallback ? actionCallback() : true;
        if (actionResult !== false) {
            if (typeof editor.highlightCodeBlocks === "function") editor.highlightCodeBlocks();
            if (typeof editor.captureHistorySnapshot === "function") {
                editor.captureHistorySnapshot("command");
            }
            editor.emitChange();
        }
        editor.syncToggleStates();

        window.scrollTo(0, scrollY);
    };
}
