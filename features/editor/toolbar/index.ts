import { createElement } from "../../../ui/elements";
import { executeRichCommand } from "../../../core/commands";
import { DEFAULT_TEXT_PRESET_COLORS } from "../../../constants/colors";
import { escapeHtml, ensureSafeUrl } from "../../../sanitize/utils";
import { SHORTCUT_ACTIONS, formatShortcutList } from "../shortcuts";
import { getSelectionAnchorElement, placeCaretInElement } from "../selection";
import { normalizeMathLatexValue, renderMathLatexToHtml } from "../../math/index";
import { normalizeMermaidSourceValue, renderMermaidSourceToHtml } from "../../mermaid/index";

const MATH_DOCS_URL = "https://en.wikibooks.org/wiki/LaTeX/Mathematics";
const MERMAID_DOCS_URL = "https://mermaid.js.org/intro/syntax-reference.html";

const TOOLBAR_LAYOUT: Array<"separator" | string[]> = [
    ["undo", "redo"],
    "separator",
    ["bold", "italic", "underline", "code", "math", "mermaid", "color", "link", "imageDisabled"],
    "separator",
    ["heading"],
    "separator",
    ["alignLeft", "alignCenter", "alignRight"],
    "separator",
    ["unorderedList", "orderedList", "table"],
    "separator",
    ["resetStyles", "shortcutsHelp"]
];

const COMMAND_CONTROLS = {
    undo: {
        title: t => t.undo,
        iconClassName: "fa-solid fa-rotate-left",
        commandName: "undo"
    },
    redo: {
        title: t => t.redo,
        iconClassName: "fa-solid fa-rotate-right",
        commandName: "redo"
    },
    bold: {
        title: t => t.bold,
        iconClassName: "fa-solid fa-bold",
        commandName: "bold",
        trackToggleState: true,
        toggleKey: "bold"
    },
    italic: {
        title: t => t.italic,
        iconClassName: "fa-solid fa-italic",
        commandName: "italic",
        trackToggleState: true,
        toggleKey: "italic"
    },
    underline: {
        title: t => t.underline,
        iconClassName: "fa-solid fa-underline",
        commandName: "underline",
        trackToggleState: true,
        toggleKey: "underline"
    },
    alignLeft: {
        title: t => t.alignLeft,
        iconClassName: "fa-solid fa-align-left",
        commandName: "justifyLeft",
        trackToggleState: true,
        toggleKey: "alignLeft"
    },
    alignCenter: {
        title: t => t.alignCenter,
        iconClassName: "fa-solid fa-align-center",
        commandName: "justifyCenter",
        trackToggleState: true,
        toggleKey: "alignCenter"
    },
    alignRight: {
        title: t => t.alignRight,
        iconClassName: "fa-solid fa-align-right",
        commandName: "justifyRight",
        trackToggleState: true,
        toggleKey: "alignRight"
    },
    unorderedList: {
        title: t => t.unorderedList,
        iconClassName: "fa-solid fa-list-ul",
        commandName: "insertUnorderedList",
        trackToggleState: true,
        toggleKey: "unorderedList"
    },
    orderedList: {
        title: t => t.orderedList,
        iconClassName: "fa-solid fa-list-ol",
        commandName: "insertOrderedList",
        trackToggleState: true,
        toggleKey: "orderedList"
    },
    resetStyles: {
        title: t => t.reset_styles,
        iconClassName: "fa-solid fa-eraser",
        commandName: "removeFormat"
    }
};

function createSeparator() {
    return createElement("div", "webhacker-toolbar__separator");
}

function isRangeInsideEditor(editor, range) {
    return (
        Boolean(range) &&
        editor.contentEditableElement.contains(range.startContainer) &&
        editor.contentEditableElement.contains(range.endContainer)
    );
}

function getActiveSelectionRangeInEditor(editor) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    return isRangeInsideEditor(editor, range) ? range : null;
}

function focusEditorContent(editor) {
    try {
        editor.contentEditableElement.focus({ preventScroll: true });
    } catch {
        editor.contentEditableElement.focus();
    }
}

function ensureValidSelectionInEditor(editor) {
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

function createToolbarButton(
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

function createDropdown(editor, triggerIconClassName, triggerTitleText) {
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

function focusFirstMenuItem(dropdownMenuElement, itemSelector = '[data-menu-item="true"]') {
    const [firstItemElement] = getInteractiveMenuItems(dropdownMenuElement, itemSelector);
    if (firstItemElement) firstItemElement.focus();
}

function bindMenuKeyboardNavigation(
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

        if (isTypingFieldFocused && event.key !== "Escape") return;

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
                (document.activeElement as HTMLElement).click();
            }
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            editor.closeAllMenus();
            focusEditorContent(editor);
            ensureValidSelectionInEditor(editor);
        }
    });
}

