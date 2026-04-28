import { ensureTextAnchor, getAnchorElement, getClosestBlock, placeCaretAtNodeEnd } from "@/core/richtext/selection";
import type { EditorCommandContext } from "@/core/richtext/commands/types";
import { replaceElementTag } from "@/core/richtext/commands/dom";

type ListType = "ul" | "ol";

export function toggleList(editor: EditorCommandContext, listType: ListType): boolean {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;

    const activeListElement = anchorElement.closest("ul,ol");
    if (activeListElement) {
        if (activeListElement.tagName.toLowerCase() === listType) {
            const fragment = document.createDocumentFragment();
            [...activeListElement.querySelectorAll(":scope > li")].forEach(listItemElement => {
                const paragraphElement = document.createElement("p");
                while (listItemElement.firstChild) {
                    const childNode = listItemElement.firstChild as ChildNode;
                    if (childNode.nodeType === 1 && (childNode as Element).matches("ul,ol")) {
                        if (paragraphElement.childNodes.length > 0) {
                            ensureTextAnchor(paragraphElement);
                            fragment.appendChild(paragraphElement);
                        }
                        fragment.appendChild(childNode);
                        continue;
                    }
                    paragraphElement.appendChild(childNode);
                }

                if (paragraphElement.childNodes.length > 0) {
                    ensureTextAnchor(paragraphElement);
                    fragment.appendChild(paragraphElement);
                }
            });

            if (!fragment.childNodes.length) {
                const paragraphElement = document.createElement("p");
                ensureTextAnchor(paragraphElement);
                fragment.appendChild(paragraphElement);
            }

            activeListElement.replaceWith(fragment);
            return true;
        }

        const convertedListElement = replaceElementTag(activeListElement, listType);
        if (!convertedListElement) return false;

        const targetListItemElement = getAnchorElement(editor)?.closest("li");
        if (targetListItemElement) placeCaretAtNodeEnd(targetListItemElement);

        return true;
    }

    const blockElement = getClosestBlock(editor);
    if (!blockElement) return false;
    if (blockElement.closest("pre,figure,table")) return false;

    const listElement = document.createElement(listType);
    const listItemElement = document.createElement("li");

    while (blockElement.firstChild) listItemElement.appendChild(blockElement.firstChild);
    ensureTextAnchor(listItemElement);

    listElement.appendChild(listItemElement);
    blockElement.replaceWith(listElement);

    placeCaretAtNodeEnd(listItemElement);
    return true;
}
