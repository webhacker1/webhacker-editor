type ElementAttributes = Record<string, string | number | boolean>;

export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className?: string | null,
    attributes?: ElementAttributes | null
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, String(value));
        });
    }
    return element;
}