function createMenuAction(editor, actionCallback) {
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

function createCommandControl(controlId, editor, t) {
    const controlDefinition = COMMAND_CONTROLS[controlId];
    if (!controlDefinition) return null;

    return createToolbarButton(editor, {
        iconClassName: controlDefinition.iconClassName,
        buttonTitleText: controlDefinition.title(t),
        onClickHandler: () => {
            const result = executeRichCommand(controlDefinition.commandName, null, editor);
            if (typeof editor.highlightCodeBlocks === "function") editor.highlightCodeBlocks();
            return result;
        },
        trackToggleState: Boolean(controlDefinition.trackToggleState),
        toggleKey: controlDefinition.toggleKey || null
    });
}

function createImageDisabledButton(_editor, t) {
    const buttonElement = createElement("button", "webhacker-button", {
        type: "button",
        "aria-label": `${t.image} (${t.soon})`,
        "aria-disabled": "true",
        "data-tooltip": t.soon
    });
    const iconWrapElement = createElement("span", "webhacker-button__icon-lock");
    const imageIconElement = createElement("i", "fa-solid fa-image");
    const lockIconElement = createElement("i", "fa-solid fa-lock");
    lockIconElement.setAttribute("aria-hidden", "true");
    iconWrapElement.append(imageIconElement, lockIconElement);
    buttonElement.appendChild(iconWrapElement);
    buttonElement.disabled = true;
    return buttonElement;
}

function createColorDropdown(editor, t) {
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-palette",
        t.color
    );
    const colorContainerElement = createElement("div", "webhacker-color");
    const swatchesContainerElement = createElement("div", "webhacker-color__swatches");

    DEFAULT_TEXT_PRESET_COLORS.forEach(hexColor => {
        const swatchButtonElement = createElement("button", "webhacker-swatch", {
            type: "button",
            "data-color": hexColor,
            "data-menu-item": "true",
            title: hexColor
        });
        swatchButtonElement.style.background = hexColor;
        swatchButtonElement.addEventListener(
            "click",
            createMenuAction(editor, () => executeRichCommand("foreColor", hexColor, editor))
        );
        swatchesContainerElement.appendChild(swatchButtonElement);
    });

    const clearColorButtonElement = createElement("button", "webhacker-button webhacker-button--ghost", {
        type: "button",
        "data-menu-item": "true",
        "data-tooltip": t.clearColor
    });
    clearColorButtonElement.innerHTML = '<i class="fa-solid fa-eraser"></i>';
    clearColorButtonElement.addEventListener(
        "click",
        createMenuAction(editor, () => executeRichCommand("removeColor", null, editor))
    );

    colorContainerElement.append(swatchesContainerElement, clearColorButtonElement);
    dropdownMenuElement.appendChild(colorContainerElement);

    bindMenuKeyboardNavigation(editor, dropdownMenuElement, { columnsCount: 5 });
    dropdownWrapperElement.querySelector(".webhacker-button").addEventListener("click", () => {
        if (!dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            focusFirstMenuItem(dropdownMenuElement);
        }
    });

    return dropdownWrapperElement;
}

function createHeadingDropdown(editor, t) {
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-heading",
        t.headings
    );
    dropdownMenuElement.classList.add("webhacker-menu--select");

    [
        { label: t.paragraph, tag: "p" },
        { label: "H1", tag: "h1" },
        { label: "H2", tag: "h2" },
        { label: "H3", tag: "h3" }
    ].forEach(({ label, tag }) => {
        const menuItemElement = createElement("button", "webhacker-menu__item", {
            type: "button",
            "data-menu-item": "true"
        });
        const labelElement = createElement("span", "webhacker-menu__item-label");
        labelElement.textContent = label;
        menuItemElement.appendChild(labelElement);
        menuItemElement.addEventListener("mousedown", event => event.preventDefault());
        menuItemElement.addEventListener(
            "click",
            createMenuAction(editor, () => executeRichCommand("formatBlock", tag.toUpperCase(), editor))
        );
        dropdownMenuElement.appendChild(menuItemElement);
    });

    bindMenuKeyboardNavigation(editor, dropdownMenuElement, { columnsCount: 1 });
    dropdownWrapperElement.querySelector(".webhacker-button").addEventListener("click", () => {
        if (!dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            focusFirstMenuItem(dropdownMenuElement);
        }
    });

    return dropdownWrapperElement;
}

