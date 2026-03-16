import { CODE_LANGUAGE_OPTIONS } from "@/constants/indexConstants";
import WebHackerEditor from "@/core/indexCore";
import { executeRichCommand } from "@/core/indexCore";
import en from "@/translations/en.yml";
import ru from "@/translations/ru.yml";
import {
    getCodeLanguage,
    highlightCodeElementInternal,
    setCodeLanguage,
} from "@/features/code/highlight";

const translations = { ru, en };
let installed = false;

function createCodeDeleteButton(editorInstance, preElement: HTMLElement, t): HTMLButtonElement {
    const deleteButtonElement = document.createElement("button");
    deleteButtonElement.className = "webhacker-code-language__delete";
    deleteButtonElement.type = "button";
    deleteButtonElement.setAttribute("aria-label", t.deleteBlock);
    deleteButtonElement.setAttribute("title", t.deleteBlock);
    deleteButtonElement.setAttribute("data-tooltip", t.deleteBlock);
    deleteButtonElement.setAttribute("contenteditable", "false");
    deleteButtonElement.innerHTML = '<span class="fa-solid fa-trash-can" aria-hidden="true"></span>';

    deleteButtonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
    });

    deleteButtonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        editorInstance.contentEditableElement.focus();

        const selection = window.getSelection();
        if (!selection) return;

        const range = document.createRange();
        range.selectNode(preElement);
        selection.removeAllRanges();
        selection.addRange(range);

        executeRichCommand("delete", null, editorInstance);
        if (editorInstance.contentEditableElement.contains(preElement)) preElement.remove();

        if (typeof editorInstance.captureHistorySnapshot === "function") {
            editorInstance.captureHistorySnapshot("command");
        }

        editorInstance.emitChange();
        editorInstance.syncToggleStates();
        editorInstance.highlightCodeBlocks();
    });

    return deleteButtonElement;
}

function createCodeExitButton(editorInstance, codeElement: HTMLElement, t): HTMLButtonElement {
    const exitButtonElement = document.createElement("button");
    exitButtonElement.className = "webhacker-code-exit";
    exitButtonElement.type = "button";
    exitButtonElement.setAttribute("contenteditable", "false");
    exitButtonElement.setAttribute("aria-label", t.exitBlock);
    exitButtonElement.setAttribute("title", t.exitBlock);
    exitButtonElement.setAttribute("data-tooltip", t.exitBlock);
    exitButtonElement.innerHTML = '<span class="fa-solid fa-right-from-bracket" aria-hidden="true"></span>';

    exitButtonElement.addEventListener("mousedown", event => {
        event.preventDefault();
        event.stopPropagation();
    });

    exitButtonElement.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        editorInstance.contentEditableElement.focus();
        editorInstance.exitCodeBlockToNextLine(codeElement);
    });

    return exitButtonElement;
}

