import WebHackerEditor from "@/core/indexCore";
import { placeCaretAfterElement } from "@/features/editor/selection";
import {
    getMathCodeElement,
    getMathLatexValue,
    MATH_PREVIEW_LATEX_ATTR,
    normalizeMathLatexValue,
    renderMathLatexToHtml,
    setMathLatexValue,
    stripMathRuntimeUi,
} from "@/features/math/runtime";
import en from "@/translations/en.yml";
import ru from "@/translations/ru.yml";
import { createElement } from "@/ui/indexUi";

const translations = { ru, en };
let installed = false;

function getMathTranslations(editor) {
    const lang = editor.editorOptions.language === "en" ? "en" : "ru";
    return translations[lang].math;
}

function createMathActionButton(className: string, iconClassName: string, titleText: string, onClickHandler): HTMLButtonElement {
    const buttonElement = createElement("button", className, {
        type: "button",
        "aria-label": titleText,
        title: titleText,
        "data-tooltip": titleText,
        contenteditable: "false",
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

function ensureMathBlockUi(editor, figureElement: HTMLElement): void {
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

    let previewElement = figureElement.querySelector(".webhacker-math__preview") as HTMLElement | null;
    if (!previewElement) {
        previewElement = createElement("div", "webhacker-math__preview", {
            contenteditable: "false",
        });
        figureElement.appendChild(previewElement);
    }

    if (previewElement.getAttribute(MATH_PREVIEW_LATEX_ATTR) !== latexValue) {
        previewElement.innerHTML = renderMathLatexToHtml(latexValue);
        previewElement.setAttribute(MATH_PREVIEW_LATEX_ATTR, latexValue);
    }

    let actionsElement = figureElement.querySelector(".webhacker-math__actions") as HTMLElement | null;
    if (!actionsElement) {
        actionsElement = createElement("div", "webhacker-math__actions", {
            contenteditable: "false",
        });

        const editButtonElement = createMathActionButton(
            "webhacker-math__button webhacker-math__button--edit",
            "fa-solid fa-pen",
            mathT.editBlock,
            () => {
                if (typeof editor.openMathComposerForFigure === "function") {
                    editor.openMathComposerForFigure(figureElement);
                }
            },
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
            },
        );
        const exitButtonElement = createMathActionButton(
            "webhacker-math__button webhacker-math__button--exit",
            "fa-solid fa-right-from-bracket",
            mathT.exitBlock,
            () => {
                editor.contentEditableElement.focus();
                editor.exitMathBlockToNextLine(figureElement);
            },
        );

        actionsElement.append(editButtonElement, deleteButtonElement, exitButtonElement);
        figureElement.appendChild(actionsElement);
    }
}

function resolveMathFigureFromSelectionRange(range: Range | null): HTMLElement | null {
    if (!range) return null;

    const startContainer =
        range.startContainer && range.startContainer.nodeType === 3
            ? range.startContainer.parentNode
            : range.startContainer;

    const nearestFigureElement =
        startContainer && (startContainer as Element).closest
            ? (startContainer as Element).closest("figure")
            : null;
    if (nearestFigureElement instanceof HTMLElement && getMathCodeElement(nearestFigureElement)) {
        return nearestFigureElement;
    }

    if (!startContainer || !(startContainer as ParentNode).childNodes) return null;
    const candidateElement = (startContainer as ParentNode).childNodes[Math.max(0, range.startOffset - 1)];
    if (
        candidateElement instanceof HTMLElement &&
        candidateElement.matches("figure") &&
        getMathCodeElement(candidateElement)
    ) {
        return candidateElement;
    }

    return null;
}

function isRangeInsideEditor(editor, range: Range | null): boolean {
    if (!range) return false;

    return (
        editor.contentEditableElement.contains(range.startContainer) &&
        editor.contentEditableElement.contains(range.endContainer)
    );
}

function resolveMathInsertionRange(editor): Range | null {
    const selection = window.getSelection();
    const activeRange =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
    if (activeRange && isRangeInsideEditor(editor, activeRange)) return activeRange;

    const savedRange = editor.currentSavedSelectionRange;
    if (savedRange && isRangeInsideEditor(editor, savedRange)) return savedRange.cloneRange();

    return null;
}

export function installMathFeature(WebHackerEditorClass = WebHackerEditor): void {
    if (installed) return;
    installed = true;

    const originalHighlightCodeBlocks = WebHackerEditorClass.prototype.highlightCodeBlocks;
    WebHackerEditorClass.prototype.highlightCodeBlocks = function (): void {
        if (typeof originalHighlightCodeBlocks === "function") {
            originalHighlightCodeBlocks.call(this);
        }
        this.renderMathBlocks();
    };

    const originalGetSerializableEditorHtml = WebHackerEditorClass.prototype.getSerializableEditorHtml;
    WebHackerEditorClass.prototype.getSerializableEditorHtml = function (): string {
        const rawHtml =
            typeof originalGetSerializableEditorHtml === "function"
                ? originalGetSerializableEditorHtml.call(this)
                : this.contentEditableElement.innerHTML;

        const templateElement = document.createElement("template");
        templateElement.innerHTML = rawHtml;
        stripMathRuntimeUi(templateElement.content);

        return templateElement.innerHTML;
    };

    WebHackerEditorClass.prototype.getMathLatexValue = function (figureElement: HTMLElement): string {
        return getMathLatexValue(figureElement);
    };

    WebHackerEditorClass.prototype.getMathFigureAtSelection = function (): HTMLElement | null {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        return resolveMathFigureFromSelectionRange(range);
    };

    WebHackerEditorClass.prototype.insertMathBlock = function (latexValue: string): HTMLElement | null {
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

    WebHackerEditorClass.prototype.updateMathBlock = function (
        figureElement: HTMLElement,
        latexValue: string,
    ): HTMLElement | null {
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

    WebHackerEditorClass.prototype.renderMathBlocks = function (): void {
        this.contentEditableElement.querySelectorAll("figure").forEach(figureElement => {
            if (!(figureElement instanceof HTMLElement)) return;
            if (!getMathCodeElement(figureElement)) return;
            ensureMathBlockUi(this, figureElement);
        });
    };

    WebHackerEditorClass.prototype.exitMathBlockToNextLine = function (figureElement: HTMLElement): boolean {
        if (!figureElement || !figureElement.parentNode) return false;

        const paragraphElement = document.createElement("p");
        const caretAnchorTextNode = document.createTextNode("\u200B");
        paragraphElement.appendChild(caretAnchorTextNode);
        figureElement.insertAdjacentElement("afterend", paragraphElement);

        const range = document.createRange();
        range.setStart(caretAnchorTextNode, caretAnchorTextNode.nodeValue.length);
        range.collapse(true);

        const selection = window.getSelection();
        if (!selection) return false;
        selection.removeAllRanges();
        selection.addRange(range);

        this.emitChange();
        this.syncToggleStates();

        return true;
    };
}
