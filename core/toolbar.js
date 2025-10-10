import WebHackerEditor from "./WebHackerEditor.js";
import { createElement } from "../ui/elements.js";
import ru from "../translations/ru.yml";
import en from "../translations/en.yml";

const translations = { ru, en };

WebHackerEditor.prototype.createDisabledImageButton = function () {
    const lang = this.editorOptions.language || "ru";
    const t = translations[lang];
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
};

WebHackerEditor.prototype.createSeparator = function () {
    return createElement("div", "webhacker-toolbar__separator");
};

WebHackerEditor.prototype.createDropdown = function (triggerIconClassName, triggerTitleText) {
    const dropdownWrapperElement = createElement("div", "webhacker-dropdown");
    const triggerButtonElement = this.createToolbarButton(
        triggerIconClassName,
        triggerTitleText,
        () => {}
    );
    const dropdownMenuElement = createElement("div", "webhacker-menu webhacker-menu--hidden");
    triggerButtonElement.addEventListener("click", () => {
        this.currentSavedSelectionRange = this.saveSelectionRange();
        this.toggleMenu(dropdownMenuElement);
    });
    dropdownWrapperElement.append(triggerButtonElement, dropdownMenuElement);
    return { dropdownWrapperElement, dropdownMenuElement };
};

WebHackerEditor.prototype.createToolbarButton = function (
    iconClassName,
    buttonTitleText,
    onClickHandler,
    trackToggleState = false,
    toggleKey = null
) {
    const buttonElement = createElement("button", "webhacker-button", {
        type: "button",
        "aria-label": buttonTitleText,
        "data-tooltip": buttonTitleText
    });
    const iconElement = createElement("i", iconClassName);
    buttonElement.appendChild(iconElement);
    buttonElement.addEventListener("mousedown", event => event.preventDefault());
    buttonElement.addEventListener("click", () => {
        this.contentEditableElement.focus();
        onClickHandler();
        this.emitChange();
        this.syncToggleStates();
    });
    if (trackToggleState && toggleKey) this.trackedToggleButtonsMap[toggleKey] = buttonElement;
    return buttonElement;
};
