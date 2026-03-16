import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../translations/en.yml", () => ({
    default: {
        placeholder: "Start typing...",
        undo: "Undo",
        redo: "Redo",
        bold: "Bold text",
        italic: "Italic text",
        underline: "Underlined text",
        color: "Text color",
        code: {
            label: "Code",
            inline: "Inline code",
            block: "Code block",
            languageLabel: "Code language",
            deleteBlock: "Delete code block",
            exitBlock: "Exit code block",
            languages: {
                plaintext: "Plain text",
                javascript: "JavaScript",
                typescript: "TypeScript",
                python: "Python",
                html: "HTML",
                css: "CSS",
                json: "JSON",
                bash: "Bash",
                sql: "SQL",
                java: "Java",
                csharp: "C#",
                cpp: "C++",
                c: "C",
                go: "Go",
                php: "PHP",
                ruby: "Ruby"
            }
        },
        math: {
            label: "Formula",
            inputLabel: "Enter formula",
            placeholder: "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
            preview: "Preview",
            docs: "Formula rules",
            insert: "Insert",
            update: "Update",
            editBlock: "Edit formula",
            deleteBlock: "Delete formula",
            exitBlock: "Exit formula block"
        },
        reset_styles: "Reset styles",
        link: "Link",
        image: "Image",
        headings: "Headings",
        table: "Table",
        unorderedList: "Bulleted list",
        orderedList: "Numbered list",
        alignLeft: "Align left",
        alignCenter: "Center",
        alignRight: "Align right",
        beta: "BETA",
        soon: "Soon",
        remove: "Remove",
        cancel: "Cancel",
        ok: "OK",
        paragraph: "Paragraph",
        linkPlaceholder: "https://example.com",
        linkTextPlaceholder: "Link text (optional)",
        clearColor: "Clear color",
        shortcuts: {
            title: "Keyboard shortcuts",
            fontSize: "Text size (Headings)",
            windowsColumn: "Windows/Linux",
            macColumn: "macOS",
            menuNavigate: "Menu navigation",
            menuNavigateKeys: "Arrow keys / Tab / Shift+Tab",
            menuSelect: "Menu select",
            menuSelectKeys: "Enter",
            layoutNote: "Shortcuts use physical keys and do not depend on keyboard layout."
        }
    }
}));

vi.mock("../translations/ru.yml", () => ({
    default: {
        placeholder: "Start typing...",
        undo: "Undo",
        redo: "Redo",
        bold: "Bold text",
        italic: "Italic text",
        underline: "Underlined text",
        color: "Text color",
        code: {
            label: "Code",
            inline: "Inline code",
            block: "Code block",
            languageLabel: "Code language",
            deleteBlock: "Delete code block",
            exitBlock: "Exit code block",
            languages: {
                plaintext: "Plain text",
                javascript: "JavaScript",
                typescript: "TypeScript",
                python: "Python",
                html: "HTML",
                css: "CSS",
                json: "JSON",
                bash: "Bash",
                sql: "SQL",
                java: "Java",
                csharp: "C#",
                cpp: "C++",
                c: "C",
                go: "Go",
                php: "PHP",
                ruby: "Ruby"
            }
        },
        math: {
            label: "Formula",
            inputLabel: "Enter formula",
            placeholder: "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
            preview: "Preview",
            docs: "Formula rules",
            insert: "Insert",
            update: "Update",
            editBlock: "Edit formula",
            deleteBlock: "Delete formula",
            exitBlock: "Exit formula block"
        },
        reset_styles: "Reset styles",
        link: "Link",
        image: "Image",
        headings: "Headings",
        table: "Table",
        unorderedList: "Bulleted list",
        orderedList: "Numbered list",
        alignLeft: "Align left",
        alignCenter: "Center",
        alignRight: "Align right",
        beta: "BETA",
        soon: "Soon",
        remove: "Remove",
        cancel: "Cancel",
        ok: "OK",
        paragraph: "Paragraph",
        linkPlaceholder: "https://example.com",
        linkTextPlaceholder: "Link text (optional)",
        clearColor: "Clear color",
        shortcuts: {
            title: "Keyboard shortcuts",
            fontSize: "Text size (Headings)",
            windowsColumn: "Windows/Linux",
            macColumn: "macOS",
            menuNavigate: "Menu navigation",
            menuNavigateKeys: "Arrow keys / Tab / Shift+Tab",
            menuSelect: "Menu select",
            menuSelectKeys: "Enter",
            layoutNote: "Shortcuts use physical keys and do not depend on keyboard layout."
        }
    }
}));

