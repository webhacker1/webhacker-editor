const BLOCK_ROOT_SELECTOR = "p,h1,h2,h3,h4,h5,h6,blockquote,pre,figure,table,ul,ol,li,div";

function isRootBlockNode(node: Node): boolean {
    return node instanceof Element && node.matches(BLOCK_ROOT_SELECTOR);
}

export function normalizeRootInlineFlow(rootElement: HTMLElement): void {
    const rootNodes = Array.from(rootElement.childNodes);
    let paragraphElement: HTMLParagraphElement | null = null;

    rootNodes.forEach(node => {
        if (isRootBlockNode(node)) {
            paragraphElement = null;
            return;
        }

        if (!paragraphElement) {
            paragraphElement = document.createElement("p");
            rootElement.insertBefore(paragraphElement, node);
        }

        paragraphElement.appendChild(node);
    });
}
