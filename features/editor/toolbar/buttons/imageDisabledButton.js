import { createElement } from "../../../../ui/elements.js";

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
