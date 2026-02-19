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

const LANGUAGE_MODULES = [
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
    const rawText = (codeElement.innerText ?? codeElement.textContent ?? "").replace(/\u200B/g, "");
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
