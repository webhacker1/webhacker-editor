import { renderMathBlocksInElement } from "./engine.js";

function autoRenderMathContent() {
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