function createLinkDropdown(editor, t) {
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-link",
        t.link
    );
    const linkFormElement = createElement("div", "webhacker-form");
    const linkUrlInputElement = createElement("input", "webhacker-input", {
        type: "text",
        placeholder: t.linkPlaceholder,
        "data-menu-item": "true"
    });
    const linkTextInputElement = createElement("input", "webhacker-input", {
        type: "text",
        placeholder: t.linkTextPlaceholder,
        "data-menu-item": "true"
    });
    const linkActionsRowElement = createElement("div", "webhacker-actions");
    const linkConfirmButtonElement = createElement("button", "webhacker-button webhacker-button--primary", {
        type: "button",
        "data-menu-item": "true"
    });
    linkConfirmButtonElement.textContent = t.ok;
    const linkRemoveButtonElement = createElement("button", "webhacker-button webhacker-button--ghost", {
        type: "button",
        "data-menu-item": "true"
    });
    linkRemoveButtonElement.textContent = t.remove;
    linkActionsRowElement.append(linkConfirmButtonElement, linkRemoveButtonElement);
    linkFormElement.append(linkUrlInputElement, linkTextInputElement, linkActionsRowElement);
    dropdownMenuElement.appendChild(linkFormElement);
    let targetLinkElement = null;

    const resolveSelectedLinkElement = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        if (!isRangeInsideEditor(editor, range)) return null;

        let node = selection.anchorNode;
        if (node && node.nodeType === 3) node = node.parentNode;
        const anchorElement = node && node.closest ? node.closest("a") : null;
        return anchorElement && editor.contentEditableElement.contains(anchorElement)
            ? anchorElement
            : null;
    };

    const linkTriggerButtonElement = dropdownWrapperElement.querySelector(".webhacker-button");
    linkTriggerButtonElement.addEventListener("click", () => {
        ensureValidSelectionInEditor(editor);
        targetLinkElement = resolveSelectedLinkElement();
        const selection = window.getSelection();

        linkUrlInputElement.value = targetLinkElement ? targetLinkElement.getAttribute("href") ?? "" : "";
        linkTextInputElement.value = targetLinkElement
            ? targetLinkElement.textContent ?? ""
            : selection && !selection.isCollapsed
              ? selection.toString()
              : "";

        if (!dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            focusFirstMenuItem(dropdownMenuElement);
        }
    });

    const submitLinkByEnter = event => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        event.stopPropagation();
        linkConfirmButtonElement.click();
    };
    linkUrlInputElement.addEventListener("keydown", submitLinkByEnter);
    linkTextInputElement.addEventListener("keydown", submitLinkByEnter);

    linkConfirmButtonElement.addEventListener(
        "click",
        createMenuAction(editor, () => {
            let hrefValue = linkUrlInputElement.value.trim();
            const labelValue = linkTextInputElement.value.trim();
            if (!hrefValue) return false;
            hrefValue = ensureSafeUrl(hrefValue);

            if (targetLinkElement && editor.contentEditableElement.contains(targetLinkElement)) {
                targetLinkElement.setAttribute("href", hrefValue);
                targetLinkElement.setAttribute("target", "_blank");
                targetLinkElement.setAttribute("rel", "noopener noreferrer");
                if (labelValue) targetLinkElement.textContent = labelValue;
                targetLinkElement = null;
                return true;
            }

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return false;
            const visibleText = selection.isCollapsed ? hrefValue : selection.toString();
            executeRichCommand(
                "insertHTML",
                `<a href="${hrefValue}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                    labelValue || visibleText
                )}</a>`,
                editor
            );
            targetLinkElement = null;
            return true;
        })
    );

    linkRemoveButtonElement.addEventListener(
        "click",
        createMenuAction(editor, () => {
            if (targetLinkElement && editor.contentEditableElement.contains(targetLinkElement)) {
                codeUnwrapElementKeepChildren(targetLinkElement);
                targetLinkElement = null;
            } else {
                const result = executeRichCommand("unlink", null, editor);
                if (!result) return false;
            }
            linkUrlInputElement.value = "";
            linkTextInputElement.value = "";
            return true;
        })
    );

    bindMenuKeyboardNavigation(editor, dropdownMenuElement, { columnsCount: 1 });

    return dropdownWrapperElement;
}

function codeUnwrapElementKeepChildren(element) {
    if (!element || !element.parentNode) return;
    const parentElement = element.parentNode;
    while (element.firstChild) parentElement.insertBefore(element.firstChild, element);
    parentElement.removeChild(element);
}

function codeReplacePreWithPlainText(editor, preElement, plainTextValue) {
    const lines = String(plainTextValue).split(/\r?\n/);
    const htmlValue = lines.map(line => escapeHtml(line)).join("<br>");

    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNode(preElement);
    selection.removeAllRanges();
    selection.addRange(range);
    executeRichCommand("insertHTML", htmlValue, editor);
}

