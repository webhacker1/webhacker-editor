import katex from "katex";

export const MATH_CODE_SELECTOR = "code.language-math";
export const MATH_PREVIEW_LATEX_ATTR = "data-rendered-latex";

export function normalizeMathLatexValue(value: unknown): string {
    return String(value ?? "").replace(/\u200B/g, "").trim();
}

export function getMathCodeElement(containerElement: ParentNode | null): HTMLElement | null {
    if (!containerElement || !(containerElement as Element).querySelector) return null;

    const element = containerElement.querySelector(MATH_CODE_SELECTOR);
    return element instanceof HTMLElement ? element : null;
}

export function getMathLatexValue(containerElement: ParentNode | null): string {
    const codeElement = getMathCodeElement(containerElement);
    if (!codeElement) return "";

    return normalizeMathLatexValue(codeElement.textContent ?? "");
}

export function setMathLatexValue(containerElement: HTMLElement | null, nextLatexValue: string): HTMLElement | null {
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

export function renderMathLatexToHtml(latexValue: string): string {
    const normalizedLatexValue = normalizeMathLatexValue(latexValue);
    if (!normalizedLatexValue.length) return "";

    return katex.renderToString(normalizedLatexValue, {
        displayMode: true,
        output: "html",
        throwOnError: false,
        strict: "ignore",
    });
}

function forEachMathFigure(rootElement: ParentNode | null, callback: (figureElement: HTMLElement) => void): void {
    if (!rootElement || !(rootElement as Element).querySelectorAll) return;

    rootElement.querySelectorAll("figure").forEach(figureElement => {
        if (!(figureElement instanceof HTMLElement)) return;
        if (!getMathCodeElement(figureElement)) return;
        callback(figureElement);
    });
}

export function stripMathRuntimeUi(rootElement: ParentNode | null): void {
    if (!rootElement || !(rootElement as Element).querySelectorAll) return;

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

export function renderMathBlocksInElement(rootElement: ParentNode | null): void {
    forEachMathFigure(rootElement, figureElement => {
        figureElement
            .querySelectorAll(".webhacker-math__actions")
            .forEach(actionsElement => actionsElement.remove());

        const codeElement = getMathCodeElement(figureElement);
        if (!codeElement) return;

        const latexValue = getMathLatexValue(figureElement);

        let previewElement = figureElement.querySelector(".webhacker-math__preview") as HTMLElement | null;
        if (!previewElement) {
            previewElement = document.createElement("div");
            previewElement.className = "webhacker-math__preview";
            figureElement.appendChild(previewElement);
        }

        previewElement.setAttribute("contenteditable", "false");
        if (previewElement.getAttribute(MATH_PREVIEW_LATEX_ATTR) !== latexValue) {
            previewElement.innerHTML = renderMathLatexToHtml(latexValue);
            previewElement.setAttribute(MATH_PREVIEW_LATEX_ATTR, latexValue);
        }

        figureElement.classList.add("webhacker-math");
        codeElement.className = "language-math webhacker-math__source";
        codeElement.setAttribute("aria-hidden", "true");
    });
}

function autoRenderMathContent(): void {
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
