import hljs from "highlight.js/lib/core";
import type { LanguageFn } from "highlight.js";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

const LANGUAGE_MODULES: Array<[string, LanguageFn]> = [
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
    ["ruby", ruby],
];

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
    text: "plaintext",
};

LANGUAGE_MODULES.forEach(([name, languageModule]) => {
    hljs.registerLanguage(name, languageModule);
});

export function getCodeLanguage(codeElement: HTMLElement): string {
    const classMatch = [...codeElement.classList].find(className => className.startsWith("language-"));
    if (!classMatch) return "plaintext";

    const rawLanguage = classMatch.slice("language-".length).toLowerCase();
    return LANGUAGE_ALIAS_MAP[rawLanguage] || rawLanguage;
}

export function setCodeLanguage(codeElement: HTMLElement, language: string): void {
    [...codeElement.classList]
        .filter(className => className.startsWith("language-"))
        .forEach(className => codeElement.classList.remove(className));

    codeElement.classList.add(`language-${language}`);
}

export function highlightCodeElementInternal(codeElement: HTMLElement): void {
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
        ignoreIllegals: true,
    });

    codeElement.innerHTML = highlighted.value;
    setCodeLanguage(codeElement, language);
    codeElement.classList.add("hljs");
}

export function highlightCodeBlocksInElement(rootElement: ParentNode | null): void {
    if (!rootElement || !(rootElement as Element).querySelectorAll) return;

    rootElement.querySelectorAll("pre code").forEach(codeElement => {
        if (!(codeElement instanceof HTMLElement)) return;
        highlightCodeElementInternal(codeElement);
    });
}

function autoHighlightRichContent(): void {
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
