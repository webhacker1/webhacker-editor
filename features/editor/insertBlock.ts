import { getAnchorElement, getClosestBlock, getSelectionRange } from "@/features/editor/selection";

export function insertBlockElement(editor, element: HTMLElement): void {
    const anchorElement = getAnchorElement(editor);
    const listItemElement = anchorElement?.closest("li") ?? null;
    const listElement = listItemElement?.closest("ul, ol") ?? null;

    if (listElement && listItemElement) {
        const allItems = [...listElement.querySelectorAll(":scope > li")];
        const currentIndex = allItems.indexOf(listItemElement);
        const itemsAfter = allItems.slice(currentIndex + 1);

        if (itemsAfter.length > 0) {
            const secondList = document.createElement(listElement.tagName.toLowerCase());
            itemsAfter.forEach(li => secondList.appendChild(li));
            listElement.after(element);
            element.after(secondList);
        } else {
            listElement.after(element);
        }
        return;
    }

    const currentBlock = getClosestBlock(editor);
    const range = getSelectionRange(editor);

    if (currentBlock && range && currentBlock !== editor.contentEditableElement) {
        range.deleteContents();

        const afterRange = document.createRange();
        afterRange.setStart(range.endContainer, range.endOffset);
        if (currentBlock.lastChild) afterRange.setEndAfter(currentBlock.lastChild);
        else afterRange.setEnd(currentBlock, 0);

        const afterFragment = afterRange.extractContents();
        const isEmpty = afterFragment.textContent === "" && !afterFragment.querySelector("br, img");
        const currentBlockEmpty = currentBlock.textContent === "" && !currentBlock.querySelector("br, img");

        const afterParagraph = document.createElement("p");
        afterParagraph.appendChild(isEmpty ? document.createElement("br") : afterFragment);

        if (currentBlockEmpty) {
            currentBlock.replaceWith(element, afterParagraph);
        } else {
            currentBlock.after(element);
            element.after(afterParagraph);
        }
    } else {
        editor.contentEditableElement.appendChild(element);
    }
}
