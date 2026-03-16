import mermaid from "mermaid";
import { escapeHtml } from "@/sanitize/indexSanitize";

export const MERMAID_CODE_SELECTOR = "code.language-mermaid";
export const MERMAID_RENDERED_SOURCE_ATTR = "data-rendered-source";

let mermaidInitialized = false;
let renderIdSeed = 0;
let renderTokenSeed = 0;
const figureRenderTokenMap = new WeakMap<Element, number>();

function ensureMermaidInitialized(): void {
    if (mermaidInitialized) return;

    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "default",
    });
    mermaidInitialized = true;
}

export function normalizeMermaidSourceValue(value: unknown): string {
    return String(value ?? "").replace(/\u200B/g, "").trim();
}

export function getMermaidCodeElement(containerElement: ParentNode | null): HTMLElement | null {
    if (!containerElement || !(containerElement as Element).querySelector) return null;

    const element = containerElement.querySelector(MERMAID_CODE_SELECTOR);
    return element instanceof HTMLElement ? element : null;
}

export function getMermaidSourceValue(containerElement: ParentNode | null): string {
    const codeElement = getMermaidCodeElement(containerElement);
    if (!codeElement) return "";

    return normalizeMermaidSourceValue(codeElement.textContent ?? "");
}

export function setMermaidSourceValue(containerElement: HTMLElement | null, nextSourceValue: string): HTMLElement | null {
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

export async function renderMermaidSourceToHtml(sourceValue: string): Promise<string> {
    const normalizedSource = normalizeMermaidSourceValue(sourceValue);
    if (!normalizedSource.length) return "";

    ensureMermaidInitialized();

    const renderId = `wh-mermaid-${++renderIdSeed}`;
    const renderResult = await mermaid.render(renderId, normalizedSource).then(
        result => result,
        error => {
            const errorMessage = error instanceof Error ? error.message : String(error || normalizedSource);
            return `<div class="webhacker-mermaid__status">${escapeHtml(errorMessage)}</div>`;
        },
    );

    if (typeof renderResult === "string") return renderResult;
    if (renderResult && typeof renderResult.svg === "string") return renderResult.svg;

    return `<div class="webhacker-mermaid__status">${escapeHtml(normalizedSource)}</div>`;
}

function forEachMermaidFigure(
    rootElement: ParentNode | null,
    callback: (figureElement: HTMLElement) => void,
): void {
    if (!rootElement || !(rootElement as Element).querySelectorAll) return;

    rootElement.querySelectorAll("figure").forEach(figureElement => {
        if (!(figureElement instanceof HTMLElement)) return;
        if (!getMermaidCodeElement(figureElement)) return;
        callback(figureElement);
    });
}

export function applyMermaidRuntimeState(figureElement: HTMLElement): {
    codeElement: HTMLElement | null;
    previewElement: HTMLElement | null;
    sourceValue: string;
} {
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
        previewElement = document.createElement("div");
        previewElement.className = "webhacker-mermaid__preview";
        previewElement.setAttribute("contenteditable", "false");
        figureElement.appendChild(previewElement);
    }

    return { codeElement, previewElement, sourceValue };
}

export function renderMermaidPreview(
    figureElement: HTMLElement,
    previewElement: HTMLElement,
    sourceValue: string,
): void {
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

export function stripMermaidRuntimeUi(rootElement: ParentNode | null): void {
    if (!rootElement || !(rootElement as Element).querySelectorAll) return;

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

export function renderMermaidBlocksInElement(rootElement: ParentNode | null): void {
    forEachMermaidFigure(rootElement, figureElement => {
        figureElement
            .querySelectorAll(".webhacker-mermaid__actions")
            .forEach(actionsElement => actionsElement.remove());

        const { codeElement, previewElement, sourceValue } = applyMermaidRuntimeState(figureElement);
        if (!codeElement || !previewElement) return;

        renderMermaidPreview(figureElement, previewElement, sourceValue);
    });
}

function autoRenderMermaidContent(): void {
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
