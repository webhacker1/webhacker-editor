import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../translations/en.yml", () => ({
    default: {
        placeholder: "Start typing...",
        undo: "Undo",
        redo: "Redo",
        bold: "Bold",
        italic: "Italic",
        underline: "Underline",
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
        ok: "OK",
        paragraph: "Paragraph",
        linkPlaceholder: "https://example.com",
        linkTextPlaceholder: "Link text (optional)",
        clearColor: "Clear color"
    }
}));

vi.mock("../translations/ru.yml", () => ({
    default: {
        placeholder: "Start typing...",
        undo: "Undo",
        redo: "Redo",
        bold: "Bold",
        italic: "Italic",
        underline: "Underline",
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
        ok: "OK",
        paragraph: "Paragraph",
        linkPlaceholder: "https://example.com",
        linkTextPlaceholder: "Link text (optional)",
        clearColor: "Clear color"
    }
}));

import WebHackerEditor from "../core/WebHackerEditor.js";
import "../features/code/index.js";
import "../features/table/editorBindings.js";
import "../features/editor/events/index.js";

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

describe("toolbar buttons", () => {
    let editor;
    let execCommandMock;

    beforeEach(() => {
        document.body.innerHTML = '<div id="editor"></div>';
        execCommandMock = vi.fn(() => true);
        document.execCommand = execCommandMock;
        document.queryCommandState = vi.fn(() => false);
        window.scrollTo = vi.fn();
        editor = new WebHackerEditor("#editor", { language: "en" });
    });

    it("runs history and formatting command buttons", () => {
        click(getToolbarButtonByLabel(editor, "Undo"));
        click(getToolbarButtonByLabel(editor, "Redo"));
        click(getToolbarButtonByLabel(editor, "Bold"));
        click(getToolbarButtonByLabel(editor, "Italic"));
        click(getToolbarButtonByLabel(editor, "Underline"));
        click(getToolbarButtonByLabel(editor, "Align left"));
        click(getToolbarButtonByLabel(editor, "Center"));
        click(getToolbarButtonByLabel(editor, "Align right"));
        click(getToolbarButtonByLabel(editor, "Bulleted list"));
        click(getToolbarButtonByLabel(editor, "Numbered list"));
        click(getToolbarButtonByLabel(editor, "Reset styles"));

        expect(execCommandMock).toHaveBeenCalledWith("undo", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("redo", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("bold", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("italic", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("underline", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("justifyLeft", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("justifyCenter", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("justifyRight", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("insertUnorderedList", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("insertOrderedList", false, null);
        expect(execCommandMock).toHaveBeenCalledWith("removeFormat", false, null);
    });

    it("keeps image button disabled", () => {
        const imageButtonElement = editor.toolbarElement.querySelector('button[aria-disabled="true"]');
        expect(imageButtonElement).not.toBeNull();
        expect(imageButtonElement.disabled).toBe(true);
    });

    it("handles code dropdown actions", () => {
        click(getToolbarButtonByLabel(editor, "Code"));
        click(getMenuItemByText(editor, "Code block"));
        expect(editor.contentEditableElement.querySelector("pre code")).not.toBeNull();

        setTextSelection(editor, "abc");
        click(getToolbarButtonByLabel(editor, "Code"));
        click(getMenuItemByText(editor, "Inline code"));
        expect(editor.contentEditableElement.querySelector("code")).not.toBeNull();
    });

    it("handles heading dropdown actions", () => {
        click(getToolbarButtonByLabel(editor, "Headings"));
        click(getMenuItemByText(editor, "H2"));
        expect(execCommandMock).toHaveBeenCalledWith("formatBlock", false, "H2");
    });

    it("handles color dropdown actions", () => {
        const highlightSpy = vi.spyOn(editor, "highlightCodeBlocks");
        click(getToolbarButtonByLabel(editor, "Text color"));
        const swatchButtonElement = editor.toolbarElement.querySelector(".webhacker-swatch");
        click(swatchButtonElement);
        expect(execCommandMock.mock.calls.some(([command]) => command === "foreColor")).toBe(true);
        expect(highlightSpy).toHaveBeenCalled();
    });

    it("handles link dropdown actions", () => {
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

        expect(execCommandMock.mock.calls.some(([command]) => command === "insertHTML")).toBe(true);
    });

    it("handles table dropdown actions", () => {
        click(getToolbarButtonByLabel(editor, "Table"));
        const tableCellPickerElement = editor.toolbarElement.querySelector(".webhacker-tablepick__cell");
        click(tableCellPickerElement);
        expect(editor.contentEditableElement.querySelector("table.wh-table")).not.toBeNull();
    });

    it("keeps code blocks and restores code controls after reset styles", () => {
        editor.contentEditableElement.innerHTML =
            '<p><strong>hello</strong> <code>inline</code></p><pre><code class="language-plaintext">const a = 1;</code></pre>';
        editor.highlightCodeBlocks();

        const range = document.createRange();
        range.selectNodeContents(editor.contentEditableElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        click(getToolbarButtonByLabel(editor, "Reset styles"));

        expect(execCommandMock).toHaveBeenCalledWith("removeFormat", false, null);
        const preElement = editor.contentEditableElement.querySelector("pre");
        expect(preElement).not.toBeNull();
        expect(preElement.querySelector("code")).not.toBeNull();
        expect(preElement.querySelector(".webhacker-code-language")).not.toBeNull();
        expect(preElement.querySelector(".webhacker-code-exit")).not.toBeNull();
        expect(editor.contentEditableElement.textContent).toContain("const a = 1;");
    });
});
