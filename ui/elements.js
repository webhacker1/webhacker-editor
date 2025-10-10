export function createElement(tagName, className, attributes) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (attributes)
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
}
