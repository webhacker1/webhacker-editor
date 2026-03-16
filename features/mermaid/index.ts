import mermaid from "mermaid";
import { escapeHtml } from "../../sanitize/utils";
import { createElement } from "../../ui/elements";
import WebHackerEditor from "../../core/WebHackerEditor";
import { placeCaretAfterElement } from "../editor/selection";
import ru from "../../translations/ru.yml";
import en from "../../translations/en.yml";

const MERMAID_CODE_SELECTOR = "code.language-mermaid";
const MERMAID_RENDERED_SOURCE_ATTR = "data-rendered-source";
const translations = { ru, en };

let installed = false;
let mermaidInitialized = false;
let renderIdSeed = 0;
let renderTokenSeed = 0;
const figureRenderTokenMap = new WeakMap<Element, number>();

function ensureMermaidInitialized() {
    if (mermaidInitialized) return;
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "default"
    });
    mermaidInitialized = true;
}

export function normalizeMermaidSourceValue(value) {
    return String(value ?? "").replace(/\u200B/g, "").trim();
}

export function getMermaidCodeElement(containerElement) {
    if (!containerElement || !containerElement.querySelector) return null;
    return containerElement.querySelector(MERMAID_CODE_SELECTOR);
}

export function getMermaidSourceValue(containerElement) {
    const codeElement = getMermaidCodeElement(containerElement);
    if (!codeElement) return "";
    return normalizeMermaidSourceValue(codeElement.textContent ?? "");
}

export function setMermaidSourceValue(containerElement, nextSourceValue) {
    if (!containerElement) return null;

    let codeElement = getMermaidCodeElement(containerElement);
    if (!codeElement) {
        codeElement = document.createElement("code");
        containerElement.appendChild(codeElement);
    }

    codeElement.className = "language-mermaid";
    codeElement.textContent = normalizeMermaidSourceValue(nextSourceValue);
    return codeElement;
}

export async function renderMermaidSourceToHtml(sourceValue) {
    const normalizedSource = normalizeMermaidSourceValue(sourceValue);
    if (!normalizedSource.length) return "";

    ensureMermaidInitialized();

    try {
        const renderId = `wh-mermaid-${++renderIdSeed}`;
        const renderResult = await mermaid.render(renderId, normalizedSource);
        if (typeof renderResult === "string") return renderResult;
        if (renderResult && typeof renderResult.svg === "string") return renderResult.svg;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error || normalizedSource);
        return `<div class="webhacker-mermaid__status">${escapeHtml(errorMessage)}</div>`;
    }

    return `<div class="webhacker-mermaid__status">${escapeHtml(normalizedSource)}</div>`;
}

function forEachMermaidFigure(rootElement, callback) {
    if (!rootElement || !rootElement.querySelectorAll) return;
    rootElement.querySelectorAll("figure").forEach(figureElement => {
        if (!getMermaidCodeElement(figureElement)) return;
        callback(figureElement);
    });
}

function createMermaidActionButton(className, iconClassName, titleText, onClickHandler) {
    const buttonElement = createElement("button", className, {
        type: "button",
        "aria-label": titleText,
        title: titleText,
        "data-tooltip": titleText,
        contenteditable: "false"
    });
    buttonElement.innerHTML = `<span class="${iconClassName}" aria-hidden="true"></span>`;
    buttonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
    });
    buttonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        onClickHandler();
    });
    return buttonElement;
}

function applyMermaidRuntimeState(figureElement) {
    const codeElement = getMermaidCodeElement(figureElement);
    if (!codeElement) return { codeElement: null, previewElement: null, sourceValue: "" };

    const sourceValue = getMermaidSourceValue(figureElement);
    setMermaidSourceValue(figureElement, sourceValue);

    figureElement.classList.add("webhacker-mermaid");
    figureElement.setAttribute("contenteditable", "false");

    codeElement.className = "language-mermaid webhacker-mermaid__source";
    codeElement.setAttribute("aria-hidden", "true");
    codeElement.setAttribute("contenteditable", "false");

    let previewElement = figureElement.querySelector(".webhacker-mermaid__preview") as HTMLElement | null;
    if (!previewElement) {
        previewElement = createElement("div", "webhacker-mermaid__preview", {
            contenteditable: "false"
        }) as HTMLElement;
        figureElement.appendChild(previewElement);
    }

    return { codeElement, previewElement, sourceValue };
}

