import { createElement } from "../../../../ui/elements.js";
import {
    createDropdown,
    focusFirstMenuItem
} from "../ui.js";
import {
    normalizeMathLatexValue,
    renderMathLatexToHtml
} from "../../../math/engine.js";

const MATH_DOCS_URL = "https://en.wikibooks.org/wiki/LaTeX/Mathematics";

export function createMathDropdown(editor, t) {
    const mathT = t.math;
    const { dropdownWrapperElement, dropdownMenuElement } = createDropdown(
        editor,
        "fa-solid fa-square-root-variable",
        mathT.label
    );

    dropdownMenuElement.classList.add("webhacker-menu--math");

    const formElement = createElement("div", "webhacker-math-form");

    const inputLabelElement = createElement("label", "webhacker-math-form__label");
    inputLabelElement.textContent = mathT.inputLabel;

    const inputElement = createElement("textarea", "webhacker-textarea webhacker-math-form__input", {
        rows: "6",
        placeholder: mathT.placeholder,
        "data-menu-item": "true"
    });

    const metaRowElement = createElement("div", "webhacker-math-form__meta");
    const previewLabelElement = createElement("div", "webhacker-math-form__label webhacker-math-form__label--inline");
    previewLabelElement.textContent = mathT.preview;

    const docsElement = createElement("a", "webhacker-math-form__docs", {
        href: MATH_DOCS_URL,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        tabindex: "-1"
    });
    docsElement.textContent = mathT.docs;
    metaRowElement.append(previewLabelElement, docsElement);

    const previewElement = createElement("div", "webhacker-math-form__preview", {
        contenteditable: "false",
        "data-placeholder": mathT.preview
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
    submitButtonElement.textContent = mathT.insert;

    actionsElement.append(cancelButtonElement, submitButtonElement);
    formElement.append(
        inputLabelElement,
        inputElement,
        metaRowElement,
        previewElement,
        actionsElement
    );
    dropdownMenuElement.appendChild(formElement);

    let targetFigureElement = null;

    const refreshPreview = () => {
        const normalizedLatexValue = normalizeMathLatexValue(inputElement.value);
        previewElement.innerHTML = normalizedLatexValue
            ? renderMathLatexToHtml(normalizedLatexValue)
            : "";
    };

    const populateFormFromContext = figureElement => {
        targetFigureElement =
            figureElement && editor.contentEditableElement.contains(figureElement) ? figureElement : null;

        if (targetFigureElement) {
            inputElement.value = editor.getMathLatexValue(targetFigureElement);
            submitButtonElement.textContent = mathT.update;
        } else {
            const selectedFigureElement =
                typeof editor.getMathFigureAtSelection === "function"
                    ? editor.getMathFigureAtSelection()
                    : null;

            if (selectedFigureElement && editor.contentEditableElement.contains(selectedFigureElement)) {
                targetFigureElement = selectedFigureElement;
                inputElement.value = editor.getMathLatexValue(selectedFigureElement);
                submitButtonElement.textContent = mathT.update;
            } else {
                inputElement.value = "";
                submitButtonElement.textContent = mathT.insert;
            }
        }

        refreshPreview();
    };

    const focusComposer = () => {
        requestAnimationFrame(() => {
            focusFirstMenuItem(dropdownMenuElement, ".webhacker-math-form__input");
            inputElement.selectionStart = inputElement.value.length;
            inputElement.selectionEnd = inputElement.value.length;
        });
    };

    const closeComposer = () => {
        editor.closeAllMenus();
        editor.contentEditableElement.focus();
        editor.restoreSelectionRange(editor.currentSavedSelectionRange);
    };

    const submit = () => {
        const latexValue = normalizeMathLatexValue(inputElement.value);
        if (!latexValue.length) return;

        closeComposer();

        if (targetFigureElement && editor.contentEditableElement.contains(targetFigureElement)) {
            editor.updateMathBlock(targetFigureElement, latexValue);
        } else {
            editor.insertMathBlock(latexValue);
        }

        targetFigureElement = null;
        inputElement.value = "";
        previewElement.innerHTML = "";

        editor.emitChange();
        editor.syncToggleStates();
    };

    inputElement.addEventListener("input", refreshPreview);
    inputElement.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            submit();
            return;
        }

        if (event.key === "Escape") {
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

    editor.openMathComposerForFigure = figureElement => {
        editor.currentSavedSelectionRange = editor.saveSelectionRange();

        if (dropdownMenuElement.classList.contains("webhacker-menu--hidden")) {
            editor.toggleMenu(dropdownMenuElement);
        }

        populateFormFromContext(figureElement);
        focusComposer();
    };

    return dropdownWrapperElement;
}
