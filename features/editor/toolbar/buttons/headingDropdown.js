import { createElement } from "../../../../ui/elements.js";
import { executeRichCommand } from "../../../../core/commands.js";
import { createDropdown, createMenuAction } from "../ui.js";

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
        const menuItemElement = createElement("div", "webhacker-menu__item");
        const labelElement = createElement("span", "webhacker-menu__item-label");
        labelElement.textContent = label;
        menuItemElement.appendChild(labelElement);
        menuItemElement.addEventListener("mousedown", event => event.preventDefault());
        menuItemElement.addEventListener(
            "click",
            createMenuAction(editor, () => executeRichCommand("formatBlock", tag.toUpperCase()))
        );
        dropdownMenuElement.appendChild(menuItemElement);
    });

    return dropdownWrapperElement;
}