function moveCaretAfterCodeBlock(preElement: HTMLElement): void {
    const paragraphElement = document.createElement("p");
    const anchorTextNode = document.createTextNode("\u200B");
    paragraphElement.appendChild(anchorTextNode);
    preElement.insertAdjacentElement("afterend", paragraphElement);

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.setStart(anchorTextNode, 1);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

function getCaretOffsetInElement(containerElement: HTMLElement): number {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    if (!containerElement.contains(range.startContainer)) return 0;

    const beforeCaretRange = range.cloneRange();
    beforeCaretRange.selectNodeContents(containerElement);
    beforeCaretRange.setEnd(range.startContainer, range.startOffset);

    return beforeCaretRange.toString().replace(/\u200B/g, "").length;
}

function setCaretOffsetInElement(containerElement: HTMLElement, targetOffset: number): void {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    const walker = document.createTreeWalker(containerElement, NodeFilter.SHOW_TEXT);
    let currentOffset = 0;
    let currentNode = walker.nextNode() as Text | null;

    while (currentNode) {
        const nextOffset = currentOffset + currentNode.nodeValue.length;
        if (targetOffset <= nextOffset) {
            range.setStart(currentNode, Math.max(0, targetOffset - currentOffset));
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }

        currentOffset = nextOffset;
        currentNode = walker.nextNode() as Text | null;
    }

    range.selectNodeContents(containerElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

function removeCodeRuntimeUi(editorClone: HTMLElement): void {
    editorClone.querySelectorAll(".webhacker-code-language").forEach(element => element.remove());
    editorClone.querySelectorAll(".webhacker-code-exit").forEach(element => element.remove());

    editorClone.querySelectorAll("pre code").forEach(codeElement => {
        const textWalker = document.createTreeWalker(codeElement, NodeFilter.SHOW_TEXT);
        let textNode = textWalker.nextNode() as Text | null;

        while (textNode) {
            textNode.nodeValue = textNode.nodeValue.replace(/\u200B/g, "");
            textNode = textWalker.nextNode() as Text | null;
        }
    });
}

export function installCodeFeature(WebHackerEditorClass = WebHackerEditor): void {
    if (installed) return;
    installed = true;

    WebHackerEditorClass.prototype.highlightCodeElement = function (codeElement: HTMLElement): void {
        highlightCodeElementInternal(codeElement);
    };

    WebHackerEditorClass.prototype.exitCodeBlockToNextLine = function (codeElement: HTMLElement): boolean {
        const preElement = codeElement && codeElement.closest ? codeElement.closest("pre") : null;
        if (!(preElement instanceof HTMLElement) || !preElement.parentNode) return false;

        moveCaretAfterCodeBlock(preElement);
        this.emitChange();
        this.syncToggleStates();

        return true;
    };

    WebHackerEditorClass.prototype.ensureCodeLanguageBadge = function (preElement: HTMLElement | null): void {
        if (!(preElement instanceof HTMLElement)) return;
        const codeElement = preElement.querySelector("code");
        if (!(codeElement instanceof HTMLElement)) return;

        const lang = this.editorOptions.language || "ru";
        const t = translations[lang].code;
        const selectedLanguage = getCodeLanguage(codeElement);

        let badgeElement = preElement.querySelector(".webhacker-code-language") as HTMLElement | null;
        if (!badgeElement) {
            badgeElement = document.createElement("div");
            badgeElement.className = "webhacker-code-language";
            badgeElement.setAttribute("contenteditable", "false");

            const pickerElement = document.createElement("div");
            pickerElement.className = "webhacker-code-language__picker";

            const triggerButtonElement = document.createElement("button");
            triggerButtonElement.className = "webhacker-code-language__trigger";
            triggerButtonElement.type = "button";
            triggerButtonElement.setAttribute("aria-label", t.languageLabel);

            const menuElement = document.createElement("div");
            menuElement.className = "webhacker-code-language__menu webhacker-code-language__menu--hidden";

            CODE_LANGUAGE_OPTIONS.forEach(({ value, labelKey }) => {
                const optionButtonElement = document.createElement("button");
                optionButtonElement.className = "webhacker-code-language__item";
                optionButtonElement.type = "button";
                optionButtonElement.setAttribute("data-language", value);
                optionButtonElement.textContent = t.languages[labelKey];

                optionButtonElement.addEventListener("mousedown", event => {
                    event.preventDefault();
                    event.stopPropagation();
                });

                optionButtonElement.addEventListener("click", event => {
                    event.preventDefault();
                    event.stopPropagation();

                    setCodeLanguage(codeElement, value);
                    this.highlightCodeElement(codeElement);
                    this.ensureCodeLanguageBadge(preElement);
                    menuElement.classList.add("webhacker-code-language__menu--hidden");

                    if (typeof this.captureHistorySnapshot === "function") {
                        this.captureHistorySnapshot("command");
                    }

                    this.emitChange();
                });

                menuElement.appendChild(optionButtonElement);
            });

            triggerButtonElement.addEventListener("mousedown", event => {
                event.preventDefault();
                event.stopPropagation();
            });

            triggerButtonElement.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                menuElement.classList.toggle("webhacker-code-language__menu--hidden");
            });

            document.addEventListener("mousedown", event => {
                if (!pickerElement.contains(event.target as Node)) {
                    menuElement.classList.add("webhacker-code-language__menu--hidden");
                }
            });

            pickerElement.append(triggerButtonElement, menuElement);

            const deleteButtonElement = createCodeDeleteButton(this, preElement, t);
            const exitButtonElement = createCodeExitButton(this, codeElement, t);

            badgeElement.appendChild(pickerElement);
            badgeElement.appendChild(deleteButtonElement);
            preElement.appendChild(exitButtonElement);
            preElement.insertBefore(badgeElement, preElement.firstChild);
        }

        if (!preElement.querySelector(".webhacker-code-exit")) {
            preElement.appendChild(createCodeExitButton(this, codeElement, t));
        }

        if (!badgeElement.querySelector(".webhacker-code-language__delete")) {
            badgeElement.appendChild(createCodeDeleteButton(this, preElement, t));
        }

        const triggerButtonElement = badgeElement.querySelector(".webhacker-code-language__trigger") as HTMLButtonElement | null;
        const activeItem = badgeElement.querySelector(
            `.webhacker-code-language__item[data-language="${selectedLanguage}"]`,
        ) as HTMLElement | null;
        if (activeItem && triggerButtonElement) triggerButtonElement.textContent = activeItem.textContent;

        badgeElement.querySelectorAll(".webhacker-code-language__item").forEach(itemElement => {
            itemElement.classList.toggle(
                "is-active",
                itemElement.getAttribute("data-language") === selectedLanguage,
            );
        });
    };

    WebHackerEditorClass.prototype.highlightCodeBlocks = function (): void {
        this.contentEditableElement.querySelectorAll("pre").forEach(preElement => {
            preElement.removeAttribute("style");
            preElement.removeAttribute("align");

            const codeElement = preElement.querySelector("code");
            if (!(codeElement instanceof HTMLElement)) return;

            codeElement.removeAttribute("style");
            codeElement.removeAttribute("align");
            highlightCodeElementInternal(codeElement);
            this.ensureCodeLanguageBadge(preElement);
        });
    };

    WebHackerEditorClass.prototype.highlightCodeAtCaret = function (): void {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const node =
            selection.anchorNode && selection.anchorNode.nodeType === 3
                ? selection.anchorNode.parentNode
                : selection.anchorNode;
        const codeElement = node && (node as Element).closest ? (node as Element).closest("pre code") : null;
        if (!(codeElement instanceof HTMLElement)) return;

        const caretOffset = getCaretOffsetInElement(codeElement);
        this.highlightCodeElement(codeElement);

        const maxOffset = (codeElement.textContent ?? "").replace(/\u200B/g, "").length;
        setCaretOffsetInElement(codeElement, Math.min(caretOffset, maxOffset));
        this.ensureCodeLanguageBadge(codeElement.closest("pre"));
    };

    WebHackerEditorClass.prototype.getSerializableEditorHtml = function (): string {
        const editorClone = this.contentEditableElement.cloneNode(true) as HTMLElement;
        removeCodeRuntimeUi(editorClone);
        return editorClone.innerHTML;
    };
}
