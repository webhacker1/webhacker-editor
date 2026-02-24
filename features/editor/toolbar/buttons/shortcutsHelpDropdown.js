import { createElement } from "../../../../ui/elements.js";
import { SHORTCUT_ACTIONS, formatShortcutList } from "../../shortcuts.js";
import { createDropdown } from "../ui.js";

function getActionLabel(shortcutAction, t) {
    if (shortcutAction.id === "fontSize") return t.shortcuts.fontSize;
    if (shortcutAction.id === "code") return t.code.label;
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

export function createShortcutsHelpDropdown(editor, t) {
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
                getActionLabel(shortcutAction, t),
                formatShortcutList(shortcutAction.shortcuts, "win"),
                formatShortcutList(shortcutAction.shortcuts, "mac"),
                t
            )
        );
    });
    shortcutsContainerElement.appendChild(
        createShortcutRow(`${t.image} (${t.soon})`, "—", "—", t)
    );

    const notesElement = createElement("div", "webhacker-shortcuts__note");
    notesElement.textContent = shortcutsT.layoutNote;
    shortcutsContainerElement.appendChild(notesElement);

    const menuHintsElement = createElement("div", "webhacker-shortcuts__note");
    menuHintsElement.textContent = `${shortcutsT.menuNavigate}: ${shortcutsT.menuNavigateKeys}. ${shortcutsT.menuSelect}: ${shortcutsT.menuSelectKeys}.`;
    shortcutsContainerElement.appendChild(menuHintsElement);

    dropdownMenuElement.appendChild(shortcutsContainerElement);
    return dropdownWrapperElement;
}
