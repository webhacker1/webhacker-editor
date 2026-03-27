import { executeRichCommand } from "../../../core/commands";
import { escapeHtml } from "../../../sanitize/utils";
import { stripMathRuntimeUi } from "../../math/index";
import { stripMermaidRuntimeUi } from "../../mermaid/index";
import { placeCaretAfterElement, getSelectionAnchorElement } from "../selection";
import { SHORTCUT_ACTIONS, matchesShortcutEvent } from "../shortcuts";

let installed = false;
const INLINE_MARK_BLOCK_SELECTOR =
    "p,h1,h2,h3,h4,h5,h6,div,blockquote,ul,ol,li,table,thead,tbody,tfoot,tr,td,th,pre,figure";

function isCaretAtCodeStart(codeElement, selection) {
    if (!selection || selection.rangeCount === 0) return false;
    const currentRange = selection.getRangeAt(0);
    if (!selection.isCollapsed || !codeElement.contains(currentRange.startContainer)) return false;

    const beforeCaretRange = currentRange.cloneRange();
    beforeCaretRange.selectNodeContents(codeElement);
    beforeCaretRange.setEnd(currentRange.startContainer, currentRange.startOffset);
    const beforeCaretText = beforeCaretRange.toString().replace(/\u200B/g, "");
    return beforeCaretText.length === 0;
}

function isCaretAtElementStart(element, selection) {
    if (!selection || selection.rangeCount === 0) return false;
    const currentRange = selection.getRangeAt(0);
    if (!selection.isCollapsed || !element.contains(currentRange.startContainer)) return false;

    const beforeCaretRange = currentRange.cloneRange();
    beforeCaretRange.selectNodeContents(element);
    beforeCaretRange.setEnd(currentRange.startContainer, currentRange.startOffset);
    const beforeCaretText = beforeCaretRange.toString().replace(/\u200B/g, "");
    return beforeCaretText.length === 0;
}

function getListItemOwnTextContent(listItemElement) {
    if (!listItemElement) return "";
    const cloneElement = listItemElement.cloneNode(true) as HTMLElement;
    cloneElement.querySelectorAll("ul,ol").forEach(listElement => listElement.remove());
    return (cloneElement.textContent || "").replace(/\u200B/g, "").trim();
}

function getAdjacentTableCell(tableCellElement, step) {
    if (!tableCellElement) return null;
    const tableElement = tableCellElement.closest("table");
    if (!tableElement) return null;

    const tableCells = [...tableElement.rows].flatMap(tableRowElement => [...tableRowElement.cells]);
    const currentCellIndex = tableCells.indexOf(tableCellElement);
    if (currentCellIndex === -1) return null;
    return tableCells[currentCellIndex + step] || null;
}

function isMathFigureElement(element) {
    if (!element || element.nodeType !== 1) return false;
    return Boolean(
        element.matches("figure.webhacker-math, figure.webhacker-mermaid") ||
            element.querySelector("code.language-math, code.language-mermaid")
    );
}

function findAdjacentElementFromBoundary(node, direction, rootElement) {
    let currentNode = node;
    while (currentNode && currentNode !== rootElement) {
        const siblingNode =
            direction < 0 ? currentNode.previousSibling : currentNode.nextSibling;
        if (siblingNode) {
            if (siblingNode.nodeType === 1) return siblingNode as Element;
            if (siblingNode.nodeType === 3 && (siblingNode.nodeValue || "").trim().length === 0) {
                currentNode = siblingNode;
                continue;
            }
            return null;
        }
        currentNode = currentNode.parentNode;
    }
    return null;
}

