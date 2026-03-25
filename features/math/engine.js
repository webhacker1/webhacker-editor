import katex from "katex";
import { escapeHtml } from "../../sanitize/utils.js";

const MATH_CODE_SELECTOR = "code.language-math";

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
