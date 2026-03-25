import katex from "katex";
import { escapeHtml } from "../../sanitize/utils";
import { createElement } from "../../ui/elements";
import WebHackerEditor from "../../core/WebHackerEditor";
import { placeCaretAfterElement } from "../editor/selection";
import ru from "../../translations/ru.yml";
import en from "../../translations/en.yml";

const MATH_CODE_SELECTOR = "code.language-math";
const translations = { ru, en };
let installed = false;

export function normalizeMathLatexValue(value) {
    return String(value ?? "").replace(/\u200B/g, "").trim();
}

export function getMathCodeElement(containerElement) {
    if (!containerElement || !containerElement.querySelector) return null;
    return containerElement.querySelector(MATH_CODE_SELECTOR);
}

export function getMathLatexValue(containerElement) {
    const codeElement = getMathCodeElement(containerElement);
    if (!codeElement) return "";
    return normalizeMathLatexValue(codeElement.textContent ?? "");
}

export function setMathLatexValue(containerElement, nextLatexValue) {
    if (!containerElement) return null;

    let codeElement = getMathCodeElement(containerElement);
    if (!codeElement) {
        codeElement = document.createElement("code");
        containerElement.appendChild(codeElement);
    }

    codeElement.className = "language-math";
    codeElement.textContent = normalizeMathLatexValue(nextLatexValue);
    return codeElement;
}

export function renderMathLatexToHtml(latexValue) {
    const normalizedLatexValue = normalizeMathLatexValue(latexValue);
    if (!normalizedLatexValue.length) return "";

    try {
        return katex.renderToString(normalizedLatexValue, {
            displayMode: true,
            output: "html",
            throwOnError: false,
            strict: "ignore"
        });
    } catch {
        return `<span class="webhacker-math__status">${escapeHtml(normalizedLatexValue)}</span>`;
    }
}

function forEachMathFigure(rootElement, callback) {
    if (!rootElement || !rootElement.querySelectorAll) return;
    rootElement.querySelectorAll("figure").forEach(figureElement => {
        if (!getMathCodeElement(figureElement)) return;
        callback(figureElement);
    });
}

export function stripMathRuntimeUi(rootElement) {
    if (!rootElement || !rootElement.querySelectorAll) return;

    rootElement
        .querySelectorAll(".webhacker-math__preview, .webhacker-math__actions")
        .forEach(element => element.remove());

    forEachMathFigure(rootElement, figureElement => {
        figureElement.classList.remove("webhacker-math");
        figureElement.removeAttribute("contenteditable");

        const codeElement = getMathCodeElement(figureElement);
        if (!codeElement) return;

        codeElement.className = "language-math";
        codeElement.removeAttribute("contenteditable");
        codeElement.removeAttribute("aria-hidden");
        codeElement.textContent = getMathLatexValue(figureElement);
    });
}

export function renderMathBlocksInElement(rootElement) {
    forEachMathFigure(rootElement, figureElement => {
        figureElement
            .querySelectorAll(".webhacker-math__actions")
            .forEach(actionsElement => actionsElement.remove());

        const codeElement = getMathCodeElement(figureElement);
        const latexValue = getMathLatexValue(figureElement);

        let previewElement = figureElement.querySelector(".webhacker-math__preview");
        if (!previewElement) {
            previewElement = document.createElement("div");
            previewElement.className = "webhacker-math__preview";
            figureElement.appendChild(previewElement);
        }

        previewElement.setAttribute("contenteditable", "false");
        previewElement.innerHTML = renderMathLatexToHtml(latexValue);

        figureElement.classList.add("webhacker-math");
        codeElement.className = "language-math webhacker-math__source";
        codeElement.setAttribute("aria-hidden", "true");
    });
}

function getMathTranslations(editor) {
    const lang = editor.editorOptions.language === "en" ? "en" : "ru";
    return translations[lang].math;
}

