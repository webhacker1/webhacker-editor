import { getCaretOffsetWithin } from "./caret.js";

export function getActiveCodeElement() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let node = sel.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;
  const pre = node ? node.closest("pre") : null;
  if (!pre) return null;
  return pre.querySelector("code") || pre;
}

export function replaceTextInCode(
  codeElement,
  startOffset,
  endOffset,
  insertText
) {
  const text = codeElement.textContent;
  const before = text.slice(0, startOffset);
  const after = text.slice(endOffset);
  codeElement.textContent = before + insertText + after;
  return before.length + insertText.length;
}

export const isCaretAtEnd = (code) =>
  getCaretOffsetWithin(code) === code.textContent.length;

export function currentLineInfo(code) {
  const offset = getCaretOffsetWithin(code);
  const text = code.textContent;
  const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
  const lineEnd = text.indexOf("\n", offset);
  return {
    offset,
    text,
    lineStart,
    lineEnd: lineEnd === -1 ? text.length : lineEnd,
    line: text.slice(lineStart, offset),
  };
}

export function getCodeLanguage(codeEl) {
  for (const cls of codeEl.classList) {
    if (cls.startsWith("language-")) return cls.slice("language-".length);
  }
  return "auto";
}

export function setCodeLanguage(codeEl, lang) {
  [...codeEl.classList].forEach(
    (c) => c.startsWith("language-") && codeEl.classList.remove(c)
  );
  if (lang && lang !== "auto") codeEl.classList.add(`language-${lang}`);
}

export function highlightCodeElement(codeEl) {
  if (!window.hljs) return;
  const text = codeEl.textContent; // plain
  const lang = getCodeLanguage(codeEl);

  let html;
  try {
    if (lang && lang !== "auto") {
      html = window.hljs.highlight(text, {
        language: lang,
        ignoreIllegals: true,
      }).value;
    } else {
      html = window.hljs.highlightAuto(text).value;
    }
  } catch (e) {
    html = text.replace(
      /[&<>]/g,
      (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[s])
    );
  }

    const prev = codeEl.innerHTML;
    if (prev !== html) {
    codeEl.innerHTML = html;
    }
    codeEl.classList.add("hljs");
}