function renderMermaidPreview(figureElement, previewElement, sourceValue) {
    const lastRenderedSource = previewElement.getAttribute(MERMAID_RENDERED_SOURCE_ATTR) || "";
    if (lastRenderedSource === sourceValue) return;

    const renderToken = ++renderTokenSeed;
    figureRenderTokenMap.set(figureElement, renderToken);
    previewElement.setAttribute("aria-busy", "true");

    if (!sourceValue.length) {
        previewElement.innerHTML = "";
        previewElement.setAttribute(MERMAID_RENDERED_SOURCE_ATTR, "");
        previewElement.removeAttribute("aria-busy");
        return;
    }

    renderMermaidSourceToHtml(sourceValue).then(renderedHtml => {
        if (figureRenderTokenMap.get(figureElement) !== renderToken) return;
        previewElement.innerHTML = renderedHtml;
        previewElement.setAttribute(MERMAID_RENDERED_SOURCE_ATTR, sourceValue);
        previewElement.removeAttribute("aria-busy");
    });
}

function getMermaidTranslations(editor) {
    const lang = editor.editorOptions.language === "en" ? "en" : "ru";
    return translations[lang].mermaid;
}

function ensureMermaidBlockUi(editor, figureElement) {
    const { codeElement, previewElement, sourceValue } = applyMermaidRuntimeState(figureElement);
    if (!codeElement || !previewElement) return;

    renderMermaidPreview(figureElement, previewElement, sourceValue);

    const mermaidT = getMermaidTranslations(editor);
    let actionsElement = figureElement.querySelector(".webhacker-mermaid__actions");
    if (!actionsElement) {
        actionsElement = createElement("div", "webhacker-mermaid__actions", {
            contenteditable: "false"
        });

        const editButtonElement = createMermaidActionButton(
            "webhacker-mermaid__button webhacker-mermaid__button--edit",
            "fa-solid fa-pen",
            mermaidT.editBlock,
            () => {
                if (typeof editor.openMermaidComposerForFigure === "function") {
                    editor.openMermaidComposerForFigure(figureElement);
                }
            }
        );
        const deleteButtonElement = createMermaidActionButton(
            "webhacker-mermaid__button webhacker-mermaid__button--delete",
            "fa-solid fa-trash-can",
            mermaidT.deleteBlock,
            () => {
                editor.contentEditableElement.focus();
                if (editor.contentEditableElement.contains(figureElement)) {
                    figureElement.remove();
                }
                if (typeof editor.captureHistorySnapshot === "function") {
                    editor.captureHistorySnapshot("command");
                }
                editor.emitChange();
                editor.syncToggleStates();
            }
        );
        const exitButtonElement = createMermaidActionButton(
            "webhacker-mermaid__button webhacker-mermaid__button--exit",
            "fa-solid fa-right-from-bracket",
            mermaidT.exitBlock,
            () => {
                editor.contentEditableElement.focus();
                editor.exitMermaidBlockToNextLine(figureElement);
            }
        );

        actionsElement.append(editButtonElement, deleteButtonElement, exitButtonElement);
        figureElement.appendChild(actionsElement);
    }
}

export function stripMermaidRuntimeUi(rootElement) {
    if (!rootElement || !rootElement.querySelectorAll) return;

    rootElement
        .querySelectorAll(".webhacker-mermaid__preview, .webhacker-mermaid__actions")
        .forEach(element => element.remove());

    forEachMermaidFigure(rootElement, figureElement => {
        figureElement.classList.remove("webhacker-mermaid");
        figureElement.removeAttribute("contenteditable");

        const codeElement = getMermaidCodeElement(figureElement);
        if (!codeElement) return;

        codeElement.className = "language-mermaid";
        codeElement.removeAttribute("contenteditable");
        codeElement.removeAttribute("aria-hidden");
        codeElement.textContent = getMermaidSourceValue(figureElement);
    });
}

export function renderMermaidBlocksInElement(rootElement) {
    forEachMermaidFigure(rootElement, figureElement => {
        figureElement
            .querySelectorAll(".webhacker-mermaid__actions")
            .forEach(actionsElement => actionsElement.remove());

        const { codeElement, previewElement, sourceValue } = applyMermaidRuntimeState(figureElement);
        if (!codeElement || !previewElement) return;

        renderMermaidPreview(figureElement, previewElement, sourceValue);
    });
}

function resolveMermaidFigureFromSelectionRange(range) {
    if (!range) return null;

    const startContainer =
        range.startContainer && range.startContainer.nodeType === 3
            ? range.startContainer.parentNode
            : range.startContainer;

    const nearestFigureElement =
        startContainer && startContainer.closest ? startContainer.closest("figure") : null;
    if (nearestFigureElement && getMermaidCodeElement(nearestFigureElement)) return nearestFigureElement;

    if (!startContainer || !startContainer.childNodes) return null;
    const candidateElement = startContainer.childNodes[Math.max(0, range.startOffset - 1)];
    if (
        candidateElement &&
        candidateElement.nodeType === 1 &&
        candidateElement.matches("figure") &&
        getMermaidCodeElement(candidateElement)
    ) {
        return candidateElement;
    }
    return null;
}

