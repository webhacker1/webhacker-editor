import { getAnchorElement, getClosestBlock, getSelectionRange, placeCaretAtNodeEnd } from "@/core/richtext/selection";
import type { EditorCommandContext } from "@/core/richtext/commands/types";
import { replaceElementTag } from "@/core/richtext/commands/dom";
import { removeFormattingMarksWithinElement } from "@/core/richtext/commands/inlineMarks";

function getIntersectingBlocks(editor: EditorCommandContext, range: Range): HTMLElement[] {
    const blockSelector = "p,h1,h2,h3,h4,h5,h6,li,blockquote,div,td,th";
    const blocks = [...editor.contentEditableElement.querySelectorAll(blockSelector)] as HTMLElement[];

    if (range.collapsed) {
        const anchorElement = getAnchorElement(editor);
        const blockElement = anchorElement?.closest(blockSelector) as HTMLElement | null;
        if (!blockElement || blockElement === editor.contentEditableElement) return [];
        return [blockElement];
    }

    return blocks.filter(blockElement => {
        if (!editor.contentEditableElement.contains(blockElement)) return false;
        if (blockElement === editor.contentEditableElement) return false;
        if (blockElement.closest("pre,figure,table")) return false;
        return range.intersectsNode(blockElement);
    });
}

function getNearestTextBlock(editor: EditorCommandContext, node: Node | null): HTMLElement | null {
    const element = node instanceof Element ? node : node?.parentElement;
    if (!element) return null;
    const blockElement = element.closest("p,h1,h2,h3,h4,h5,h6,blockquote") as HTMLElement | null;
    if (!blockElement) return null;
    if (!editor.contentEditableElement.contains(blockElement)) return null;
    return blockElement;
}

function hasMeaningfulContent(nodeContainer: Node): boolean {
    return [...nodeContainer.childNodes].some(node => {
        if (node.nodeType === Node.ELEMENT_NODE) return true;
        if (node.nodeType === Node.TEXT_NODE) return (node.textContent || "") !== "";
        return false;
    });
}

function splitBlockAndReplaceSelection(
    editor: EditorCommandContext,
    range: Range,
    sourceBlockElement: HTMLElement,
    targetTagName: string
): boolean {
    if (range.collapsed) return false;

    const startMarker = document.createComment("wh-heading-start");
    const endMarker = document.createComment("wh-heading-end");
    const endRange = range.cloneRange();
    endRange.collapse(false);
    endRange.insertNode(endMarker);
    const startRange = range.cloneRange();
    startRange.collapse(true);
    startRange.insertNode(startMarker);

    const beforeRange = document.createRange();
    beforeRange.selectNodeContents(sourceBlockElement);
    beforeRange.setEndBefore(startMarker);
    const beforeFragment = beforeRange.extractContents();

    const selectedRange = document.createRange();
    selectedRange.setStartAfter(startMarker);
    selectedRange.setEndBefore(endMarker);
    const selectedFragment = selectedRange.extractContents();

    startMarker.remove();
    endMarker.remove();

    const afterFragment = document.createDocumentFragment();
    while (sourceBlockElement.firstChild) {
        afterFragment.appendChild(sourceBlockElement.firstChild);
    }

    const parentElement = sourceBlockElement.parentNode;
    if (!parentElement) return false;

    const beforeBlockElement = document.createElement(sourceBlockElement.tagName.toLowerCase());
    const selectedBlockElement = document.createElement(targetTagName);
    const afterBlockElement = document.createElement(sourceBlockElement.tagName.toLowerCase());

    while (beforeFragment.firstChild) beforeBlockElement.appendChild(beforeFragment.firstChild);
    while (selectedFragment.firstChild) selectedBlockElement.appendChild(selectedFragment.firstChild);
    while (afterFragment.firstChild) afterBlockElement.appendChild(afterFragment.firstChild);

    const replacementNodes: Node[] = [];
    if (hasMeaningfulContent(beforeBlockElement)) replacementNodes.push(beforeBlockElement);
    if (!hasMeaningfulContent(selectedBlockElement)) {
        selectedBlockElement.appendChild(document.createElement("br"));
    }
    replacementNodes.push(selectedBlockElement);
    if (hasMeaningfulContent(afterBlockElement)) replacementNodes.push(afterBlockElement);

    sourceBlockElement.replaceWith(...replacementNodes);
    placeCaretAtNodeEnd(selectedBlockElement);
    return true;
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
    const normalizedTag = String(tagName || "P").toUpperCase();
    const allowedTags = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6"]);
    if (!allowedTags.has(normalizedTag)) return false;
    const targetTagName = normalizedTag.toLowerCase();
    const range = getSelectionRange(editor);
    if (!range) return false;

    const selectedBlocks = getIntersectingBlocks(editor, range).filter(blockElement => {
        if (blockElement.closest("pre,figure,table")) return false;
        if (blockElement.closest("li")) return false;
        return true;
    });
    if (selectedBlocks.length > 1) {
        let changed = false;
        selectedBlocks.forEach(blockElement => {
            const replacementElement = replaceElementTag(blockElement, targetTagName);
            if (replacementElement) changed = true;
        });
        return changed;
    }

    if (!range.collapsed) {
        const startBlockElement = getNearestTextBlock(editor, range.startContainer);
        const endBlockElement = getNearestTextBlock(editor, range.endContainer);
        if (startBlockElement && startBlockElement === endBlockElement) {
            const fullBlockRange = document.createRange();
            fullBlockRange.selectNodeContents(startBlockElement);
            const coversWholeBlock =
                range.compareBoundaryPoints(Range.START_TO_START, fullBlockRange) <= 0 &&
                range.compareBoundaryPoints(Range.END_TO_END, fullBlockRange) >= 0;

            if (!coversWholeBlock) {
                return splitBlockAndReplaceSelection(editor, range, startBlockElement, targetTagName);
            }
        }
    }

    const blockElement = getClosestBlock(editor);
    if (!blockElement || blockElement === editor.contentEditableElement) return false;
    if (blockElement.closest("pre,figure,table")) return false;
    if (blockElement.closest("li")) return false;

    return Boolean(replaceElementTag(blockElement, targetTagName));
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
