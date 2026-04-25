import { ensureTextAnchor, getAnchorElement, getSelectionRange, placeCaretAtNodeEnd } from "@/core/richtext/selection";
import type { EditorCommandContext } from "@/core/richtext/commands/types";

function getListItemOwnTextContent(listItemElement: Element | null): string {
    if (!listItemElement) return "";

    const cloneElement = listItemElement.cloneNode(true) as HTMLElement;
    cloneElement.querySelectorAll("ul,ol").forEach(listElement => listElement.remove());

    return (cloneElement.textContent || "").replace(/\u200B/g, "").trim();
}

export function outdentListItem(editor: EditorCommandContext): boolean {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;

    const listItemElement = anchorElement.closest("li");
    if (!listItemElement) return false;

    const parentListElement = listItemElement.parentElement?.closest("ul,ol");
    if (!parentListElement) return false;

    const parentListItemElement = parentListElement.parentElement?.closest("li");
    if (parentListItemElement) {
        const outerListElement = parentListItemElement.parentElement?.closest("ul,ol");
        if (!outerListElement) return false;

        outerListElement.insertBefore(listItemElement, parentListItemElement.nextSibling);
        if (!parentListElement.querySelector("li")) parentListElement.remove();

        ensureTextAnchor(listItemElement);
        placeCaretAtNodeEnd(listItemElement);

        return true;
    }

    const paragraphElement = document.createElement("p");
    const nestedListElements: HTMLElement[] = [];

    while (listItemElement.firstChild) {
        const childNode = listItemElement.firstChild as ChildNode;
        if (childNode.nodeType === 1 && (childNode as Element).matches("ul,ol")) {
            nestedListElements.push(childNode as HTMLElement);
            listItemElement.removeChild(childNode);
            continue;
        }
        paragraphElement.appendChild(childNode);
    }

    ensureTextAnchor(paragraphElement);

    parentListElement.insertAdjacentElement("afterend", paragraphElement);

    let insertionAnchorElement: HTMLElement = paragraphElement;
    nestedListElements.forEach(nestedListElement => {
        insertionAnchorElement.insertAdjacentElement("afterend", nestedListElement);
        insertionAnchorElement = nestedListElement;
    });

    listItemElement.remove();
    if (!parentListElement.querySelector("li")) parentListElement.remove();

    placeCaretAtNodeEnd(paragraphElement);
    return true;
}

export function splitListItem(editor: EditorCommandContext): boolean {
    const range = getSelectionRange(editor);
    if (!range) return false;

    if (!range.collapsed) range.deleteContents();

    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;

    const listItemElement = anchorElement.closest("li");
    if (!listItemElement) return false;

    const listItemText = getListItemOwnTextContent(listItemElement);
    if (!listItemText.length) {
        return outdentListItem(editor);
    }

    const splitRange = getSelectionRange(editor);
    if (!splitRange) return false;

    const tailRange = splitRange.cloneRange();
    tailRange.setEndAfter(listItemElement.lastChild || listItemElement);
    const tailFragment = tailRange.extractContents();

    if (!listItemElement.textContent || !listItemElement.textContent.replace(/\u200B/g, "").length) {
        ensureTextAnchor(listItemElement);
    }

    const nextListItemElement = document.createElement("li");
    nextListItemElement.appendChild(tailFragment);

    if (!nextListItemElement.textContent || !nextListItemElement.textContent.replace(/\u200B/g, "").length) {
        ensureTextAnchor(nextListItemElement);
    }

    listItemElement.insertAdjacentElement("afterend", nextListItemElement);
    placeCaretAtNodeEnd(nextListItemElement);

    return true;
}

export function sinkListItem(editor: EditorCommandContext): boolean {
    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;

    const listItemElement = anchorElement.closest("li");
    if (!listItemElement) return false;

    const parentListElement = listItemElement.parentElement?.closest("ul,ol");
    if (!parentListElement) return false;

    const previousListItemElement = listItemElement.previousElementSibling as HTMLElement | null;
    if (!previousListItemElement || previousListItemElement.tagName.toLowerCase() !== "li") return false;

    const parentListTagName = parentListElement.tagName.toLowerCase();
    let nestedListElement = previousListItemElement.lastElementChild as HTMLElement | null;
    if (!nestedListElement || nestedListElement.tagName.toLowerCase() !== parentListTagName) {
        nestedListElement = document.createElement(parentListTagName);
        previousListItemElement.appendChild(nestedListElement);
    }

    nestedListElement.appendChild(listItemElement);
    ensureTextAnchor(listItemElement);
    placeCaretAtNodeEnd(listItemElement);

    return true;
}

export function backspaceListItem(editor: EditorCommandContext): boolean {
    const range = getSelectionRange(editor);
    if (!range || !range.collapsed) return false;

    const anchorElement = getAnchorElement(editor);
    if (!anchorElement) return false;

    const listItemElement = anchorElement.closest("li");
    if (!listItemElement) return false;

    const previousListItemElement = listItemElement.previousElementSibling as HTMLElement | null;
    if (!previousListItemElement || previousListItemElement.tagName.toLowerCase() !== "li") {
        return outdentListItem(editor);
    }

    while (listItemElement.firstChild) {
        previousListItemElement.appendChild(listItemElement.firstChild);
    }

    listItemElement.remove();
    ensureTextAnchor(previousListItemElement);
    placeCaretAtNodeEnd(previousListItemElement);

    return true;
}