import WebHackerEditor from "../core/WebHackerEditor";
import "../features/editor/setup";

function click(element) {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

function setTextSelection(editor, text) {
    editor.contentEditableElement.innerHTML = `<p>${text}</p>`;
    const textNode = editor.contentEditableElement.querySelector("p").firstChild;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, text.length);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.currentSavedSelectionRange = editor.saveSelectionRange();
}

function setSelectionInsideElement(editor, selector) {
    const targetElement = editor.contentEditableElement.querySelector(selector);
    const range = document.createRange();
    range.selectNodeContents(targetElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.currentSavedSelectionRange = editor.saveSelectionRange();
}

function setCaretAtEndOfElement(editor, selector) {
    const targetElement = editor.contentEditableElement.querySelector(selector);
    const range = document.createRange();
    const textNode = targetElement.lastChild;

    if (textNode && textNode.nodeType === 3) {
        range.setStart(textNode, textNode.textContent.length);
    } else {
        range.selectNodeContents(targetElement);
        range.collapse(false);
    }

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.currentSavedSelectionRange = editor.saveSelectionRange();
}

function pressEditorKey(editor, keyboardEventInit) {
    editor.contentEditableElement.dispatchEvent(
        new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            ...keyboardEventInit
        })
    );
}

function getToolbarButtonByLabel(editor, label) {
    return editor.toolbarElement.querySelector(`button[aria-label="${label}"]`);
}

function getMenuItemByText(editor, text) {
    return [...editor.toolbarElement.querySelectorAll(".webhacker-menu__item")].find(itemElement => {
        const labelElement = itemElement.querySelector(".webhacker-menu__item-label");
        const labelText = labelElement ? labelElement.textContent.trim() : itemElement.textContent.trim();
        return labelText === text;
    });
}

