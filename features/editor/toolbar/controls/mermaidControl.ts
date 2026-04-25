import { KEY_ENTER, KEY_ESCAPE } from "@/constants/indexConstants";
import { createElement } from "@/ui/indexUi";
import { normalizeMermaidSourceValue, renderMermaidSourceToHtml } from "@/features/mermaid/indexMermaid";
import { MERMAID_DOCS_URL } from "@/features/editor/toolbar/toolbarConfig";
import { createDropdown, focusFirstMenuItem } from "@/features/editor/toolbar/toolbarContext";

export function createMermaidDropdown(editor, t) {
    const mermaidT = t.mermaid;
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-diagram-project",
        mermaidT.label
    );

    dropdownMenuElement.classList.add("webhacker-menu--mermaid");

    const formElement = createElement("div", "webhacker-mermaid-form");

    const inputLabelElement = createElement("label", "webhacker-mermaid-form__label");
    inputLabelElement.textContent = mermaidT.inputLabel;

    const inputElement = createElement("textarea", "webhacker-textarea webhacker-mermaid-form__input", {
        rows: "8",
        placeholder: mermaidT.placeholder,
        "data-menu-item": "true"
    });

    const metaRowElement = createElement("div", "webhacker-mermaid-form__meta");
    const previewLabelElement = createElement(
        "div",
        "webhacker-mermaid-form__label webhacker-mermaid-form__label--inline"
    );
    previewLabelElement.textContent = mermaidT.preview;

    const docsElement = createElement("a", "webhacker-mermaid-form__docs", {
        href: MERMAID_DOCS_URL,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        tabindex: "-1"
    });
    docsElement.textContent = mermaidT.docs;
    metaRowElement.append(previewLabelElement, docsElement);

    const previewElement = createElement("div", "webhacker-mermaid-form__preview", {
        contenteditable: "false",
        "data-placeholder": mermaidT.preview
    });

    const actionsElement = createElement("div", "webhacker-actions");
    const cancelButtonElement = createElement("button", "webhacker-button webhacker-button--ghost", {
        type: "button",
        "data-menu-item": "true"
    });
    cancelButtonElement.textContent = t.cancel;
    const submitButtonElement = createElement("button", "webhacker-button webhacker-button--primary", {
        type: "button",
        "data-menu-item": "true"
    });
    submitButtonElement.textContent = mermaidT.insert;

    actionsElement.append(cancelButtonElement, submitButtonElement);
    formElement.append(inputLabelElement, inputElement, metaRowElement, previewElement, actionsElement);
    dropdownMenuElement.appendChild(formElement);

    let targetFigureElement = null;
    let previewRenderRequestId = 0;

    const refreshPreview = async () => {
        const currentSourceValue = normalizeMermaidSourceValue(inputElement.value);
        const requestId = ++previewRenderRequestId;

        if (!currentSourceValue.length) {
            previewElement.innerHTML = "";
            return;
        }

        previewElement.setAttribute("aria-busy", "true");
        const renderedHtml = await renderMermaidSourceToHtml(currentSourceValue);
        if (requestId !== previewRenderRequestId) return;
        previewElement.innerHTML = renderedHtml;
        previewElement.removeAttribute("aria-busy");
    };

    const populateFormFromContext = figureElement => {
        targetFigureElement =
            figureElement && editor.contentEditableElement.contains(figureElement) ? figureElement : null;

        if (targetFigureElement) {
            inputElement.value = editor.getMermaidSourceValue(targetFigureElement);
            submitButtonElement.textContent = mermaidT.update;
        } else {
            const selectedFigureElement =
                typeof editor.getMermaidFigureAtSelection === "function"
                    ? editor.getMermaidFigureAtSelection()
                    : null;

            if (selectedFigureElement && editor.contentEditableElement.contains(selectedFigureElement)) {
                targetFigureElement = selectedFigureElement;
                inputElement.value = editor.getMermaidSourceValue(selectedFigureElement);
                submitButtonElement.textContent = mermaidT.update;
            } else {
                inputElement.value = "";
                submitButtonElement.textContent = mermaidT.insert;
            }
        }

        refreshPreview();
    };

    const focusComposer = () => {
        requestAnimationFrame(() => {
            focusFirstMenuItem(dropdownMenuElement, ".webhacker-mermaid-form__input");
            inputElement.selectionStart = inputElement.value.length;
            inputElement.selectionEnd = inputElement.value.length;
        });
    };

    const closeComposer = () => {
        editor.closeAllMenus();
        editor.contentEditableElement.focus({ preventScroll: true });
        editor.restoreSelectionRange(editor.currentSavedSelectionRange);
    };

    const submit = () => {
        const sourceValue = normalizeMermaidSourceValue(inputElement.value);
        if (!sourceValue.length) return;

        closeComposer();

        if (targetFigureElement && editor.contentEditableElement.contains(targetFigureElement)) {
            editor.updateMermaidBlock(targetFigureElement, sourceValue);
        } else {
            editor.insertMermaidBlock(sourceValue);
        }

        targetFigureElement = null;
        inputElement.value = "";
        previewElement.innerHTML = "";

        editor.emitChange();
        editor.syncToggleStates();
    };

    inputElement.addEventListener("input", refreshPreview);
    inputElement.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key === KEY_ENTER) {
            event.preventDefault();
            event.stopPropagation();
            submit();
            return;
        }

        if (event.key === KEY_ESCAPE) {
            event.preventDefault();
            event.stopPropagation();
            closeComposer();
        }
    });

    cancelButtonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
    });
    cancelButtonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        closeComposer();
    });

    submitButtonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
    });
    submitButtonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        submit();
    });

    const triggerButtonElement = dropdownWrapperElement.querySelector(".webhacker-button");
    triggerButtonElement.addEventListener("click", () => {
        if (dropdownMenuElement.classList.contains("webhacker-menu--hidden")) return;
        populateFormFromContext(null);
        focusComposer();
    });

    editor.openMermaidComposerForFigure = figureElement => {
        editor.currentSavedSelectionRange = editor.saveSelectionRange();

        if (dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            editor.toggleMenu(dropdownMenuElement);
        }

        populateFormFromContext(figureElement);
        focusComposer();
    };

    return dropdownWrapperElement;
}
