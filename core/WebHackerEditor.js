import { createElement } from "../ui/elements.js";
import { sanitizeHtmlStringToSafeHtml } from "../sanitize/sanitize.js";
import { applyThemeVariables } from "../ui/theme.js";
import { buildToolbar } from "../features/editor/toolbar/buildToolbar.js";
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
    this.bindFloatingToolbar();
}

WebHackerEditor.prototype.getHTML = function () {
    const rawHtml =
        typeof this.getSerializableEditorHtml === "function"
            ? this.getSerializableEditorHtml()
            : this.contentEditableElement.innerHTML;
    return sanitizeHtmlStringToSafeHtml(rawHtml).trim();
};

WebHackerEditor.prototype.setHTML = function (htmlString) {
    const safeHtml = sanitizeHtmlStringToSafeHtml(htmlString);
    this.contentEditableElement.innerHTML = safeHtml || "";
    if (typeof this.highlightCodeBlocks === "function") this.highlightCodeBlocks();
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
    buildToolbar(this, toolbarElement, t);

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

    dropdownMenuElement.style.left = 'unset';
    dropdownMenuElement.style.right = 'unset';

    if (!dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
        setTimeout(() => {            
            if (dropdownMenuElement.getBoundingClientRect().right > this.editorRootElement.getBoundingClientRect().right) {
                dropdownMenuElement.style.left = 'unset';
                dropdownMenuElement.style.right = '0';
            }
        }, 0);
    }
    
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

WebHackerEditor.prototype.bindFloatingToolbar = function () {
    const updateFloatingState = () => {
        const editorRect = this.editorRootElement.getBoundingClientRect();
        const shouldFloat = editorRect.top < 0 && editorRect.bottom > 80;
        this.toolbarElement.classList.toggle("webhacker-toolbar--floating", shouldFloat);
    };

    let rafId = null;
    const scheduleUpdate = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            updateFloatingState();
        });
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();
};
