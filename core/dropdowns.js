import WebHackerEditor from "./WebHackerEditor.js";
import { createElement } from "../ui/elements.js";
import { executeRichCommand } from "./commands.js";
import { DEFAULT_TEXT_PRESET_COLORS } from "../constants/colors.js";
import { escapeHtml, ensureSafeUrl } from "../sanitize/utils.js";
import ru from "../translations/ru.yml";
import en from "../translations/en.yml";

const translations = { ru, en };

WebHackerEditor.prototype.createTableDropdown = function () {
    const lang = this.editorOptions.language || "ru";
    const t = translations[lang];
    const { dropdownWrapperElement, dropdownMenuElement } = this.createDropdown(
        "fa-solid fa-table",
        t.table
    );
    const tablePickerWrapperElement = createElement("div", "webhacker-tablepick");
    const tablePickerLabelElement = createElement("div", "webhacker-tablepick__label");
    tablePickerLabelElement.textContent = "0×0";
    const tablePickerGridElement = createElement("div", "webhacker-tablepick__grid");

    const updateHighlight = (rowsSelected, colsSelected) => {
        tablePickerLabelElement.textContent = `${rowsSelected}×${colsSelected}`;
        tablePickerGridElement
            .querySelectorAll(".webhacker-tablepick__cell")
            .forEach(cellElement => {
                const rowIndex = parseInt(cellElement.getAttribute("data-row"), 10);
                const colIndex = parseInt(cellElement.getAttribute("data-col"), 10);
                if (rowIndex <= rowsSelected && colIndex <= colsSelected) {
                    cellElement.classList.add("is-selected");
                } else {
                    cellElement.classList.remove("is-selected");
                }
            });
    };

    for (let rowIndex = 1; rowIndex <= 10; rowIndex += 1) {
        for (let colIndex = 1; colIndex <= 10; colIndex += 1) {
            const cellElement = createElement("button", "webhacker-tablepick__cell", {
                type: "button",
                "data-row": String(rowIndex),
                "data-col": String(colIndex),
                "aria-label": `${rowIndex}×${colIndex}`
            });
            cellElement.addEventListener("mouseenter", () => updateHighlight(rowIndex, colIndex));
            cellElement.addEventListener("click", this.createMenuAction(() => {
                this.insertMinimalTable(rowIndex, colIndex);
            }));
            tablePickerGridElement.appendChild(cellElement);
        }
    }

    tablePickerWrapperElement.append(tablePickerLabelElement, tablePickerGridElement);
    dropdownMenuElement.appendChild(tablePickerWrapperElement);
    return dropdownWrapperElement;
};

WebHackerEditor.prototype.createHeadingDropdown = function () {
    const lang = this.editorOptions.language || "ru";
    const t = translations[lang];
    const { dropdownWrapperElement, dropdownMenuElement } = this.createDropdown(
        "fa-solid fa-heading",
        t.headings
    );
    [
        { label: t.paragraph, tag: "p" },
        { label: "H1", tag: "h1" },
        { label: "H2", tag: "h2" },
        { label: "H3", tag: "h3" }
    ].forEach(({ label, tag }) => {
        const menuItemElement = createElement("div", "webhacker-menu__item");
        menuItemElement.textContent = label;
        menuItemElement.addEventListener("mousedown", event => event.preventDefault());
        menuItemElement.addEventListener("click", this.createMenuAction(() => {
            executeRichCommand("formatBlock", tag.toUpperCase());
        }));
        dropdownMenuElement.appendChild(menuItemElement);
    });
    return dropdownWrapperElement;
};

WebHackerEditor.prototype.createColorDropdown = function () {
    const lang = this.editorOptions.language || "ru";
    const t = translations[lang];
    const { dropdownWrapperElement, dropdownMenuElement } = this.createDropdown(
        "fa-solid fa-palette",
        t.color
    );
    const colorContainerElement = createElement("div", "webhacker-color");
    const swatchesContainerElement = createElement("div", "webhacker-color__swatches");

    const applySelectedColorAndClose = hexColor => {
        this.closeAllMenus();
        this.contentEditableElement.focus();
        this.restoreSelectionRange(this.currentSavedSelectionRange);
        executeRichCommand("foreColor", hexColor);
        this.emitChange();
        this.syncToggleStates();
    };

    DEFAULT_TEXT_PRESET_COLORS.forEach(hexColor => {
        const swatchButtonElement = createElement("button", "webhacker-swatch", {
            type: "button",
            "data-color": hexColor,
            title: hexColor
        });
        swatchButtonElement.style.background = hexColor;
        swatchButtonElement.addEventListener("click", this.createMenuAction(() => {
            executeRichCommand("foreColor", hexColor);
        }));
        swatchesContainerElement.appendChild(swatchButtonElement);
    });

    colorContainerElement.append(swatchesContainerElement);
    dropdownMenuElement.appendChild(colorContainerElement);
    return dropdownWrapperElement;
};

WebHackerEditor.prototype.createLinkDropdown = function () {
    const lang = this.editorOptions.language || "ru";
    const t = translations[lang];
    const { dropdownWrapperElement, dropdownMenuElement } = this.createDropdown(
        "fa-solid fa-link",
        t.link
    );
    const linkFormElement = createElement("div", "webhacker-form");
    const linkUrlInputElement = createElement("input", "webhacker-input", {
        type: "text",
        placeholder: t.linkPlaceholder
    });
    const linkTextInputElement = createElement("input", "webhacker-input", {
        type: "text",
        placeholder: t.linkTextPlaceholder
    });
    const linkActionsRowElement = createElement("div", "webhacker-actions");
    const linkConfirmButtonElement = createElement(
        "button",
        "webhacker-button webhacker-button--primary",
        { type: "button" }
    );
    linkConfirmButtonElement.textContent = t.ok;
    const linkRemoveButtonElement = createElement(
        "button",
        "webhacker-button webhacker-button--ghost",
        { type: "button" }
    );
    linkRemoveButtonElement.textContent = t.remove;
    linkActionsRowElement.append(linkConfirmButtonElement, linkRemoveButtonElement);
    linkFormElement.append(linkUrlInputElement, linkTextInputElement, linkActionsRowElement);
    dropdownMenuElement.appendChild(linkFormElement);

    const linkTriggerBtn = dropdownWrapperElement.querySelector(".webhacker-button");
    linkTriggerBtn.addEventListener("click", () => {
        const sel = window.getSelection();
        let node = sel && sel.anchorNode;
        if (node && node.nodeType === 3) node = node.parentNode;
        const a = node && node.closest ? node.closest("a") : null;

        linkUrlInputElement.value = a ? a.getAttribute("href") || "" : "";
        linkTextInputElement.value = a
            ? a.textContent || ""
            : sel && !sel.isCollapsed
              ? sel.toString()
              : "";
    });

    linkConfirmButtonElement.addEventListener("click", this.createMenuAction(() => {
        let hrefValue = linkUrlInputElement.value.trim();
        const labelValue = linkTextInputElement.value.trim();
        if (!hrefValue) return;
        hrefValue = ensureSafeUrl(hrefValue);
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const visibleText = selection.isCollapsed ? hrefValue : selection.toString();
        const linkHtml = `<a href="${hrefValue}" target="_blank" rel="noopener noreferrer">${escapeHtml(
            labelValue || visibleText
        )}</a>`;
        executeRichCommand("insertHTML", linkHtml);
    }));
    linkRemoveButtonElement.addEventListener("click", this.createMenuAction(() => {
        executeRichCommand("unlink");
        linkUrlInputElement.value = "";
        linkTextInputElement.value = "";
    }));
    
    return dropdownWrapperElement;
};