function createMathActionButton(className, iconClassName, titleText, onClickHandler) {
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

function ensureMathBlockUi(editor, figureElement) {
    const codeElement = getMathCodeElement(figureElement);
    if (!codeElement) return;

    const mathT = getMathTranslations(editor);
    const latexValue = getMathLatexValue(figureElement);
    setMathLatexValue(figureElement, latexValue);

    figureElement.classList.add("webhacker-math");
    figureElement.setAttribute("contenteditable", "false");

    codeElement.className = "language-math webhacker-math__source";
    codeElement.setAttribute("aria-hidden", "true");
    codeElement.setAttribute("contenteditable", "false");

    let previewElement = figureElement.querySelector(".webhacker-math__preview");
    if (!previewElement) {
        previewElement = createElement("div", "webhacker-math__preview", {
            contenteditable: "false"
        });
        figureElement.appendChild(previewElement);
    }
    previewElement.innerHTML = renderMathLatexToHtml(latexValue);

    let actionsElement = figureElement.querySelector(".webhacker-math__actions");
    if (!actionsElement) {
        actionsElement = createElement("div", "webhacker-math__actions", {
            contenteditable: "false"
        });

        const editButtonElement = createMathActionButton(
            "webhacker-math__button webhacker-math__button--edit",
            "fa-solid fa-pen",
            mathT.editBlock,
            () => {
                if (typeof editor.openMathComposerForFigure === "function") {
                    editor.openMathComposerForFigure(figureElement);
                }
            }
        );
        const deleteButtonElement = createMathActionButton(
            "webhacker-math__button webhacker-math__button--delete",
            "fa-solid fa-trash-can",
            mathT.deleteBlock,
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
        const exitButtonElement = createMathActionButton(
            "webhacker-math__button webhacker-math__button--exit",
            "fa-solid fa-right-from-bracket",
            mathT.exitBlock,
            () => {
                editor.contentEditableElement.focus();
                editor.exitMathBlockToNextLine(figureElement);
            }
        );

        actionsElement.append(editButtonElement, deleteButtonElement, exitButtonElement);
        figureElement.appendChild(actionsElement);
    }
}

function resolveMathFigureFromSelectionRange(range) {
    if (!range) return null;

    const startContainer =
        range.startContainer && range.startContainer.nodeType === 3
            ? range.startContainer.parentNode
            : range.startContainer;

    const nearestFigureElement =
        startContainer && startContainer.closest ? startContainer.closest("figure") : null;
    if (nearestFigureElement && getMathCodeElement(nearestFigureElement)) return nearestFigureElement;

    if (!startContainer || !startContainer.childNodes) return null;
    const candidateElement = startContainer.childNodes[Math.max(0, range.startOffset - 1)];
    if (
        candidateElement &&
        candidateElement.nodeType === 1 &&
        candidateElement.matches("figure") &&
        getMathCodeElement(candidateElement)
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

function resolveMathInsertionRange(editor) {
    const selection = window.getSelection();
    const activeRange =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
    if (activeRange && isRangeInsideEditor(editor, activeRange)) return activeRange;

    const savedRange = editor.currentSavedSelectionRange;
    if (savedRange && isRangeInsideEditor(editor, savedRange)) return savedRange.cloneRange();
    return null;
}

export function installMathFeature(WebHackerEditorClass = WebHackerEditor) {
    if (installed) return;
    installed = true;

    const originalHighlightCodeBlocks = WebHackerEditorClass.prototype.highlightCodeBlocks;
    WebHackerEditorClass.prototype.highlightCodeBlocks = function () {
        if (typeof originalHighlightCodeBlocks === "function") {
            originalHighlightCodeBlocks.call(this);
        }
        this.renderMathBlocks();
    };

    const originalGetSerializableEditorHtml = WebHackerEditorClass.prototype.getSerializableEditorHtml;
    WebHackerEditorClass.prototype.getSerializableEditorHtml = function () {
        const rawHtml =
            typeof originalGetSerializableEditorHtml === "function"
                ? originalGetSerializableEditorHtml.call(this)
                : this.contentEditableElement.innerHTML;

        const templateElement = document.createElement("template");
        templateElement.innerHTML = rawHtml;
        stripMathRuntimeUi(templateElement.content);
        return templateElement.innerHTML;
    };

    WebHackerEditorClass.prototype.getMathLatexValue = function (figureElement) {
        return getMathLatexValue(figureElement);
    };

    WebHackerEditorClass.prototype.getMathFigureAtSelection = function () {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        return resolveMathFigureFromSelectionRange(range);
    };

    WebHackerEditorClass.prototype.insertMathBlock = function (latexValue) {
        const normalizedLatexValue = normalizeMathLatexValue(latexValue);
        if (!normalizedLatexValue.length) return null;

        const figureElement = document.createElement("figure");
        setMathLatexValue(figureElement, normalizedLatexValue);

        const insertionRange = resolveMathInsertionRange(this);
        if (insertionRange) {
            insertionRange.deleteContents();
            insertionRange.insertNode(figureElement);
        } else {
            this.contentEditableElement.appendChild(figureElement);
        }

        ensureMathBlockUi(this, figureElement);
        placeCaretAfterElement(figureElement);
        if (typeof this.captureHistorySnapshot === "function") {
            this.captureHistorySnapshot("command");
        }
        return figureElement;
    };

    WebHackerEditorClass.prototype.updateMathBlock = function (figureElement, latexValue) {
        if (!figureElement || !this.contentEditableElement.contains(figureElement)) return null;

        const normalizedLatexValue = normalizeMathLatexValue(latexValue);
        if (!normalizedLatexValue.length) return null;

        setMathLatexValue(figureElement, normalizedLatexValue);
        ensureMathBlockUi(this, figureElement);
        if (typeof this.captureHistorySnapshot === "function") {
            this.captureHistorySnapshot("command");
        }
        return figureElement;
    };

    WebHackerEditorClass.prototype.renderMathBlocks = function () {
        this.contentEditableElement.querySelectorAll("figure").forEach(figureElement => {
            if (!getMathCodeElement(figureElement)) return;
            ensureMathBlockUi(this, figureElement);
        });
    };

    WebHackerEditorClass.prototype.exitMathBlockToNextLine = function (figureElement) {
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

function autoRenderMathContent() {
    if (typeof document === "undefined") return;
    document.querySelectorAll(".webhacker-view-content").forEach(rootElement => {
        renderMathBlocksInElement(rootElement);
    });
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", autoRenderMathContent, { once: true });
    } else {
        autoRenderMathContent();
    }
}
