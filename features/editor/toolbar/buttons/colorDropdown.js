import { createElement } from "../../../../ui/elements.js";
import { executeRichCommand } from "../../../../core/commands.js";
import { DEFAULT_TEXT_PRESET_COLORS } from "../../../../constants/colors.js";
import {
    bindMenuKeyboardNavigation,
    createDropdown,
    createMenuAction,
    focusFirstMenuItem
} from "../ui.js";

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
            createMenuAction(editor, () => executeRichCommand("foreColor", hexColor))
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
        createMenuAction(editor, () => {
            const defaultColor = getComputedStyle(editor.editorRootElement)
                .getPropertyValue("--text-color")
                .trim();
            executeRichCommand("foreColor", defaultColor);
        })
    );

    colorContainerElement.append(swatchesContainerElement, clearColorButtonElement);
    dropdownMenuElement.appendChild(colorContainerElement);

    bindMenuKeyboardNavigation(editor, dropdownMenuElement, { columnsCount: 5 });
    dropdownWrapperElement.querySelector(".webhacker-button").addEventListener("click", () => {
        if (!dropdownMenuElement.classList.contains("webhacker-menu--hidden"))
            focusFirstMenuItem(dropdownMenuElement);
    });

    return dropdownWrapperElement;
}
