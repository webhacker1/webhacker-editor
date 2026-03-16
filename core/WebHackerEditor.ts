import { createElement } from "../ui/elements";
import { sanitizeHtmlStringToSafeHtml } from "../sanitize/sanitize";
import { applyThemeVariables } from "../ui/theme";
import { buildToolbar } from "../features/editor/toolbar";
import { queryEditorCommandState } from "./richtext/commands";
import {
    captureHistorySnapshot,
    initEditorRuntime,
    redoFromHistory,
    resetHistory,
    undoFromHistory
} from "./richtext/runtime";
import { setActiveEditor } from "./richtext/registry";
import ru from "../translations/ru.yml";
import en from "../translations/en.yml";

const TRANSLATIONS = { ru, en };

const BLOCKED_IN_CODE_BLOCK = new Set([
    "code",
    "math",
    "imageDisabled",
    "bold",
    "italic",
    "underline",
    "color",
    "link",
    "heading",
    "alignLeft",
    "alignCenter",
    "alignRight",
    "unorderedList",
    "orderedList",
    "table",
    "resetStyles"
]);

const BLOCKED_IN_TABLE = new Set(["code", "math", "table"]);

type EditorOptions = {
    language: string;
    placeholderText: string | null;
    onChange: ((safeHtml: string) => void) | null;
    theme: unknown;
    [key: string]: unknown;
};

export default class WebHackerEditor {
    hostContainerElement: Element;
    editorOptions: EditorOptions;
    currentSavedSelectionRange: Range | null;
    trackedToggleButtonsMap: Record<string, HTMLButtonElement>;
    editorRootElement!: HTMLDivElement;
    toolbarElement!: HTMLDivElement;
    contentEditableElement!: HTMLDivElement;

    bindEditorEvents!: () => void;
    getSerializableEditorHtml!: () => string;
    highlightCodeBlocks!: () => void;
    highlightCodeAtCaret!: () => void;
    highlightCodeElement!: (codeElement: HTMLElement) => void;
    ensureCodeLanguageBadge!: (preElement: HTMLElement) => void;
    exitCodeBlockToNextLine!: (codeElement: HTMLElement) => boolean;

    getMathLatexValue!: (figureElement: HTMLElement) => string;
    getMathFigureAtSelection!: () => HTMLElement | null;
    insertMathBlock!: (latexValue: string) => HTMLElement | null;
    updateMathBlock!: (figureElement: HTMLElement, latexValue: string) => HTMLElement | null;
    renderMathBlocks!: () => void;
    exitMathBlockToNextLine!: (figureElement: HTMLElement) => boolean;
    openMathComposerForFigure?: (figureElement: HTMLElement | null) => void;

    insertMinimalTable!: (rowCount?: number, columnCount?: number) => void;
    ensureCaretAnchorInTableCell!: (cellElement: HTMLElement, shouldPlaceCaret?: boolean) => void;
    exitTableToNextLine!: (tableCellElement: HTMLElement | null) => boolean;

    constructor(rootSelectorOrElement, editorOptions = {}) {
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
        initEditorRuntime(this);
        applyThemeVariables(this.editorRootElement, this.editorOptions.theme);
        this.bindEditorEvents();
        this.bindFocusTracking();
        setActiveEditor(this);
        this.captureHistorySnapshot("input");
        this.bindFloatingToolbar();
    }

    getHTML() {
        const rawHtml =
            typeof this.getSerializableEditorHtml === "function"
                ? this.getSerializableEditorHtml()
                : this.contentEditableElement.innerHTML;
        return sanitizeHtmlStringToSafeHtml(rawHtml).trim();
    }

    setHTML(htmlString) {
        const safeHtml = sanitizeHtmlStringToSafeHtml(htmlString);
        this.contentEditableElement.innerHTML = safeHtml || "";
        if (typeof this.highlightCodeBlocks === "function") this.highlightCodeBlocks();
        resetHistory(this);
        this.captureHistorySnapshot("input");
        this.syncToggleStates();
    }

    renderEditorInterface() {
        const lang = this.editorOptions.language || "ru";
        const t = TRANSLATIONS[lang];

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

        const creditText = typeof t.credit === "string" ? t.credit : "";
        if (creditText) {
            const creditElement = createElement("div", "webhacker-credit");
            creditElement.textContent = creditText;
            editorRootElement.appendChild(creditElement);
        }

        this.hostContainerElement.appendChild(editorRootElement);

        this.editorRootElement = editorRootElement;
        this.toolbarElement = toolbarElement;
        this.contentEditableElement = contentEditableElement;
    }