function getAdjacentElementForDelete(editor, selection, direction) {
    if (!selection || !selection.isCollapsed || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    if (!editor.contentEditableElement.contains(range.startContainer)) return null;

    const containerNode = range.startContainer;
    if (containerNode.nodeType === 3) {
        const textLength = (containerNode.nodeValue || "").length;
        if (direction < 0 && range.startOffset !== 0) return null;
        if (direction > 0 && range.startOffset !== textLength) return null;
        return findAdjacentElementFromBoundary(containerNode, direction, editor.contentEditableElement);
    }

    if (containerNode.nodeType === 1) {
        const boundaryIndex = direction < 0 ? range.startOffset - 1 : range.startOffset;
        const boundaryNode = containerNode.childNodes[boundaryIndex];
        if (boundaryNode && boundaryNode.nodeType === 1) return boundaryNode as Element;
        if (boundaryNode && boundaryNode.nodeType === 3) {
            if ((boundaryNode.nodeValue || "").trim().length > 0) return null;
            return findAdjacentElementFromBoundary(boundaryNode, direction, editor.contentEditableElement);
        }
        return findAdjacentElementFromBoundary(containerNode, direction, editor.contentEditableElement);
    }

    return null;
}

function selectionIntersectsMathFigure(editor, selection) {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;
    const range = selection.getRangeAt(0);
    const figureElements = [...editor.contentEditableElement.querySelectorAll("figure")].filter(
        figureElement => figureElement.querySelector("code.language-math, code.language-mermaid")
    );
    return figureElements.some(figureElement => {
        try {
            return range.intersectsNode(figureElement);
        } catch {
            return false;
        }
    });
}

function triggerToolbarControl(editor, controlId) {
    const controlButtonElement = editor.toolbarElement.querySelector(
        `.webhacker-button[data-control-id="${controlId}"]`
    );
    if (!controlButtonElement || controlButtonElement.disabled) return false;

    controlButtonElement.dispatchEvent(
        new MouseEvent("click", {
            bubbles: true,
            cancelable: true
        })
    );
    return true;
}

function extractPlainTextFromClipboard(htmlData, textData) {
    if (typeof textData === "string" && textData.length) return textData;
    if (!htmlData) return "";
    const templateElement = document.createElement("template");
    templateElement.innerHTML = String(htmlData);
    return templateElement.content.textContent || "";
}

function unwrapElementKeepChildren(element) {
    if (!element || !element.parentNode) return;
    const parentElement = element.parentNode;
    while (element.firstChild) parentElement.insertBefore(element.firstChild, element);
    parentElement.removeChild(element);
}

function resolveMarkFamily(tagName) {
    const normalizedTag = String(tagName || "").toLowerCase();
    if (normalizedTag === "strong" || normalizedTag === "b") return "bold";
    if (normalizedTag === "em" || normalizedTag === "i") return "italic";
    if (normalizedTag === "u") return "underline";
    return "";
}

function isSameMarkFamily(firstElement, secondElement) {
    if (!firstElement || !secondElement) return false;
    const firstFamily = resolveMarkFamily(firstElement.tagName);
    const secondFamily = resolveMarkFamily(secondElement.tagName);
    return Boolean(firstFamily) && firstFamily === secondFamily;
}

function normalizeInvalidInlineMarkContainers(rootElement) {
    if (!rootElement || !rootElement.querySelectorAll) return false;
    const selector = "strong,b,em,i,u";
    let changed = false;
    rootElement.querySelectorAll(selector).forEach(markElement => {
        if (markElement.querySelector(INLINE_MARK_BLOCK_SELECTOR)) {
            unwrapElementKeepChildren(markElement);
            changed = true;
        }
    });

    let hasNestedMarks = true;
    while (hasNestedMarks) {
        hasNestedMarks = false;
        rootElement.querySelectorAll(selector).forEach(markElement => {
            const parentElement = markElement.parentElement;
            if (parentElement && parentElement.matches(selector) && isSameMarkFamily(markElement, parentElement)) {
                unwrapElementKeepChildren(markElement);
                changed = true;
                hasNestedMarks = true;
            }
        });
    }

    rootElement.querySelectorAll(selector).forEach(markElement => {
        const meaningfulText = (markElement.textContent || "").replace(/\u200B/g, "").trim();
        const hasAtomicContent = Boolean(
            markElement.querySelector("img,svg,video,audio,iframe,canvas,math")
        );
        if (!meaningfulText.length && !hasAtomicContent) {
            unwrapElementKeepChildren(markElement);
            changed = true;
        }
    });
    return changed;
}

function bindInputEvents(editor) {
    editor.contentEditableElement.addEventListener("input", () => {
        normalizeInvalidInlineMarkContainers(editor.contentEditableElement);
        if (typeof editor.captureHistorySnapshot === "function") {
            editor.captureHistorySnapshot("input");
        }
        requestAnimationFrame(() => editor.highlightCodeAtCaret());
        editor.emitChange();
        editor.syncToggleStates();
    });
}

function bindClipboardEvents(editor) {
    editor.contentEditableElement.addEventListener("paste", event => {
        event.preventDefault();
        const clipboardData = event.clipboardData || window.clipboardData;
        const htmlData = clipboardData.getData("text/html");
        const textData = clipboardData.getData("text/plain");
        const pasteText = extractPlainTextFromClipboard(htmlData, textData);
        const selection = window.getSelection();
        const anchorNode = getSelectionAnchorElement(selection);
        const activeCodeElement = anchorNode && anchorNode.closest ? anchorNode.closest("pre code") : null;

        if (activeCodeElement) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(pasteText);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            if (typeof editor.captureHistorySnapshot === "function") {
                editor.captureHistorySnapshot("input");
            }
            editor.emitChange();
            editor.syncToggleStates();
            requestAnimationFrame(() => {
                editor.highlightCodeElement(activeCodeElement);
                editor.ensureCodeLanguageBadge(activeCodeElement.closest("pre"));
            });
            return;
        }

        if (pasteText) {
            const safeTextHtml = escapeHtml(pasteText).replace(/\r?\n/g, "<br>");
            executeRichCommand("insertHTML", safeTextHtml, editor);
        }
        if (typeof editor.captureHistorySnapshot === "function") {
            editor.captureHistorySnapshot("input");
        }
        editor.emitChange();
        editor.syncToggleStates();
        editor.highlightCodeBlocks();
    });

    editor.contentEditableElement.addEventListener("copy", event => {
        if (!event.clipboardData) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const fragment = selection.getRangeAt(0).cloneContents();
        const containerElement = document.createElement("div");
        containerElement.appendChild(fragment);
        containerElement.querySelectorAll(".webhacker-code-language").forEach(element => element.remove());
        stripMathRuntimeUi(containerElement);
        stripMermaidRuntimeUi(containerElement);
        const htmlValue = containerElement.innerHTML;
        const textValue = containerElement.textContent ?? "";

        event.clipboardData.setData("text/html", htmlValue);
        event.clipboardData.setData("text/plain", textValue);
        event.preventDefault();
    });
}

