import { INLINE_MARK_BLOCK_SELECTOR } from "@/constants/indexConstants";

const INLINE_MARK_SELECTOR = "strong,b,em,i,u";
const INLINE_MARK_ATOMIC_CONTENT_SELECTOR = "img,svg,video,audio,iframe,canvas,math";

export function unwrapElementKeepChildren(element: Element): void {
    if (!element.parentNode) return;

    const parentElement = element.parentNode;
    while (element.firstChild) parentElement.insertBefore(element.firstChild, element);
    parentElement.removeChild(element);
}

function resolveMarkFamily(tagName: string): string {
    const normalizedTagName = String(tagName).toLowerCase();
    if (normalizedTagName === "strong" || normalizedTagName === "b") return "bold";
    if (normalizedTagName === "em" || normalizedTagName === "i") return "italic";
    if (normalizedTagName === "u") return "underline";

    return "";
}

function isSameMarkFamily(firstElement: Element, secondElement: Element): boolean {
    const firstFamily = resolveMarkFamily(firstElement.tagName);
    const secondFamily = resolveMarkFamily(secondElement.tagName);

    return Boolean(firstFamily) && firstFamily === secondFamily;
}

export function normalizeInvalidInlineMarkContainers(rootElement: Element): boolean {
    let changed = false;

    rootElement.querySelectorAll(INLINE_MARK_SELECTOR).forEach(markElement => {
        if (markElement.querySelector(INLINE_MARK_BLOCK_SELECTOR)) {
            unwrapElementKeepChildren(markElement);
            changed = true;
        }
    });

    let hasNestedMarks = true;
    while (hasNestedMarks) {
        hasNestedMarks = false;
        rootElement.querySelectorAll(INLINE_MARK_SELECTOR).forEach(markElement => {
            const parentElement = markElement.parentElement;
            if (!parentElement || !parentElement.matches(INLINE_MARK_SELECTOR)) return;
            if (!isSameMarkFamily(markElement, parentElement)) return;

            unwrapElementKeepChildren(markElement);
            changed = true;
            hasNestedMarks = true;
        });
    }

    rootElement.querySelectorAll(INLINE_MARK_SELECTOR).forEach(markElement => {
        const textValue = markElement.textContent?.replace(/\u200B/g, "").trim() ?? "";
        const hasAtomicContent = Boolean(markElement.querySelector(INLINE_MARK_ATOMIC_CONTENT_SELECTOR));
        if (textValue.length || hasAtomicContent) return;

        unwrapElementKeepChildren(markElement);
        changed = true;
    });

    return changed;
}
