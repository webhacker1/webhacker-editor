import { createElement } from "../../../../ui/elements.js";
import { executeRichCommand } from "../../../../core/commands.js";
import { escapeHtml, ensureSafeUrl } from "../../../../sanitize/utils.js";
import {
    bindMenuKeyboardNavigation,
    createDropdown,
    createMenuAction,
    focusFirstMenuItem
} from "../ui.js";

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

    const linkTriggerButtonElement = dropdownWrapperElement.querySelector(".webhacker-button");
    linkTriggerButtonElement.addEventListener("click", () => {
        const selection = window.getSelection();
        let node = selection && selection.anchorNode;
        if (node && node.nodeType === 3) node = node.parentNode;
        const anchorElement = node && node.closest ? node.closest("a") : null;

        linkUrlInputElement.value = anchorElement ? anchorElement.getAttribute("href") ?? "" : "";
        linkTextInputElement.value = anchorElement
            ? anchorElement.textContent ?? ""
            : selection && !selection.isCollapsed
              ? selection.toString()
              : "";

        if (!dropdownMenuElement.classList.contains("webhacker-menu--hidden"))
            focusFirstMenuItem(dropdownMenuElement);
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
            if (!hrefValue) return;
            hrefValue = ensureSafeUrl(hrefValue);
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            const visibleText = selection.isCollapsed ? hrefValue : selection.toString();
            executeRichCommand(
                "insertHTML",
                `<a href="${hrefValue}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                    labelValue || visibleText
                )}</a>`
            );
        })
    );

    linkRemoveButtonElement.addEventListener(
        "click",
        createMenuAction(editor, () => {
            executeRichCommand("unlink");
            linkUrlInputElement.value = "";
            linkTextInputElement.value = "";
        })
    );

    bindMenuKeyboardNavigation(editor, dropdownMenuElement, { columnsCount: 1 });

    return dropdownWrapperElement;
}