function normalizeInlineCodeText(value) {
    return String(value).replace(/\u200B/g, "").replace(/\r?\n+/g, " ");
}

function toggleInlineCode(editor) {
    const anchorElement = getSelectionAnchorElement();
    const nearestCodeElement = anchorElement && anchorElement.closest ? anchorElement.closest("code") : null;
    const isInsideCodeBlock =
        nearestCodeElement && nearestCodeElement.closest ? nearestCodeElement.closest("pre") : null;

    if (nearestCodeElement && !isInsideCodeBlock) {
        codeUnwrapElementKeepChildren(nearestCodeElement);
        return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const codeElement = document.createElement("code");

    if (!selection.isCollapsed) {
        const selectedText = normalizeInlineCodeText(selection.toString());
        range.deleteContents();
        codeElement.textContent = selectedText || "\u200B";
        range.insertNode(codeElement);
        placeCaretInElement(codeElement);
    } else {
        range.insertNode(codeElement);
        if (!codeElement.firstChild) codeElement.appendChild(document.createTextNode("\u200B"));
        placeCaretInElement(codeElement);
    }
}

function toggleCodeBlock(editor, language) {
    const anchorElement = getSelectionAnchorElement();
    const nearestPreElement = anchorElement && anchorElement.closest ? anchorElement.closest("pre") : null;
    const nearestInlineCodeElement = anchorElement && anchorElement.closest ? anchorElement.closest("code") : null;
    const normalizedLanguage = language ?? "plaintext";

    if (nearestPreElement) {
        const codeElement = nearestPreElement.querySelector("code");
        const plainText = (
            codeElement
                ? codeElement.textContent ?? ""
                : nearestPreElement.textContent ?? ""
        ).replace(/\u200B/g, "");
        codeReplacePreWithPlainText(editor, nearestPreElement, plainText);
        return;
    }

    if (
        nearestInlineCodeElement &&
        (!nearestInlineCodeElement.closest || !nearestInlineCodeElement.closest("pre"))
    ) {
        const preElement = document.createElement("pre");
        const codeElement = document.createElement("code");
        codeElement.className = `language-${normalizedLanguage}`;
        codeElement.textContent = nearestInlineCodeElement.textContent || "\u200B";
        preElement.appendChild(codeElement);
        nearestInlineCodeElement.replaceWith(preElement);
        placeCaretInElement(codeElement);
        editor.highlightCodeElement(codeElement);
        editor.ensureCodeLanguageBadge(preElement);
        return;
    }

    const selection = window.getSelection();
    const preElement = document.createElement("pre");
    const codeElement = document.createElement("code");
    codeElement.className = `language-${normalizedLanguage}`;
    codeElement.textContent =
        selection && selection.rangeCount > 0 && selection.toString() ? selection.toString() : "\u200B";
    preElement.appendChild(codeElement);

    if (!selection || selection.rangeCount === 0) {
        editor.contentEditableElement.appendChild(preElement);
    } else {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(preElement);
    }

    placeCaretInElement(codeElement);
    editor.highlightCodeElement(codeElement);
    editor.ensureCodeLanguageBadge(preElement);
}

function createCodeSelectMenuItem(editor, labelText, onClickHandler, badgeText = null) {
    const menuItemElement = createElement("button", "webhacker-menu__item", {
        type: "button",
        "data-menu-item": "true"
    });
    const labelElement = createElement("span", "webhacker-menu__item-label");
    labelElement.textContent = labelText;
    menuItemElement.appendChild(labelElement);
    if (badgeText) {
        const badgeElement = createElement("span", "webhacker-menu__item-badge");
        badgeElement.textContent = badgeText;
        menuItemElement.appendChild(badgeElement);
    }
    menuItemElement.addEventListener("mousedown", event => event.preventDefault());
    menuItemElement.addEventListener("click", createMenuAction(editor, onClickHandler));
    return menuItemElement;
}

function createCodeDropdown(editor, t) {
    const codeT = t.code;
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-code",
        codeT.label
    );
    dropdownMenuElement.classList.add("webhacker-menu--select");
    const newBadgeText = codeT.newBadge || "NEW";

    const inlineCodeItemElement = createCodeSelectMenuItem(
        editor,
        codeT.inline,
        () => toggleInlineCode(editor),
        newBadgeText
    );
    const blockCodeItemElement = createCodeSelectMenuItem(
        editor,
        codeT.block,
        () => toggleCodeBlock(editor, "plaintext"),
        newBadgeText
    );

    dropdownMenuElement.append(inlineCodeItemElement, blockCodeItemElement);
    bindMenuKeyboardNavigation(editor, dropdownMenuElement, { columnsCount: 1 });
    dropdownWrapperElement.querySelector(".webhacker-button").addEventListener("click", () => {
        if (!dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            focusFirstMenuItem(dropdownMenuElement);
        }
    });
    return dropdownWrapperElement;
}

