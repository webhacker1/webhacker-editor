import { ALLOWED_TAG_SET } from "@/constants/indexConstants";
import { sanitizeElementAttributes } from "@/sanitize/attributes";

export function sanitizeNodeRecursively(node, options = {}) {
    if (node.nodeType === Node.COMMENT_NODE) {
        node.remove();
        return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (!ALLOWED_TAG_SET.has(tagName)) {
            const textNode = document.createTextNode(node.textContent || "");
            node.replaceWith(textNode);
            return;
        }

        sanitizeElementAttributes(node, options);
        [...node.childNodes].forEach(childNode => sanitizeNodeRecursively(childNode, options));
    } else {
        [...(node.childNodes || [])].forEach(childNode =>
            sanitizeNodeRecursively(childNode, options)
        );
    }
}
