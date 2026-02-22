import { CODE_LANGUAGE_OPTIONS } from "../../constants/codeLanguages.js";
import { executeRichCommand } from "../../core/commands.js";
import WebHackerEditor from "../../core/WebHackerEditor.js";
import ru from "../../translations/ru.yml";
import en from "../../translations/en.yml";
import {
    getCodeLanguage,
    setCodeLanguage,
    highlightCodeElementInternal
} from "./engine.js";

const translations = { ru, en };

function createCodeDeleteButton(editorInstance, preElement, t) {
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
        const range = document.createRange();
        range.selectNode(preElement);
        selection.removeAllRanges();
        selection.addRange(range);
        executeRichCommand("delete");
        if (editorInstance.contentEditableElement.contains(preElement)) preElement.remove();
        editorInstance.emitChange();
        editorInstance.syncToggleStates();
        editorInstance.highlightCodeBlocks();
    });
    return deleteButtonElement;
}

function createCodeExitButton(editorInstance, codeElement, t) {
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

function moveCaretAfterCodeBlock(preElement) {
    const paragraphElement = document.createElement("p");
    const anchorTextNode = document.createTextNode("\u200B");
    paragraphElement.appendChild(anchorTextNode);
    preElement.insertAdjacentElement("afterend", paragraphElement);

    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(anchorTextNode, 1);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

function getCaretOffsetInElement(containerElement) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    const range = selection.getRangeAt(0);
    if (!containerElement.contains(range.startContainer)) return 0;

    const beforeCaretRange = range.cloneRange();
    beforeCaretRange.selectNodeContents(containerElement);
    beforeCaretRange.setEnd(range.startContainer, range.startOffset);
    return beforeCaretRange.toString().replace(/\u200B/g, "").length;
}

function setCaretOffsetInElement(containerElement, targetOffset) {
    const selection = window.getSelection();
    const range = document.createRange();
    const walker = document.createTreeWalker(containerElement, NodeFilter.SHOW_TEXT);
    let currentOffset = 0;
    let currentNode = walker.nextNode();

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
        currentNode = walker.nextNode();
    }

    range.selectNodeContents(containerElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

WebHackerEditor.prototype.highlightCodeElement = function (codeElement) {
    highlightCodeElementInternal(codeElement);
};

WebHackerEditor.prototype.exitCodeBlockToNextLine = function (codeElement) {
    const preElement = codeElement && codeElement.closest ? codeElement.closest("pre") : null;
    if (!preElement || !preElement.parentNode) return false;
    moveCaretAfterCodeBlock(preElement);
    this.emitChange();
    this.syncToggleStates();
    return true;
};

WebHackerEditor.prototype.ensureCodeLanguageBadge = function (preElement) {
    const codeElement = preElement.querySelector("code");
    if (!codeElement) return;

    const lang = this.editorOptions.language || "ru";
    const t = translations[lang].code;
    const selectedLanguage = getCodeLanguage(codeElement);

    let badgeElement = preElement.querySelector(".webhacker-code-language");
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
            if (!pickerElement.contains(event.target))
                menuElement.classList.add("webhacker-code-language__menu--hidden");
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

    const triggerButtonElement = badgeElement.querySelector(".webhacker-code-language__trigger");
    const activeItem = badgeElement.querySelector(
        `.webhacker-code-language__item[data-language="${selectedLanguage}"]`
    );
    if (activeItem) triggerButtonElement.textContent = activeItem.textContent;

    badgeElement.querySelectorAll(".webhacker-code-language__item").forEach(itemElement => {
        itemElement.classList.toggle(
            "is-active",
            itemElement.getAttribute("data-language") === selectedLanguage
        );
    });
};

WebHackerEditor.prototype.highlightCodeBlocks = function () {
    this.contentEditableElement.querySelectorAll("pre").forEach(preElement => {
        preElement.removeAttribute("style");
        preElement.removeAttribute("align");
        const codeElement = preElement.querySelector("code");
        if (!codeElement) return;
        codeElement.removeAttribute("style");
        codeElement.removeAttribute("align");
        highlightCodeElementInternal(codeElement);
        this.ensureCodeLanguageBadge(preElement);
    });
};

WebHackerEditor.prototype.highlightCodeAtCaret = function () {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const node =
        selection.anchorNode && selection.anchorNode.nodeType === 3
            ? selection.anchorNode.parentNode
            : selection.anchorNode;
    const codeElement = node && node.closest ? node.closest("pre code") : null;
    if (!codeElement) return;

    const caretOffset = getCaretOffsetInElement(codeElement);
    this.highlightCodeElement(codeElement);
    const maxOffset = (codeElement.textContent ?? "").replace(/\u200B/g, "").length;
    setCaretOffsetInElement(codeElement, Math.min(caretOffset, maxOffset));
    this.ensureCodeLanguageBadge(codeElement.closest("pre"));
};

WebHackerEditor.prototype.getSerializableEditorHtml = function () {
    const editorClone = this.contentEditableElement.cloneNode(true);
    editorClone.querySelectorAll(".webhacker-code-language").forEach(element => element.remove());
    editorClone.querySelectorAll(".webhacker-code-exit").forEach(element => element.remove());
    editorClone.querySelectorAll("pre code").forEach(codeElement => {
        const textWalker = document.createTreeWalker(codeElement, NodeFilter.SHOW_TEXT);
        let textNode = textWalker.nextNode();
        while (textNode) {
            textNode.nodeValue = textNode.nodeValue.replace(/\u200B/g, "");
            textNode = textWalker.nextNode();
        }
    });
    return editorClone.innerHTML;
};
