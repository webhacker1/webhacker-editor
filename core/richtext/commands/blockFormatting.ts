import { getAnchorElement, getClosestBlock, getSelectionRange } from "@/core/richtext/selection";
import type { EditorCommandContext } from "@/core/richtext/commands/types";
import { replaceElementTag } from "@/core/richtext/commands/dom";
import { removeFormattingMarksWithinElement } from "@/core/richtext/commands/inlineMarks";

function getIntersectingBlocks(editor: EditorCommandContext, range: Range): HTMLElement[] {
    const blockSelector = "p,h1,h2,h3,h4,h5,h6,li,blockquote,div,td,th";
    const blocks = [...editor.contentEditableElement.querySelectorAll(blockSelector)] as HTMLElement[];

    if (range.collapsed) {
        const anchorElement = getAnchorElement(editor);
        const blockElement = anchorElement?.closest(blockSelector) as HTMLElement | null;
        return blockElement ? [blockElement] : [];
    }

    return blocks.filter(blockElement => {
        if (!editor.contentEditableElement.contains(blockElement)) return false;
        if (blockElement.closest("pre,figure,table")) return false;
        return range.intersectsNode(blockElement);
    });
}

export function setAlign(editor: EditorCommandContext, alignValue: "left" | "center" | "right"): boolean {
    const range = getSelectionRange(editor);
    if (!range) return false;

    const targetBlocks = getIntersectingBlocks(editor, range);
    if (!targetBlocks.length) return false;

    let changed = false;
    targetBlocks.forEach(blockElement => {
        const isListItem = blockElement.tagName.toLowerCase() === "li";
        if (alignValue === "left") {
            if (blockElement.style.textAlign || blockElement.hasAttribute("align")) {
                blockElement.style.removeProperty("text-align");
                blockElement.removeAttribute("align");
                changed = true;
            }
            if (isListItem && blockElement.style.listStylePosition) {
                blockElement.style.removeProperty("list-style-position");
                changed = true;
            }
            return;
        }

        if (blockElement.style.textAlign !== alignValue) {
            blockElement.style.textAlign = alignValue;
            changed = true;
        }
        if (isListItem && blockElement.style.listStylePosition !== "inside") {
            blockElement.style.listStylePosition = "inside";
            changed = true;
        }
    });

    return changed;
}

export function formatBlock(editor: EditorCommandContext, tagName: string | null): boolean {
    const blockElement = getClosestBlock(editor);
    if (!blockElement) return false;
    if (blockElement.closest("pre,figure,table")) return false;
    if (blockElement.closest("li")) return false;

    const normalizedTag = String(tagName || "P").toUpperCase();
    const allowedTags = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6"]);
    if (!allowedTags.has(normalizedTag)) return false;

    replaceElementTag(blockElement, normalizedTag.toLowerCase());
    return true;
}

export function removeFormat(editor: EditorCommandContext): boolean {
    const blockElement = getClosestBlock(editor);
    if (!blockElement) return false;
    if (blockElement.closest("pre,figure")) return false;

    const rootElement = blockElement.closest("li") || blockElement;
    removeFormattingMarksWithinElement(rootElement);

    return true;
}

export function getCurrentAlignState(editor: EditorCommandContext): "left" | "center" | "right" {
    const blockElement = getClosestBlock(editor);
    if (!blockElement) return "left";

    const inlineAlign = (blockElement.style.textAlign || "").toLowerCase();
    const alignAttr = String(blockElement.getAttribute("align") || "").toLowerCase();
    const resolvedAlign = inlineAlign || alignAttr || "left";

    if (resolvedAlign === "center") return "center";
    if (resolvedAlign === "right" || resolvedAlign === "end") return "right";

    return "left";
}