function bindSelectionEvents(editor) {
    ["mouseup", "keyup"].forEach(eventName => {
        editor.contentEditableElement.addEventListener(eventName, () => {
            editor.currentSavedSelectionRange = editor.saveSelectionRange();
            editor.syncToggleStates();
        });
    });

    editor.contentEditableElement.addEventListener("mousedown", event => {
        const targetCellElement =
            event.target && event.target.closest ? event.target.closest("td,th") : null;
        if (targetCellElement) {
            editor.ensureCaretAnchorInTableCell(targetCellElement, false);
        }
    });

    editor.contentEditableElement.addEventListener("click", event => {
        const anchorElement = event.target && event.target.closest ? event.target.closest("a") : null;
        if (anchorElement) event.preventDefault();
    });

    document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const anchorNode = getSelectionAnchorElement(selection);
        if (anchorNode && editor.contentEditableElement.contains(anchorNode)) {
            editor.currentSavedSelectionRange = editor.saveSelectionRange();
            editor.syncToggleStates();
            const tableCellElement = anchorNode.closest && anchorNode.closest("td,th");
            if (tableCellElement) editor.ensureCaretAnchorInTableCell(tableCellElement, false);
        }
    });
}

function bindKeyboardEvents(editor) {
    editor.contentEditableElement.addEventListener("keydown", event => {
        const hasCommandModifier = event.ctrlKey || event.metaKey;
        const selection = window.getSelection();
        const anchorNode = getSelectionAnchorElement(selection);
        const activePreElement = anchorNode && anchorNode.closest ? anchorNode.closest("pre") : null;
        const activeCodeElement = activePreElement
            ? activePreElement.querySelector("code")
            : anchorNode && anchorNode.closest
              ? anchorNode.closest("pre code")
              : null;
        const nearestCodeElement = anchorNode && anchorNode.closest ? anchorNode.closest("code") : null;
        const activeTableCellElement =
            anchorNode && anchorNode.closest ? anchorNode.closest("td,th") : null;
        const inlineCodeElement =
            nearestCodeElement && nearestCodeElement.closest && !nearestCodeElement.closest("pre")
                ? nearestCodeElement
                : null;
        const activeListItemElement = anchorNode && anchorNode.closest ? anchorNode.closest("li") : null;

        if (event.key === "Backspace" || event.key === "Delete") {
            const direction = event.key === "Backspace" ? -1 : 1;
            if (selectionIntersectsMathFigure(editor, selection)) {
                event.preventDefault();
                return;
            }
            const adjacentElement = getAdjacentElementForDelete(editor, selection, direction);
            if (adjacentElement && isMathFigureElement(adjacentElement)) {
                event.preventDefault();
                return;
            }
        }

        if ((event.key === "Backspace" || event.key === "Delete") && activePreElement) {
            const codeElement = activePreElement.querySelector("code");
            if (!codeElement || !activeCodeElement) {
                event.preventDefault();
                return;
            }
            if (
                event.key === "Backspace" &&
                selection &&
                selection.isCollapsed &&
                isCaretAtCodeStart(activeCodeElement, selection)
            ) {
                event.preventDefault();
                return;
            }
        }

        if (
            event.key === "Backspace" &&
            activeListItemElement &&
            !activeCodeElement &&
            selection &&
            selection.isCollapsed &&
            isCaretAtElementStart(activeListItemElement, selection)
        ) {
            event.preventDefault();
            const handled = executeRichCommand("backspaceListItem", null, editor);
            if (handled) {
                editor.emitChange();
                editor.syncToggleStates();
            }
            return;
        }

        if (
            hasCommandModifier &&
            event.code === "KeyA" &&
            !event.shiftKey &&
            !event.altKey &&
            activeCodeElement
        ) {
            event.preventDefault();
            return;
        }

        const matchingShortcutAction = SHORTCUT_ACTIONS.find(shortcutAction =>
            shortcutAction.shortcuts.some(shortcutDef => matchesShortcutEvent(event, shortcutDef))
        );
        if (matchingShortcutAction) {
            if (activeCodeElement && !matchingShortcutAction.allowInCodeBlock) return;

            if (matchingShortcutAction.type === "control") {
                if (triggerToolbarControl(editor, matchingShortcutAction.controlId)) {
                    event.preventDefault();
                    return;
                }
            } else if (matchingShortcutAction.type === "command") {
                event.preventDefault();
                const handled = executeRichCommand(matchingShortcutAction.command, null, editor);
                if (handled) {
                    editor.emitChange();
                    editor.syncToggleStates();
                }
                return;
            }
        }

        if (event.key === "Tab" && activeCodeElement) {
            event.preventDefault();
            executeRichCommand("insertText", "    ", editor);
            requestAnimationFrame(() => editor.highlightCodeAtCaret());
            editor.emitChange();
            return;
        }

        if (event.key === "Tab" && activeTableCellElement && !activeCodeElement) {
            event.preventDefault();
            const direction = event.shiftKey ? -1 : 1;
            const nextTableCellElement = getAdjacentTableCell(activeTableCellElement, direction);
            if (nextTableCellElement) {
                editor.ensureCaretAnchorInTableCell(nextTableCellElement, true);
                editor.syncToggleStates();
            } else if (!event.shiftKey) {
                editor.exitTableToNextLine(activeTableCellElement);
            }
            return;
        }

        if (event.key === "Tab" && activeListItemElement && !activeCodeElement && !activeTableCellElement) {
            event.preventDefault();
            const commandName = event.shiftKey ? "outdent" : "sinkListItem";
            const handled = executeRichCommand(commandName, null, editor);
            if (handled) {
                editor.emitChange();
                editor.syncToggleStates();
            }
            return;
        }

        if (event.key === "Enter" && activeCodeElement && hasCommandModifier && !event.shiftKey) {
            event.preventDefault();
            editor.exitCodeBlockToNextLine(activeCodeElement);
            return;
        }

        if (event.key === "Enter" && inlineCodeElement) {
            event.preventDefault();
            placeCaretAfterElement(inlineCodeElement);
            executeRichCommand("insertParagraph", null, editor);
            editor.emitChange();
            editor.syncToggleStates();
            return;
        }

        if (event.key === "Enter" && !event.shiftKey && !activeCodeElement) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount) {
                let node = sel.anchorNode;
                if (node && node.nodeType === 3) node = node.parentNode;
                const li = node && node.closest ? node.closest("li") : null;
                if (li) {
                    event.preventDefault();
                    const text = getListItemOwnTextContent(li);
                    const commandName = text === "" ? "outdent" : "splitListItem";
                    const handled = executeRichCommand(commandName, null, editor);
                    if (handled) {
                        editor.emitChange();
                        editor.syncToggleStates();
                    }
                    return;
                }
            }
        }
    });
}

export function installEditorEvents(WebHackerEditorClass) {
    if (installed) return;
    installed = true;

    WebHackerEditorClass.prototype.bindEditorEvents = function () {
        bindInputEvents(this);
        bindClipboardEvents(this);
        bindSelectionEvents(this);
        bindKeyboardEvents(this);
        this.highlightCodeBlocks();
    };
}
