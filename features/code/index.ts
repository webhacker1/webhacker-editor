import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import java from "highlight.js/lib/languages/java";
import csharp from "highlight.js/lib/languages/csharp";
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import go from "highlight.js/lib/languages/go";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import { CODE_LANGUAGE_OPTIONS } from "../../constants/codeLanguages";
import { executeRichCommand } from "../../core/commands";
import WebHackerEditor from "../../core/WebHackerEditor";
import ru from "../../translations/ru.yml";
import en from "../../translations/en.yml";

const LANGUAGE_MODULES: Array<[string, any]> = [
    ["javascript", javascript],
    ["typescript", typescript],
    ["python", python],
    ["xml", xml],
    ["css", css],
    ["json", json],
    ["bash", bash],
    ["sql", sql],
    ["java", java],
    ["csharp", csharp],
    ["cpp", cpp],
    ["c", c],
    ["go", go],
    ["php", php],
    ["ruby", ruby]
];

LANGUAGE_MODULES.forEach(([name, languageModule]) => {
    hljs.registerLanguage(name, languageModule);
});

const LANGUAGE_ALIAS_MAP = {
    js: "javascript",
    ts: "typescript",
    html: "xml",
    sh: "bash",
    shell: "bash",
    cs: "csharp",
    "c#": "csharp",
    "c++": "cpp",
    plaintext: "plaintext",
    text: "plaintext"
};

const translations = { ru, en };
let installed = false;

export function getCodeLanguage(codeElement) {
    const classMatch = [...codeElement.classList].find(className => className.startsWith("language-"));
    if (!classMatch) return "plaintext";
    const rawLanguage = classMatch.slice("language-".length).toLowerCase();
    return LANGUAGE_ALIAS_MAP[rawLanguage] || rawLanguage;
}

export function setCodeLanguage(codeElement, language) {
    [...codeElement.classList]
        .filter(className => className.startsWith("language-"))
        .forEach(className => codeElement.classList.remove(className));
    codeElement.classList.add(`language-${language}`);
}

export function highlightCodeElementInternal(codeElement) {
    const rawText = (codeElement.textContent ?? "").replace(/\u200B/g, "");
    const language = getCodeLanguage(codeElement);

    if (!rawText.length) {
        codeElement.textContent = "\u200B";
        codeElement.classList.remove("hljs");
        return;
    }

    if (language === "plaintext" || !hljs.getLanguage(language)) {
        codeElement.textContent = rawText;
        setCodeLanguage(codeElement, "plaintext");
        codeElement.classList.remove("hljs");
        return;
    }

    const highlighted = hljs.highlight(rawText, {
        language,
        ignoreIllegals: true
    });
    codeElement.innerHTML = highlighted.value;
    setCodeLanguage(codeElement, language);
    codeElement.classList.add("hljs");
}

export function highlightCodeBlocksInElement(rootElement) {
    if (!rootElement || !rootElement.querySelectorAll) return;
    rootElement.querySelectorAll("pre code").forEach(codeElement => {
        highlightCodeElementInternal(codeElement);
    });
}

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

export function installCodeFeature(WebHackerEditorClass = WebHackerEditor) {
    if (installed) return;
    installed = true;

    WebHackerEditorClass.prototype.highlightCodeElement = function (codeElement) {
        highlightCodeElementInternal(codeElement);
    };

    WebHackerEditorClass.prototype.exitCodeBlockToNextLine = function (codeElement) {
        const preElement = codeElement && codeElement.closest ? codeElement.closest("pre") : null;
        if (!preElement || !preElement.parentNode) return false;
        moveCaretAfterCodeBlock(preElement);
        this.emitChange();
        this.syncToggleStates();
        return true;
    };

    WebHackerEditorClass.prototype.ensureCodeLanguageBadge = function (preElement) {
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

    WebHackerEditorClass.prototype.highlightCodeBlocks = function () {
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

    WebHackerEditorClass.prototype.highlightCodeAtCaret = function () {
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

    WebHackerEditorClass.prototype.getSerializableEditorHtml = function () {
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
}

function autoHighlightRichContent() {
    if (typeof document === "undefined") return;
    document.querySelectorAll(".webhacker-view-content").forEach(rootElement => {
        highlightCodeBlocksInElement(rootElement);
    });
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", autoHighlightRichContent, { once: true });
    } else {
        autoHighlightRichContent();
    }
}