function isRangeInsideEditor(editor, range) {
    if (!range) return false;
    return (
        editor.contentEditableElement.contains(range.startContainer) &&
        editor.contentEditableElement.contains(range.endContainer)
    );
}

function resolveMermaidInsertionRange(editor) {
    const selection = window.getSelection();
    const activeRange =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
    if (activeRange && isRangeInsideEditor(editor, activeRange)) return activeRange;

    const savedRange = editor.currentSavedSelectionRange;
    if (savedRange && isRangeInsideEditor(editor, savedRange)) return savedRange.cloneRange();
    return null;
}

export function installMermaidFeature(WebHackerEditorClass = WebHackerEditor) {
    if (installed) return;
    installed = true;

    const originalHighlightCodeBlocks = WebHackerEditorClass.prototype.highlightCodeBlocks;
    WebHackerEditorClass.prototype.highlightCodeBlocks = function () {
        if (typeof originalHighlightCodeBlocks === "function") {
            originalHighlightCodeBlocks.call(this);
        }
        this.renderMermaidBlocks();
    };

    const originalGetSerializableEditorHtml = WebHackerEditorClass.prototype.getSerializableEditorHtml;
    WebHackerEditorClass.prototype.getSerializableEditorHtml = function () {
        const rawHtml =
            typeof originalGetSerializableEditorHtml === "function"
                ? originalGetSerializableEditorHtml.call(this)
                : this.contentEditableElement.innerHTML;

        const templateElement = document.createElement("template");
        templateElement.innerHTML = rawHtml;
        stripMermaidRuntimeUi(templateElement.content);
        return templateElement.innerHTML;
    };

    WebHackerEditorClass.prototype.getMermaidSourceValue = function (figureElement) {
        return getMermaidSourceValue(figureElement);
    };

    WebHackerEditorClass.prototype.getMermaidFigureAtSelection = function () {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        return resolveMermaidFigureFromSelectionRange(range);
    };

    WebHackerEditorClass.prototype.insertMermaidBlock = function (sourceValue) {
        const normalizedSourceValue = normalizeMermaidSourceValue(sourceValue);
        if (!normalizedSourceValue.length) return null;

        const figureElement = document.createElement("figure");
        setMermaidSourceValue(figureElement, normalizedSourceValue);

        const insertionRange = resolveMermaidInsertionRange(this);
        if (insertionRange) {
            insertionRange.deleteContents();
            insertionRange.insertNode(figureElement);
        } else {
            this.contentEditableElement.appendChild(figureElement);
        }

        ensureMermaidBlockUi(this, figureElement);
        placeCaretAfterElement(figureElement);
        if (typeof this.captureHistorySnapshot === "function") {
            this.captureHistorySnapshot("command");
        }
        return figureElement;
    };

    WebHackerEditorClass.prototype.updateMermaidBlock = function (figureElement, sourceValue) {
        if (!figureElement || !this.contentEditableElement.contains(figureElement)) return null;

        const normalizedSourceValue = normalizeMermaidSourceValue(sourceValue);
        if (!normalizedSourceValue.length) return null;

        setMermaidSourceValue(figureElement, normalizedSourceValue);
        ensureMermaidBlockUi(this, figureElement);
        if (typeof this.captureHistorySnapshot === "function") {
            this.captureHistorySnapshot("command");
        }
        return figureElement;
    };

    WebHackerEditorClass.prototype.renderMermaidBlocks = function () {
        this.contentEditableElement.querySelectorAll("figure").forEach(figureElement => {
            if (!getMermaidCodeElement(figureElement)) return;
            ensureMermaidBlockUi(this, figureElement);
        });
    };

    WebHackerEditorClass.prototype.exitMermaidBlockToNextLine = function (figureElement) {
        if (!figureElement || !figureElement.parentNode) return false;

        const paragraphElement = document.createElement("p");
        const caretAnchorTextNode = document.createTextNode("\u200B");
        paragraphElement.appendChild(caretAnchorTextNode);
        figureElement.insertAdjacentElement("afterend", paragraphElement);

        const range = document.createRange();
        range.setStart(caretAnchorTextNode, caretAnchorTextNode.nodeValue.length);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        this.emitChange();
        this.syncToggleStates();
        return true;
    };
}

function autoRenderMermaidContent() {
    if (typeof document === "undefined") return;
    document.querySelectorAll(".webhacker-view-content").forEach(rootElement => {
        renderMermaidBlocksInElement(rootElement);
    });
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", autoRenderMermaidContent, { once: true });
    } else {
        autoRenderMermaidContent();
    }
}