function createTableDropdown(editor, t) {
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-table",
        t.table
    );
    const tablePickerWrapperElement = createElement("div", "webhacker-tablepick");
    const tablePickerLabelElement = createElement("div", "webhacker-tablepick__label");
    tablePickerLabelElement.textContent = "0x0";
    const tablePickerGridElement = createElement("div", "webhacker-tablepick__grid");

    const updateHighlight = (rowsSelected, colsSelected) => {
        tablePickerLabelElement.textContent = `${rowsSelected}x${colsSelected}`;
        tablePickerGridElement.querySelectorAll(".webhacker-tablepick__cell").forEach(cellElement => {
            const rowIndex = parseInt(cellElement.getAttribute("data-row"), 10);
            const colIndex = parseInt(cellElement.getAttribute("data-col"), 10);
            cellElement.classList.toggle("is-selected", rowIndex <= rowsSelected && colIndex <= colsSelected);
        });
    };

    for (let rowIndex = 1; rowIndex <= 10; rowIndex += 1) {
        for (let colIndex = 1; colIndex <= 10; colIndex += 1) {
            const cellElement = createElement("button", "webhacker-tablepick__cell", {
                type: "button",
                "data-row": String(rowIndex),
                "data-col": String(colIndex),
                "data-menu-item": "true",
                "aria-label": `${rowIndex}x${colIndex}`
            });
            cellElement.addEventListener("mouseenter", () => updateHighlight(rowIndex, colIndex));
            cellElement.addEventListener("focus", () => updateHighlight(rowIndex, colIndex));
            cellElement.addEventListener(
                "click",
                createMenuAction(editor, () => editor.insertMinimalTable(rowIndex, colIndex))
            );
            tablePickerGridElement.appendChild(cellElement);
        }
    }

    tablePickerWrapperElement.append(tablePickerLabelElement, tablePickerGridElement);
    dropdownMenuElement.appendChild(tablePickerWrapperElement);

    bindMenuKeyboardNavigation(editor, dropdownMenuElement, { columnsCount: 10 });
    dropdownWrapperElement.querySelector(".webhacker-button").addEventListener("click", () => {
        if (!dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            focusFirstMenuItem(dropdownMenuElement);
        }
    });

    return dropdownWrapperElement;
}

function getShortcutActionLabel(shortcutAction, t) {
    if (shortcutAction.id === "fontSize") return t.shortcuts.fontSize;
    if (shortcutAction.id === "code") return t.code.label;
    if (shortcutAction.id === "math") return t.math && t.math.label;
    if (shortcutAction.id === "mermaid") return t.mermaid && t.mermaid.label;
    if (shortcutAction.id === "resetStyles") return t.reset_styles;
    if (shortcutAction.id === "shortcutsHelp") return t.shortcuts.title;
    return t[shortcutAction.id];
}

function createBindingRow(platformText, keysText) {
    const bindingElement = createElement("div", "webhacker-shortcuts__binding");
    const platformElement = createElement("span", "webhacker-shortcuts__platform");
    platformElement.textContent = platformText;
    const keysElement = createElement("kbd", "webhacker-shortcuts__keys");
    keysElement.textContent = keysText;
    bindingElement.append(platformElement, keysElement);
    return bindingElement;
}

function createShortcutRow(labelText, windowsText, macText, t) {
    const rowElement = createElement("div", "webhacker-shortcuts__row");
    const labelElement = createElement("span", "webhacker-shortcuts__label");
    labelElement.textContent = labelText;

    const bindingsElement = createElement("div", "webhacker-shortcuts__bindings");
    bindingsElement.append(
        createBindingRow(t.shortcuts.windowsColumn, windowsText),
        createBindingRow(t.shortcuts.macColumn, macText)
    );

    rowElement.append(labelElement, bindingsElement);
    return rowElement;
}

