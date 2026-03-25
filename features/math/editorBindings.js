import WebHackerEditor from "../../core/WebHackerEditor.js";
import { createElement } from "../../ui/elements.js";
import { placeCaretAfterElement } from "../editor/selection.js";
import ru from "../../translations/ru.yml";
import en from "../../translations/en.yml";
import {
    getMathCodeElement,
    getMathLatexValue,
    normalizeMathLatexValue,
    renderMathLatexToHtml,
    setMathLatexValue,
    stripMathRuntimeUi
} from "./engine.js";

const translations = { ru, en };

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

const originalHighlightCodeBlocks = WebHackerEditor.prototype.highlightCodeBlocks;
WebHackerEditor.prototype.highlightCodeBlocks = function () {
    if (typeof originalHighlightCodeBlocks === "function") {
        originalHighlightCodeBlocks.call(this);
    }
    this.renderMathBlocks();
};

const originalGetSerializableEditorHtml = WebHackerEditor.prototype.getSerializableEditorHtml;
WebHackerEditor.prototype.getSerializableEditorHtml = function () {
    const rawHtml =
        typeof originalGetSerializableEditorHtml === "function"
            ? originalGetSerializableEditorHtml.call(this)
            : this.contentEditableElement.innerHTML;

    const templateElement = document.createElement("template");
    templateElement.innerHTML = rawHtml;
    stripMathRuntimeUi(templateElement.content);
    return templateElement.innerHTML;
};

WebHackerEditor.prototype.getMathLatexValue = function (figureElement) {
    return getMathLatexValue(figureElement);
};

WebHackerEditor.prototype.getMathFigureAtSelection = function () {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    return resolveMathFigureFromSelectionRange(range);
};

WebHackerEditor.prototype.insertMathBlock = function (latexValue) {
    const normalizedLatexValue = normalizeMathLatexValue(latexValue);
    if (!normalizedLatexValue.length) return null;

    const figureElement = document.createElement("figure");
    setMathLatexValue(figureElement, normalizedLatexValue);

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(figureElement);
    } else {
        this.contentEditableElement.appendChild(figureElement);
    }

    ensureMathBlockUi(this, figureElement);
    placeCaretAfterElement(figureElement);
    return figureElement;
};

WebHackerEditor.prototype.updateMathBlock = function (figureElement, latexValue) {
    if (!figureElement || !this.contentEditableElement.contains(figureElement)) return null;

    const normalizedLatexValue = normalizeMathLatexValue(latexValue);
    if (!normalizedLatexValue.length) return null;

    setMathLatexValue(figureElement, normalizedLatexValue);
    ensureMathBlockUi(this, figureElement);
    return figureElement;
};

WebHackerEditor.prototype.renderMathBlocks = function () {
    this.contentEditableElement.querySelectorAll("figure").forEach(figureElement => {
        if (!getMathCodeElement(figureElement)) return;
        ensureMathBlockUi(this, figureElement);
    });
};

WebHackerEditor.prototype.exitMathBlockToNextLine = function (figureElement) {
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
