import { createElement } from "../ui/elements.js";
import { sanitizeHtmlStringToSafeHtml } from "../sanitize/sanitize.js";
import { applyThemeVariables } from "../ui/theme.js";
import { executeRichCommand } from "./commands.js";
import ru from "../translations/ru.yml";
import en from "../translations/en.yml";

export default function WebHackerEditor(rootSelectorOrElement, editorOptions = {}) {
    this.hostContainerElement =
        typeof rootSelectorOrElement === "string"
            ? document.querySelector(rootSelectorOrElement)
            : rootSelectorOrElement;
    if (!this.hostContainerElement) throw new Error("WebHackerEditor: контейнер не найден");
    const defaultEditorOptions = {
        language: "ru",
        placeholderText: null,
        onChange: null,
        theme: null
    };
    this.editorOptions = Object.assign({}, defaultEditorOptions, editorOptions);
    this.currentSavedSelectionRange = null;
    this.trackedToggleButtonsMap = {};
    this.renderEditorInterface();
    applyThemeVariables(this.editorRootElement, this.editorOptions.theme);
    this.bindEditorEvents();
}

WebHackerEditor.prototype.getHTML = function () {
    return sanitizeHtmlStringToSafeHtml(this.contentEditableElement.innerHTML).trim();
};

WebHackerEditor.prototype.setHTML = function (htmlString) {
    const safeHtml = sanitizeHtmlStringToSafeHtml(htmlString);
    this.contentEditableElement.innerHTML = safeHtml || "";
    this.syncToggleStates();
};

WebHackerEditor.prototype.renderEditorInterface = function () {
    const translations = { ru, en };
    const lang = this.editorOptions.language || "ru";
    const t = translations[lang];

    const editorRootElement = createElement("div", "webhacker-editor", {
        role: "region"
    });
    const toolbarElement = createElement("div", "webhacker-toolbar");

    const historyGroupElement = createElement("div", "webhacker-toolbar__group");
    historyGroupElement.append(
        this.createToolbarButton("fa-solid fa-rotate-left", t.undo, () =>
            executeRichCommand("undo")
        ),
        this.createToolbarButton("fa-solid fa-rotate-right", t.redo, () =>
            executeRichCommand("redo")
        )
    );

    const textGroupElement = createElement("div", "webhacker-toolbar__group");
    textGroupElement.append(
        this.createToolbarButton(
            "fa-solid fa-bold",
            t.bold,
            () => executeRichCommand("bold"),
            true,
            "bold"
        ),
        this.createToolbarButton(
            "fa-solid fa-italic",
            t.italic,
            () => executeRichCommand("italic"),
            true,
            "italic"
        ),
        this.createToolbarButton(
            "fa-solid fa-underline",
            t.underline,
            () => executeRichCommand("underline"),
            true,
            "underline"
        ),
        this.createColorDropdown(),
        this.createLinkDropdown(),
        this.createDisabledImageButton()
    );

    const structureGroupElement = createElement("div", "webhacker-toolbar__group");
    structureGroupElement.append(this.createHeadingDropdown());

    const alignGroupElement = createElement("div", "webhacker-toolbar__group");
    alignGroupElement.append(
        this.createToolbarButton(
            "fa-solid fa-align-left",
            t.alignLeft,
            () => executeRichCommand("justifyLeft"),
            true,
            "alignLeft"
        ),
        this.createToolbarButton(
            "fa-solid fa-align-center",
            t.alignCenter,
            () => executeRichCommand("justifyCenter"),
            true,
            "alignCenter"
        ),
        this.createToolbarButton(
            "fa-solid fa-align-right",
            t.alignRight,
            () => executeRichCommand("justifyRight"),
            true,
            "alignRight"
        )
    );

    const listsGroupElement = createElement("div", "webhacker-toolbar__group");
    listsGroupElement.append(
        this.createToolbarButton(
            "fa-solid fa-list-ul",
            t.unorderedList,
            () => executeRichCommand("insertUnorderedList"),
            true,
            "unorderedList"
        ),
        this.createToolbarButton(
            "fa-solid fa-list-ol",
            t.orderedList,
            () => executeRichCommand("insertOrderedList"),
            true,
            "orderedList"
        ),
        this.createTableDropdown()
    );

    toolbarElement.append(
        historyGroupElement,
        this.createSeparator(),
        textGroupElement,
        this.createSeparator(),
        structureGroupElement,
        this.createSeparator(),
        alignGroupElement,
        this.createSeparator(),
        listsGroupElement
    );

    const betaBadge = createElement("span", "webhacker-badge--beta", {
        title: t.soon
    });
    betaBadge.textContent = t.beta;
    toolbarElement.append(betaBadge);

    const contentEditableElement = createElement("div", "webhacker-content", {
        contenteditable: "true"
    });
    contentEditableElement.setAttribute(
        "data-placeholder",
        this.editorOptions.placeholderText || t.placeholder
    );

    editorRootElement.append(toolbarElement, contentEditableElement);
    this.hostContainerElement.appendChild(editorRootElement);

    this.editorRootElement = editorRootElement;
    this.toolbarElement = toolbarElement;
    this.contentEditableElement = contentEditableElement;
};

WebHackerEditor.prototype.toggleMenu = function (dropdownMenuElement) {
    this.closeAllMenus(dropdownMenuElement);
    dropdownMenuElement.classList.toggle("webhacker-menu--hidden");
    const onOutsideMouseDown = event => {
        if (!dropdownMenuElement.contains(event.target)) {
            this.closeAllMenus();
            document.removeEventListener("mousedown", onOutsideMouseDown, true);
        }
    };
    document.addEventListener("mousedown", onOutsideMouseDown, true);
};

WebHackerEditor.prototype.closeAllMenus = function (exceptDropdownMenuElement) {
    this.editorRootElement.querySelectorAll(".webhacker-menu").forEach(menuElement => {
        if (menuElement !== exceptDropdownMenuElement)
            menuElement.classList.add("webhacker-menu--hidden");
    });
};

WebHackerEditor.prototype.emitChange = function () {
    if (typeof this.editorOptions.onChange === "function")
        this.editorOptions.onChange(this.getHTML());
};

WebHackerEditor.prototype.syncToggleStates = function () {
    const readCommandState = commandName => String(document.queryCommandState(commandName));
    const updateToggleButton = (key, value) => {
        if (this.trackedToggleButtonsMap[key])
            this.trackedToggleButtonsMap[key].setAttribute("aria-pressed", value);
    };
    updateToggleButton("bold", readCommandState("bold"));
    updateToggleButton("italic", readCommandState("italic"));
    updateToggleButton("underline", readCommandState("underline"));
    updateToggleButton("unorderedList", readCommandState("insertUnorderedList"));
    updateToggleButton("orderedList", readCommandState("insertOrderedList"));
    updateToggleButton("alignLeft", readCommandState("justifyLeft"));
    updateToggleButton("alignCenter", readCommandState("justifyCenter"));
    updateToggleButton("alignRight", readCommandState("justifyRight"));
};

WebHackerEditor.prototype.saveSelectionRange = function () {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    return selection.getRangeAt(0).cloneRange();
};

WebHackerEditor.prototype.restoreSelectionRange = function (savedRange) {
    if (!savedRange) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
};

WebHackerEditor.prototype.setTheme = function (themeOptions) {
    applyThemeVariables(this.editorRootElement, themeOptions || null);
};