function createShortcutsHelpDropdown(editor, t) {
    const shortcutsT = t.shortcuts;
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-keyboard",
        shortcutsT.title
    );
    dropdownMenuElement.classList.add("webhacker-menu--shortcuts");

    const shortcutsContainerElement = createElement("div", "webhacker-shortcuts");
    SHORTCUT_ACTIONS.forEach(shortcutAction => {
        shortcutsContainerElement.appendChild(
            createShortcutRow(
                getShortcutActionLabel(shortcutAction, t),
                formatShortcutList(shortcutAction.shortcuts, "win"),
                formatShortcutList(shortcutAction.shortcuts, "mac"),
                t
            )
        );
    });
    shortcutsContainerElement.appendChild(createShortcutRow(`${t.image} (${t.soon})`, "—", "—", t));

    const notesElement = createElement("div", "webhacker-shortcuts__note");
    notesElement.textContent = shortcutsT.layoutNote;
    shortcutsContainerElement.appendChild(notesElement);

    const menuHintsElement = createElement("div", "webhacker-shortcuts__note");
    menuHintsElement.textContent = `${shortcutsT.menuNavigate}: ${shortcutsT.menuNavigateKeys}. ${shortcutsT.menuSelect}: ${shortcutsT.menuSelectKeys}.`;
    shortcutsContainerElement.appendChild(menuHintsElement);

    dropdownMenuElement.appendChild(shortcutsContainerElement);
    return dropdownWrapperElement;
}

function createMathDropdown(editor, t) {
    const mathT = t.math;
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-square-root-variable",
        mathT.label
    );

    dropdownMenuElement.classList.add("webhacker-menu--math");

    const formElement = createElement("div", "webhacker-math-form");

    const inputLabelElement = createElement("label", "webhacker-math-form__label");
    inputLabelElement.textContent = mathT.inputLabel;

    const inputElement = createElement("textarea", "webhacker-textarea webhacker-math-form__input", {
        rows: "6",
        placeholder: mathT.placeholder,
        "data-menu-item": "true"
    });

    const metaRowElement = createElement("div", "webhacker-math-form__meta");
    const previewLabelElement = createElement(
        "div",
        "webhacker-math-form__label webhacker-math-form__label--inline"
    );
    previewLabelElement.textContent = mathT.preview;

    const docsElement = createElement("a", "webhacker-math-form__docs", {
        href: MATH_DOCS_URL,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        tabindex: "-1"
    });
    docsElement.textContent = mathT.docs;
    metaRowElement.append(previewLabelElement, docsElement);

    const previewElement = createElement("div", "webhacker-math-form__preview", {
        contenteditable: "false",
        "data-placeholder": mathT.preview
    });

    const actionsElement = createElement("div", "webhacker-actions");
    const cancelButtonElement = createElement("button", "webhacker-button webhacker-button--ghost", {
        type: "button",
        "data-menu-item": "true"
    });
    cancelButtonElement.textContent = t.cancel;
    const submitButtonElement = createElement("button", "webhacker-button webhacker-button--primary", {
        type: "button",
        "data-menu-item": "true"
    });
    submitButtonElement.textContent = mathT.insert;

    actionsElement.append(cancelButtonElement, submitButtonElement);
    formElement.append(inputLabelElement, inputElement, metaRowElement, previewElement, actionsElement);
    dropdownMenuElement.appendChild(formElement);

    let targetFigureElement = null;

    const refreshPreview = () => {
        const normalizedLatexValue = normalizeMathLatexValue(inputElement.value);
        previewElement.innerHTML = normalizedLatexValue ? renderMathLatexToHtml(normalizedLatexValue) : "";
    };

    const populateFormFromContext = figureElement => {
        targetFigureElement =
            figureElement && editor.contentEditableElement.contains(figureElement) ? figureElement : null;

        if (targetFigureElement) {
            inputElement.value = editor.getMathLatexValue(targetFigureElement);
            submitButtonElement.textContent = mathT.update;
        } else {
            const selectedFigureElement =
                typeof editor.getMathFigureAtSelection === "function"
                    ? editor.getMathFigureAtSelection()
                    : null;

            if (selectedFigureElement && editor.contentEditableElement.contains(selectedFigureElement)) {
                targetFigureElement = selectedFigureElement;
                inputElement.value = editor.getMathLatexValue(selectedFigureElement);
                submitButtonElement.textContent = mathT.update;
            } else {
                inputElement.value = "";
                submitButtonElement.textContent = mathT.insert;
            }
        }

        refreshPreview();
    };

    const focusComposer = () => {
        requestAnimationFrame(() => {
            focusFirstMenuItem(dropdownMenuElement, ".webhacker-math-form__input");
            inputElement.selectionStart = inputElement.value.length;
            inputElement.selectionEnd = inputElement.value.length;
        });
    };

    const closeComposer = () => {
        editor.closeAllMenus();
        try {
            editor.contentEditableElement.focus({ preventScroll: true });
        } catch {
            editor.contentEditableElement.focus();
        }
        editor.restoreSelectionRange(editor.currentSavedSelectionRange);
    };

    const submit = () => {
        const latexValue = normalizeMathLatexValue(inputElement.value);
        if (!latexValue.length) return;

        closeComposer();

        if (targetFigureElement && editor.contentEditableElement.contains(targetFigureElement)) {
            editor.updateMathBlock(targetFigureElement, latexValue);
        } else {
            editor.insertMathBlock(latexValue);
        }

        targetFigureElement = null;
        inputElement.value = "";
        previewElement.innerHTML = "";
        if (typeof editor.captureHistorySnapshot === "function") {
            editor.captureHistorySnapshot("command");
        }

        editor.emitChange();
        editor.syncToggleStates();
    };

    inputElement.addEventListener("input", refreshPreview);
    inputElement.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            submit();
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeComposer();
        }
    });

    cancelButtonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
    });
    cancelButtonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        closeComposer();
    });

    submitButtonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
    });
    submitButtonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        submit();
    });

    const triggerButtonElement = dropdownWrapperElement.querySelector(".webhacker-button");
    triggerButtonElement.addEventListener("click", () => {
        if (dropdownMenuElement.classList.contains("webhacker-menu--hidden")) return;
        populateFormFromContext(null);
        focusComposer();
    });

    editor.openMathComposerForFigure = figureElement => {
        editor.currentSavedSelectionRange = editor.saveSelectionRange();

        if (dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            editor.toggleMenu(dropdownMenuElement);
        }

        populateFormFromContext(figureElement);
        focusComposer();
    };

    return dropdownWrapperElement;
}

