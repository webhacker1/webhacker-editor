import { createElement } from "../../../../ui/elements.js";

export function createImageDisabledButton(_editor, t) {
    const buttonElement = createElement("button", "webhacker-button", {
        type: "button",
        "aria-label": `${t.image} (${t.soon})`,
        "aria-disabled": "true",
        "data-tooltip": t.soon
    });
    const iconElement = createElement("i", "fa-solid fa-image");
    buttonElement.appendChild(iconElement);
    buttonElement.disabled = true;
    return buttonElement;
}
