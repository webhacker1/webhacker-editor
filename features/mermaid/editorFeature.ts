import WebHackerEditor from "@/core/indexCore";
import { placeCaretAfterElement } from "@/features/editor/selection";
import {
    applyMermaidRuntimeState,
    getMermaidCodeElement,
    getMermaidSourceValue,
    normalizeMermaidSourceValue,
    renderMermaidPreview,
    setMermaidSourceValue,
    stripMermaidRuntimeUi,
} from "@/features/mermaid/runtime";
import en from "@/translations/en.yml";
import ru from "@/translations/ru.yml";
import { createElement } from "@/ui/indexUi";
import { insertBlockElement } from "@/features/editor/insertBlock";

const translations = { ru, en };
let installed = false;

function getMermaidTranslations(editor) {
    const lang = editor.editorOptions.language === "en" ? "en" : "ru";
    return translations[lang].mermaid;
}

function createMermaidActionButton(
    className: string,
    iconClassName: string,
    titleText: string,
    onClickHandler,
): HTMLButtonElement {
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

function ensureMermaidBlockUi(editor, figureElement: HTMLElement): void {
    const { codeElement, previewElement, sourceValue } = applyMermaidRuntimeState(figureElement);
    if (!codeElement || !previewElement) return;

    renderMermaidPreview(figureElement, previewElement, sourceValue);

    const mermaidT = getMermaidTranslations(editor);
    let actionsElement = figureElement.querySelector(".webhacker-mermaid__actions") as HTMLElement | null;
    if (!actionsElement) {
        actionsElement = createElement("div", "webhacker-mermaid__actions", {
            contenteditable: "false",
        });

        const editButtonElement = createMermaidActionButton(
            "webhacker-mermaid__button webhacker-mermaid__button--edit",
            "fa-solid fa-pen",
            mermaidT.editBlock,
            () => {
                if (typeof editor.openMermaidComposerForFigure === "function") {
                    editor.openMermaidComposerForFigure(figureElement);
                }
            },
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
            },
        );
        const exitButtonElement = createMermaidActionButton(
            "webhacker-mermaid__button webhacker-mermaid__button--exit",
            "fa-solid fa-right-from-bracket",
            mermaidT.exitBlock,
            () => {
                editor.contentEditableElement.focus();
                editor.exitMermaidBlockToNextLine(figureElement);
            },
        );

        actionsElement.append(editButtonElement, deleteButtonElement, exitButtonElement);
        figureElement.appendChild(actionsElement);
    }
}

function resolveMermaidFigureFromSelectionRange(range: Range | null): HTMLElement | null {
    if (!range) return null;

    const startContainer =
        range.startContainer && range.startContainer.nodeType === 3
            ? range.startContainer.parentNode
            : range.startContainer;

    const nearestFigureElement =
        startContainer && (startContainer as Element).closest
            ? (startContainer as Element).closest("figure")
            : null;
    if (nearestFigureElement instanceof HTMLElement && getMermaidCodeElement(nearestFigureElement)) {
        return nearestFigureElement;
    }

    if (!startContainer || !(startContainer as ParentNode).childNodes) return null;
    const candidateElement = (startContainer as ParentNode).childNodes[Math.max(0, range.startOffset - 1)];
    if (
        candidateElement instanceof HTMLElement &&
        candidateElement.matches("figure") &&
        getMermaidCodeElement(candidateElement)
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

function resolveMermaidInsertionRange(editor): Range | null {
    const selection = window.getSelection();
    const activeRange =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
    if (activeRange && isRangeInsideEditor(editor, activeRange)) return activeRange;

    const savedRange = editor.currentSavedSelectionRange;
    if (savedRange && isRangeInsideEditor(editor, savedRange)) return savedRange.cloneRange();

    return null;
}

export function installMermaidFeature(WebHackerEditorClass = WebHackerEditor): void {
    if (installed) return;
    installed = true;

    const originalHighlightCodeBlocks = WebHackerEditorClass.prototype.highlightCodeBlocks;
    WebHackerEditorClass.prototype.highlightCodeBlocks = function (): void {
        if (typeof originalHighlightCodeBlocks === "function") {
            originalHighlightCodeBlocks.call(this);
        }
        this.renderMermaidBlocks();
    };

    const originalGetSerializableEditorHtml = WebHackerEditorClass.prototype.getSerializableEditorHtml;
    WebHackerEditorClass.prototype.getSerializableEditorHtml = function (): string {
        const rawHtml =
            typeof originalGetSerializableEditorHtml === "function"
                ? originalGetSerializableEditorHtml.call(this)
                : this.contentEditableElement.innerHTML;

        const templateElement = document.createElement("template");
        templateElement.innerHTML = rawHtml;
        stripMermaidRuntimeUi(templateElement.content);

        return templateElement.innerHTML;
    };

    WebHackerEditorClass.prototype.getMermaidSourceValue = function (figureElement: HTMLElement): string {
        return getMermaidSourceValue(figureElement);
    };

    WebHackerEditorClass.prototype.getMermaidFigureAtSelection = function (): HTMLElement | null {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        return resolveMermaidFigureFromSelectionRange(range);
    };

    WebHackerEditorClass.prototype.insertMermaidBlock = function (sourceValue: string): HTMLElement | null {
        const normalizedSourceValue = normalizeMermaidSourceValue(sourceValue);
        if (!normalizedSourceValue.length) return null;

        const figureElement = document.createElement("figure");
        setMermaidSourceValue(figureElement, normalizedSourceValue);

        insertBlockElement(this, figureElement);

        ensureMermaidBlockUi(this, figureElement);
        placeCaretAfterElement(figureElement);

        if (typeof this.captureHistorySnapshot === "function") {
            this.captureHistorySnapshot("command");
        }

        return figureElement;
    };

    WebHackerEditorClass.prototype.updateMermaidBlock = function (
        figureElement: HTMLElement,
        sourceValue: string,
    ): HTMLElement | null {
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

    WebHackerEditorClass.prototype.renderMermaidBlocks = function (): void {
        this.contentEditableElement.querySelectorAll("figure").forEach(figureElement => {
            if (!(figureElement instanceof HTMLElement)) return;
            if (!getMermaidCodeElement(figureElement)) return;
            ensureMermaidBlockUi(this, figureElement);
        });
    };

    WebHackerEditorClass.prototype.exitMermaidBlockToNextLine = function (figureElement: HTMLElement): boolean {
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