function createMermaidDropdown(editor, t) {
    const mermaidT = t.mermaid;
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-diagram-project",
        mermaidT.label
    );

    dropdownMenuElement.classList.add("webhacker-menu--mermaid");

    const formElement = createElement("div", "webhacker-mermaid-form");

    const inputLabelElement = createElement("label", "webhacker-mermaid-form__label");
    inputLabelElement.textContent = mermaidT.inputLabel;

    const inputElement = createElement("textarea", "webhacker-textarea webhacker-mermaid-form__input", {
        rows: "8",
        placeholder: mermaidT.placeholder,
        "data-menu-item": "true"
    });

    const metaRowElement = createElement("div", "webhacker-mermaid-form__meta");
    const previewLabelElement = createElement(
        "div",
        "webhacker-mermaid-form__label webhacker-mermaid-form__label--inline"
    );
    previewLabelElement.textContent = mermaidT.preview;

    const docsElement = createElement("a", "webhacker-mermaid-form__docs", {
        href: MERMAID_DOCS_URL,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        tabindex: "-1"
    });
    docsElement.textContent = mermaidT.docs;
    metaRowElement.append(previewLabelElement, docsElement);

    const previewElement = createElement("div", "webhacker-mermaid-form__preview", {
        contenteditable: "false",
        "data-placeholder": mermaidT.preview
    });

    const actionsElement = createElement("div", "webhacker-actions");
    const cancelButtonElement = createElement("button", "webhacker-button webhacker-button--ghost", {
        type: "button",
        "data-menu-item": "true"
    });
    cancelButtonElement.textContent = t.cancel;
    const submitButtonElement = createElement("button", "webhacker-button webhacker-button--primary", {
        type: "button",
        "data-menu-item": "true"
    });
    submitButtonElement.textContent = mermaidT.insert;

    actionsElement.append(cancelButtonElement, submitButtonElement);
    formElement.append(inputLabelElement, inputElement, metaRowElement, previewElement, actionsElement);
    dropdownMenuElement.appendChild(formElement);

    let targetFigureElement = null;
    let previewRenderRequestId = 0;

    const refreshPreview = async () => {
        const currentSourceValue = normalizeMermaidSourceValue(inputElement.value);
        const requestId = ++previewRenderRequestId;

        if (!currentSourceValue.length) {
            previewElement.innerHTML = "";
            return;
        }

        previewElement.setAttribute("aria-busy", "true");
        const renderedHtml = await renderMermaidSourceToHtml(currentSourceValue);
        if (requestId !== previewRenderRequestId) return;
        previewElement.innerHTML = renderedHtml;
        previewElement.removeAttribute("aria-busy");
    };

    const populateFormFromContext = figureElement => {
        targetFigureElement =
            figureElement && editor.contentEditableElement.contains(figureElement) ? figureElement : null;

        if (targetFigureElement) {
            inputElement.value = editor.getMermaidSourceValue(targetFigureElement);
            submitButtonElement.textContent = mermaidT.update;
        } else {
            const selectedFigureElement =
                typeof editor.getMermaidFigureAtSelection === "function"
                    ? editor.getMermaidFigureAtSelection()
                    : null;

            if (selectedFigureElement && editor.contentEditableElement.contains(selectedFigureElement)) {
                targetFigureElement = selectedFigureElement;
                inputElement.value = editor.getMermaidSourceValue(selectedFigureElement);
                submitButtonElement.textContent = mermaidT.update;
            } else {
                inputElement.value = "";
                submitButtonElement.textContent = mermaidT.insert;
            }
        }

        refreshPreview();
    };

    const focusComposer = () => {
        requestAnimationFrame(() => {
            focusFirstMenuItem(dropdownMenuElement, ".webhacker-mermaid-form__input");
            inputElement.selectionStart = inputElement.value.length;
            inputElement.selectionEnd = inputElement.value.length;
        });
    };

    const closeComposer = () => {
        editor.closeAllMenus();
        try {
            editor.contentEditableElement.focus({ preventScroll: true });
        } catch {
            editor.contentEditableElement.focus();
        }
        editor.restoreSelectionRange(editor.currentSavedSelectionRange);
    };

    const submit = () => {
        const sourceValue = normalizeMermaidSourceValue(inputElement.value);
        if (!sourceValue.length) return;

        closeComposer();

        if (targetFigureElement && editor.contentEditableElement.contains(targetFigureElement)) {
            editor.updateMermaidBlock(targetFigureElement, sourceValue);
        } else {
            editor.insertMermaidBlock(sourceValue);
        }

        targetFigureElement = null;
        inputElement.value = "";
        previewElement.innerHTML = "";

        editor.emitChange();
        editor.syncToggleStates();
    };

    inputElement.addEventListener("input", refreshPreview);
    inputElement.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            submit();
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeComposer();
        }
    });

    cancelButtonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
    });
    cancelButtonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        closeComposer();
    });

    submitButtonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
    });
    submitButtonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        submit();
    });

    const triggerButtonElement = dropdownWrapperElement.querySelector(".webhacker-button");
    triggerButtonElement.addEventListener("click", () => {
        if (dropdownMenuElement.classList.contains("webhacker-menu--hidden")) return;
        populateFormFromContext(null);
        focusComposer();
    });

    editor.openMermaidComposerForFigure = figureElement => {
        editor.currentSavedSelectionRange = editor.saveSelectionRange();

        if (dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            editor.toggleMenu(dropdownMenuElement);
        }

        populateFormFromContext(figureElement);
        focusComposer();
    };

    return dropdownWrapperElement;
}