    toggleMenu(dropdownMenuElement) {
        this.closeAllMenus(dropdownMenuElement);
        dropdownMenuElement.classList.toggle("webhacker-menu--hidden");

        dropdownMenuElement.style.left = "unset";
        dropdownMenuElement.style.right = "unset";

        if (!dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            setTimeout(() => {
                const menuRect = dropdownMenuElement.getBoundingClientRect();
                const editorRect = this.editorRootElement.getBoundingClientRect();

                if (menuRect.right > editorRect.right) {
                    dropdownMenuElement.style.left = "unset";
                    dropdownMenuElement.style.right = "0";
                }
                if (dropdownMenuElement.getBoundingClientRect().left < editorRect.left) {
                    dropdownMenuElement.style.left = "0";
                    dropdownMenuElement.style.right = "unset";
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
    }

    closeAllMenus(exceptDropdownMenuElement = null) {
        this.editorRootElement.querySelectorAll(".webhacker-menu").forEach(menuElement => {
            if (menuElement !== exceptDropdownMenuElement) {
                menuElement.classList.add("webhacker-menu--hidden");
            }
        });
    }

    emitChange() {
        if (typeof this.editorOptions.onChange === "function") {
            this.editorOptions.onChange(this.getHTML());
        }
    }

    syncToggleStates() {
        const readCommandState = commandName => String(queryEditorCommandState(this, commandName));
        const updateToggleButton = (key, value) => {
            if (this.trackedToggleButtonsMap[key]) {
                this.trackedToggleButtonsMap[key].setAttribute("aria-pressed", value);
            }
        };

        updateToggleButton("bold", readCommandState("bold"));
        updateToggleButton("italic", readCommandState("italic"));
        updateToggleButton("underline", readCommandState("underline"));
        updateToggleButton("unorderedList", readCommandState("insertUnorderedList"));
        updateToggleButton("orderedList", readCommandState("insertOrderedList"));
        updateToggleButton("alignLeft", readCommandState("justifyLeft"));
        updateToggleButton("alignCenter", readCommandState("justifyCenter"));
        updateToggleButton("alignRight", readCommandState("justifyRight"));

        const selection = window.getSelection();
        const anchorElement =
            selection && selection.anchorNode
                ? selection.anchorNode.nodeType === 3
                    ? selection.anchorNode.parentElement
                    : (selection.anchorNode as Element | null)
                : null;
        const activeCodeElement = anchorElement ? anchorElement.closest("pre code") : null;
        const activeTable = anchorElement ? anchorElement.closest("table") : null;

        this.toolbarElement
            .querySelectorAll<HTMLButtonElement>(".webhacker-button[data-control-id]")
            .forEach(buttonElement => {
            const controlId = buttonElement.getAttribute("data-control-id");
            const shouldDisable =
                (Boolean(activeCodeElement) && BLOCKED_IN_CODE_BLOCK.has(controlId)) ||
                (Boolean(activeTable) && BLOCKED_IN_TABLE.has(controlId));

            buttonElement.disabled = shouldDisable;
            buttonElement.setAttribute("aria-disabled", shouldDisable ? "true" : "false");
            });
    }

    saveSelectionRange() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        return selection.getRangeAt(0).cloneRange();
    }

    restoreSelectionRange(savedRange) {
        if (!savedRange) return;
        const selection = window.getSelection();
        if (!selection) return;
        try {
            selection.removeAllRanges();
            selection.addRange(savedRange);
        } catch {
        }
    }

    setTheme(themeOptions) {
        applyThemeVariables(this.editorRootElement, themeOptions || null);
    }

    captureHistorySnapshot(kind = "command") {
        return captureHistorySnapshot(this, kind);
    }

    undoFromHistory() {
        return undoFromHistory(this);
    }

    redoFromHistory() {
        return redoFromHistory(this);
    }

    bindFloatingToolbar() {
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
    }

    bindFocusTracking() {
        this.contentEditableElement.addEventListener("focus", () => setActiveEditor(this));
        this.contentEditableElement.addEventListener("mousedown", () => setActiveEditor(this));
        this.toolbarElement.addEventListener("mousedown", () => setActiveEditor(this));
    }
}