describe("toolbar behavior", () => {
    let editor;

    beforeEach(() => {
        document.body.innerHTML = '<div id="editor"></div>';
        window.scrollTo = vi.fn();
        editor = new WebHackerEditor("#editor", { language: "en" });
    });

    it("renders essential controls", () => {
        expect(getToolbarButtonByLabel(editor, "Undo")).not.toBeNull();
        expect(getToolbarButtonByLabel(editor, "Code")).not.toBeNull();
        expect(getToolbarButtonByLabel(editor, "Formula")).not.toBeNull();
        expect(getToolbarButtonByLabel(editor, "Table")).not.toBeNull();
    });

    it("applies bold from toolbar", () => {
        setTextSelection(editor, "abc");
        click(getToolbarButtonByLabel(editor, "Bold text"));
        expect(editor.contentEditableElement.innerHTML).toContain("<strong>abc</strong>");
    });

    it("toggles bold off when selecting already bold text", () => {
        setTextSelection(editor, "abc");
        click(getToolbarButtonByLabel(editor, "Bold text"));
        setSelectionInsideElement(editor, "strong");
        click(getToolbarButtonByLabel(editor, "Bold text"));
        expect(editor.contentEditableElement.querySelector("strong")).toBeNull();
    });

    it("applies align center from toolbar", () => {
        setTextSelection(editor, "abc");
        click(getToolbarButtonByLabel(editor, "Center"));
        expect(editor.contentEditableElement.querySelector("p").style.textAlign).toBe("center");
    });

    it("inserts unordered list from shortcut", () => {
        setTextSelection(editor, "abc");
        pressEditorKey(editor, { code: "Digit8", ctrlKey: true, shiftKey: true });
        expect(editor.contentEditableElement.querySelector("ul li")).not.toBeNull();
    });

    it("converts unordered list to ordered list without nesting", () => {
        setTextSelection(editor, "abc");
        click(getToolbarButtonByLabel(editor, "Bulleted list"));
        setSelectionInsideElement(editor, "ul li");
        click(getToolbarButtonByLabel(editor, "Numbered list"));
        expect(editor.contentEditableElement.querySelector("ol li")).not.toBeNull();
        expect(editor.contentEditableElement.querySelector("ul ol")).toBeNull();
    });

    it("does not insert extra empty list item before next paragraph", () => {
        editor.contentEditableElement.innerHTML = "<ul><li>sd</li></ul><p>dsa</p>";
        setCaretAtEndOfElement(editor, "ul li");
        pressEditorKey(editor, { key: "Enter" });

        expect(editor.contentEditableElement.querySelectorAll("ul > li").length).toBe(1);
        expect(editor.contentEditableElement.innerHTML).toContain("<ul><li>sd</li></ul><p>dsa</p>");
    });

    it("handles code dropdown actions", () => {
        setTextSelection(editor, "abc");
        click(getToolbarButtonByLabel(editor, "Code"));
        click(getMenuItemByText(editor, "Code block"));
        expect(editor.contentEditableElement.querySelector("pre code")).not.toBeNull();

        setTextSelection(editor, "inline");
        click(getToolbarButtonByLabel(editor, "Code"));
        click(getMenuItemByText(editor, "Inline code"));
        expect(editor.contentEditableElement.querySelector("p code")).not.toBeNull();
    });

    it("handles table dropdown actions", () => {
        click(getToolbarButtonByLabel(editor, "Table"));
        const tableCellPickerElement = editor.toolbarElement.querySelector(".webhacker-tablepick__cell");
        click(tableCellPickerElement);
        expect(editor.contentEditableElement.querySelector("table.wh-table")).not.toBeNull();
    });

    it("handles math dropdown actions and keeps serialization clean", () => {
        click(getToolbarButtonByLabel(editor, "Formula"));

        const mathInputElement = editor.toolbarElement.querySelector(".webhacker-math-form__input");
        const mathInsertButtonElement = [...editor.toolbarElement.querySelectorAll(".webhacker-button")].find(
            buttonElement => buttonElement.textContent.trim() === "Insert"
        );

        mathInputElement.value = "\\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}";
        mathInputElement.dispatchEvent(new Event("input", { bubbles: true }));
        click(mathInsertButtonElement);

        expect(editor.contentEditableElement.querySelector("figure code.language-math")).not.toBeNull();
        const serializedHtml = editor.getHTML();
        expect(serializedHtml).toContain('<code class="language-math">');
        expect(serializedHtml).not.toContain("webhacker-math__preview");
        expect(serializedHtml).not.toContain("webhacker-math__actions");
    });

    it("inserts math even when saved selection range becomes stale", () => {
        const staleRange = document.createRange();
        const staleNode = document.createTextNode("stale");
        editor.contentEditableElement.appendChild(staleNode);
        staleRange.setStart(staleNode, 0);
        staleRange.setEnd(staleNode, staleNode.nodeValue.length);
        editor.currentSavedSelectionRange = staleRange;
        staleNode.remove();

        click(getToolbarButtonByLabel(editor, "Formula"));
        const mathInputElement = editor.toolbarElement.querySelector(".webhacker-math-form__input");
        const mathInsertButtonElement = [...editor.toolbarElement.querySelectorAll(".webhacker-button")].find(
            buttonElement => buttonElement.textContent.trim() === "Insert"
        );

        mathInputElement.value = "x^2";
        mathInputElement.dispatchEvent(new Event("input", { bubbles: true }));
        click(mathInsertButtonElement);

        expect(editor.contentEditableElement.querySelector("figure code.language-math")).not.toBeNull();
    });

    it("inserts link via link dropdown", () => {
        setTextSelection(editor, "site");
        click(getToolbarButtonByLabel(editor, "Link"));

        const [urlInputElement, textInputElement] = editor.toolbarElement.querySelectorAll(
            ".webhacker-input"
        );
        urlInputElement.value = "example.com";
        textInputElement.value = "My Link";

        const okButtonElement = [...editor.toolbarElement.querySelectorAll(".webhacker-button")].find(
            buttonElement => buttonElement.textContent.trim() === "OK"
        );
        click(okButtonElement);

        const linkElement = editor.contentEditableElement.querySelector("a");
        expect(linkElement).not.toBeNull();
        expect(linkElement.getAttribute("href")).toContain("example.com");
    });

    it("supports undo/redo", () => {
        setTextSelection(editor, "abc");
        click(getToolbarButtonByLabel(editor, "Bold text"));
        expect(editor.contentEditableElement.innerHTML).toContain("<strong>abc</strong>");

        click(getToolbarButtonByLabel(editor, "Undo"));
        expect(editor.contentEditableElement.innerHTML).not.toContain("<strong>abc</strong>");

        click(getToolbarButtonByLabel(editor, "Redo"));
        expect(editor.contentEditableElement.innerHTML).toContain("<strong>abc</strong>");
    });
});
