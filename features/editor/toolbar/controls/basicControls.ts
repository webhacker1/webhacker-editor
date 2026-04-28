import { DEFAULT_TEXT_PRESET_COLORS, KEY_ENTER } from "@/constants/indexConstants";
import { executeRichCommand } from "@/core/indexCore";
import { ensureSafeUrl, escapeHtml } from "@/sanitize/indexSanitize";
import { createElement } from "@/ui/indexUi";
import { COMMAND_CONTROLS } from "@/features/editor/toolbar/toolbarConfig";
import {
    bindMenuKeyboardNavigation,
    createDropdown,
    createMenuAction,
    createToolbarButton,
    ensureValidSelectionInEditor,
    focusFirstMenuItem,
    isRangeInsideEditor
} from "@/features/editor/toolbar/toolbarContext";

export function createCommandControl(controlId, editor, t) {
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

export function createImageDisabledButton(_editor, t) {
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

export function createColorDropdown(editor, t) {
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

export function createHeadingDropdown(editor, t) {
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

function unwrapElementKeepChildren(element) {
    if (!element || !element.parentNode) return;
    const parentElement = element.parentNode;
    while (element.firstChild) parentElement.insertBefore(element.firstChild, element);
    parentElement.removeChild(element);
}

export function createLinkDropdown(editor, t) {
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
        if (event.key !== KEY_ENTER) return;
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
        }, { preferSavedSelection: true })
    );

    linkRemoveButtonElement.addEventListener(
        "click",
        createMenuAction(editor, () => {
            if (targetLinkElement && editor.contentEditableElement.contains(targetLinkElement)) {
                unwrapElementKeepChildren(targetLinkElement);
                targetLinkElement = null;
            } else {
                const result = executeRichCommand("unlink", null, editor);
                if (!result) return false;
            }
            linkUrlInputElement.value = "";
            linkTextInputElement.value = "";
            return true;
        }, { preferSavedSelection: true })
    );

    bindMenuKeyboardNavigation(editor, dropdownMenuElement, { columnsCount: 1 });

    return dropdownWrapperElement;
}
