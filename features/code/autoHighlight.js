import { highlightCodeBlocksInElement } from "./engine.js";

function autoHighlightRichContent() {
    if (typeof document === "undefined") return;
    document.querySelectorAll(".rich-content").forEach(rootElement => {
        highlightCodeBlocksInElement(rootElement);
    });
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", autoHighlightRichContent, { once: true });
    } else {
        autoHighlightRichContent();
    }
}

