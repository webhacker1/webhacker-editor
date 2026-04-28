import { sanitizeNodeRecursively } from "@/sanitize/nodes";

export function sanitizeHtmlStringToSafeHtml(htmlString, options = {}) {
    const templateElement = document.createElement("template");
    templateElement.innerHTML = String(htmlString || "");
    sanitizeNodeRecursively(templateElement.content, options);
    return templateElement.innerHTML;
}
