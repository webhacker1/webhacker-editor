import { queryEditorCommandState, setActiveEditor } from "@/core/richtext/indexRichtext";
import { normalizeInvalidInlineMarkContainers, normalizeRootInlineFlow } from "@/core/richtext/utils/indexUtils";
import { buildToolbar } from "@/features/editor/toolbar/indexToolbar";
import { sanitizeHtmlStringToSafeHtml } from "@/sanitize/indexSanitize";
import { applyThemeVariables, createElement } from "@/ui/indexUi";
import {
    captureHistorySnapshot,
    initEditorRuntime,
    redoFromHistory,
    resetHistory,
    undoFromHistory
} from "@/core/richtext/indexRichtext";
import ru from "@/translations/ru.yml";
import en from "@/translations/en.yml";

const TRANSLATIONS = { ru, en };

const BLOCKED_IN_CODE_BLOCK = new Set([
    "code",
    "math",
    "mermaid",
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

const BLOCKED_IN_TABLE = new Set(["code", "math", "mermaid", "table"]);

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
    outsideMenuMouseDownHandler: ((event: MouseEvent) => void) | null;

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

    getMermaidSourceValue!: (figureElement: HTMLElement) => string;
    getMermaidFigureAtSelection!: () => HTMLElement | null;
    insertMermaidBlock!: (sourceValue: string) => HTMLElement | null;
    updateMermaidBlock!: (figureElement: HTMLElement, sourceValue: string) => HTMLElement | null;
    renderMermaidBlocks!: () => void;
    exitMermaidBlockToNextLine!: (figureElement: HTMLElement) => boolean;
    openMermaidComposerForFigure?: (figureElement: HTMLElement | null) => void;

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
        this.outsideMenuMouseDownHandler = null;

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
        normalizeRootInlineFlow(this.contentEditableElement);
        normalizeInvalidInlineMarkContainers(this.contentEditableElement);
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
        const shouldOpen = dropdownMenuElement.classList.contains("webhacker-menu--hidden");
        this.closeAllMenus(shouldOpen ? dropdownMenuElement : null);
        dropdownMenuElement.classList.toggle("webhacker-menu--hidden", !shouldOpen);

        dropdownMenuElement.style.left = "unset";
        dropdownMenuElement.style.right = "unset";

        this.detachOutsideMenuMouseDownListener();

        if (shouldOpen) {
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

            const dropdownContainerElement = dropdownMenuElement.closest(".webhacker-dropdown");
            this.outsideMenuMouseDownHandler = event => {
                const eventTarget = event.target as Node | null;
                const isInsideDropdown = dropdownContainerElement
                    ? dropdownContainerElement.contains(eventTarget)
                    : dropdownMenuElement.contains(eventTarget);

                if (!isInsideDropdown) this.closeAllMenus();
            };
            document.addEventListener("mousedown", this.outsideMenuMouseDownHandler, true);
        }
    }

    closeAllMenus(exceptDropdownMenuElement = null) {
        this.editorRootElement.querySelectorAll(".webhacker-menu").forEach(menuElement => {
            if (menuElement !== exceptDropdownMenuElement) {
                menuElement.classList.add("webhacker-menu--hidden");
            }
        });

        const hasOpenedMenus = this.editorRootElement.querySelector(".webhacker-menu:not(.webhacker-menu--hidden)");
        if (!hasOpenedMenus) this.detachOutsideMenuMouseDownListener();
    }

    detachOutsideMenuMouseDownListener() {
        if (!this.outsideMenuMouseDownHandler) return;
        document.removeEventListener("mousedown", this.outsideMenuMouseDownHandler, true);
        this.outsideMenuMouseDownHandler = null;
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
        if (!savedRange.startContainer.isConnected || !savedRange.endContainer.isConnected) return;
        selection.removeAllRanges();
        selection.addRange(savedRange);
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