function createCustomControl(controlId, editor, t) {
    if (controlId === "code") return createCodeDropdown(editor, t);
    if (controlId === "math") return createMathDropdown(editor, t);
    if (controlId === "mermaid") return createMermaidDropdown(editor, t);
    if (controlId === "color") return createColorDropdown(editor, t);
    if (controlId === "link") return createLinkDropdown(editor, t);
    if (controlId === "imageDisabled") return createImageDisabledButton(editor, t);
    if (controlId === "heading") return createHeadingDropdown(editor, t);
    if (controlId === "table") return createTableDropdown(editor, t);
    if (controlId === "shortcutsHelp") return createShortcutsHelpDropdown(editor, t);
    return null;
}

function createToolbarControl(controlId, editor, t) {
    const commandControl = createCommandControl(controlId, editor, t);
    if (commandControl) return commandControl;

    const customControl = createCustomControl(controlId, editor, t);
    if (!customControl) throw new Error(`Unknown toolbar control: ${controlId}`);
    return customControl;
}

export function buildToolbar(editor, toolbarElement, t) {
    TOOLBAR_LAYOUT.forEach(layoutItem => {
        if (layoutItem === "separator") {
            toolbarElement.appendChild(createSeparator());
            return;
        }

        const groupElement = createElement("div", "webhacker-toolbar__group");
        (layoutItem as string[]).forEach(controlId => {
            const controlElement = createToolbarControl(controlId, editor, t);
            if (controlElement && controlElement.setAttribute) {
                controlElement.setAttribute("data-control-id", controlId);
            }
            const controlButtonElement =
                controlElement && controlElement.tagName === "BUTTON"
                    ? controlElement
                    : controlElement.querySelector && controlElement.querySelector(".webhacker-button");
            if (controlButtonElement) {
                controlButtonElement.setAttribute("data-control-id", controlId);
            }
            groupElement.appendChild(controlElement);
        });
        toolbarElement.appendChild(groupElement);
    });

    const betaBadgeElement = createElement("span", "webhacker-badge--beta", { title: t.soon });
    betaBadgeElement.textContent = t.beta;
    toolbarElement.appendChild(betaBadgeElement);
}
