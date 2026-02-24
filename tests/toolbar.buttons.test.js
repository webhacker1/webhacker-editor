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

function placeCaretInEditor(editor) {
    const range = document.createRange();
    range.selectNodeContents(editor.contentEditableElement);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function pressEditorKey(editor, keyboardEventInit) {
    const derivedCode =
        keyboardEventInit.code ||
        (typeof keyboardEventInit.key === "string" && keyboardEventInit.key.length === 1
            ? /[a-z]/i.test(keyboardEventInit.key)
                ? `Key${keyboardEventInit.key.toUpperCase()}`
                : /[0-9]/.test(keyboardEventInit.key)
                  ? `Digit${keyboardEventInit.key}`
                  : undefined
            : undefined);
    editor.contentEditableElement.dispatchEvent(
        new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            code: derivedCode,
            ...keyboardEventInit
        })
    );
}

function getControlMenu(editor, controlId) {
    const buttonElement = editor.toolbarElement.querySelector(
        `.webhacker-button[data-control-id="${controlId}"]`
    );
    if (!buttonElement) return null;
    const dropdownElement = buttonElement.closest(".webhacker-dropdown");
    return dropdownElement ? dropdownElement.querySelector(".webhacker-menu") : null;
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

function getActiveTableCell() {
    const selection = window.getSelection();
    const node = selection && selection.anchorNode;
    if (!node) return null;
    const elementNode = node.nodeType === 3 ? node.parentNode : node;
    return elementNode.closest ? elementNode.closest("td,th") : null;
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
        click(getToolbarButtonByLabel(editor, "Bold text"));
        click(getToolbarButtonByLabel(editor, "Italic text"));
        click(getToolbarButtonByLabel(editor, "Underlined text"));
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

    it("supports keyboard navigation and Enter in link menu", () => {
        placeCaretInEditor(editor);
        click(getToolbarButtonByLabel(editor, "Link"));
        const linkMenuElement = getControlMenu(editor, "link");
        expect(linkMenuElement.classList.contains("webhacker-menu--hidden")).toBe(false);

        const [urlInputElement, textInputElement] = linkMenuElement.querySelectorAll(".webhacker-input");
        expect(document.activeElement).toBe(urlInputElement);
        urlInputElement.value = "example.com";
        textInputElement.value = "My Link";

        textInputElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true
            })
        );

        expect(execCommandMock.mock.calls.some(([command]) => command === "insertHTML")).toBe(true);
    });

    it("handles table dropdown actions", () => {
        click(getToolbarButtonByLabel(editor, "Table"));
        const tableCellPickerElement = editor.toolbarElement.querySelector(".webhacker-tablepick__cell");
        click(tableCellPickerElement);
        expect(editor.contentEditableElement.querySelector("table.wh-table")).not.toBeNull();
    });

    it("opens color, headings and table menus with keyboard shortcuts", () => {
        placeCaretInEditor(editor);

        pressEditorKey(editor, { key: "c", code: "KeyC", ctrlKey: true, altKey: true });
        expect(getControlMenu(editor, "color").classList.contains("webhacker-menu--hidden")).toBe(false);

        editor.closeAllMenus();

        pressEditorKey(editor, { key: "h", code: "KeyH", ctrlKey: true, altKey: true });
        expect(getControlMenu(editor, "heading").classList.contains("webhacker-menu--hidden")).toBe(false);

        editor.closeAllMenus();

        pressEditorKey(editor, { key: "t", code: "KeyT", ctrlKey: true, altKey: true });
        expect(getControlMenu(editor, "table").classList.contains("webhacker-menu--hidden")).toBe(false);
    });

    it("opens remaining tool menus with keyboard shortcuts", () => {
        placeCaretInEditor(editor);

        pressEditorKey(editor, { key: "k", code: "KeyK", ctrlKey: true });
        expect(getControlMenu(editor, "link").classList.contains("webhacker-menu--hidden")).toBe(false);

        editor.closeAllMenus();

        pressEditorKey(editor, { key: "k", code: "KeyK", ctrlKey: true, altKey: true });
        expect(getControlMenu(editor, "code").classList.contains("webhacker-menu--hidden")).toBe(false);

        editor.closeAllMenus();

        pressEditorKey(editor, { key: "/", code: "Slash", ctrlKey: true, altKey: true });
        expect(getControlMenu(editor, "shortcutsHelp").classList.contains("webhacker-menu--hidden")).toBe(
            false
        );
    });

    it("applies formatting, align, lists and reset shortcuts", () => {
        placeCaretInEditor(editor);

        pressEditorKey(editor, { key: "b", code: "KeyB", ctrlKey: true });
        pressEditorKey(editor, { key: "i", code: "KeyI", ctrlKey: true });
        pressEditorKey(editor, { key: "u", code: "KeyU", ctrlKey: true });
        pressEditorKey(editor, { key: "l", code: "KeyL", ctrlKey: true, shiftKey: true });
        pressEditorKey(editor, { key: "e", code: "KeyE", ctrlKey: true, shiftKey: true });
        pressEditorKey(editor, { key: "r", code: "KeyR", ctrlKey: true, shiftKey: true });
        pressEditorKey(editor, { key: "*", code: "Digit8", ctrlKey: true, shiftKey: true });
        pressEditorKey(editor, { key: "&", code: "Digit7", ctrlKey: true, shiftKey: true });
        pressEditorKey(editor, { key: "\\", code: "Backslash", ctrlKey: true });

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

    it("matches shortcuts by physical key code and not by layout-dependent key", () => {
        placeCaretInEditor(editor);

        pressEditorKey(editor, { key: "с", code: "KeyC", ctrlKey: true, altKey: true });
        expect(getControlMenu(editor, "color").classList.contains("webhacker-menu--hidden")).toBe(false);
    });

    it("supports keyboard navigation and Enter in heading menu", () => {
        click(getToolbarButtonByLabel(editor, "Headings"));
        const headingMenuElement = getControlMenu(editor, "heading");
        expect(headingMenuElement.classList.contains("webhacker-menu--hidden")).toBe(false);

        headingMenuElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "ArrowDown",
                bubbles: true,
                cancelable: true
            })
        );
        headingMenuElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true
            })
        );

        expect(execCommandMock).toHaveBeenCalledWith("formatBlock", false, "H1");
    });

    it("supports keyboard navigation and Enter in code menu", () => {
        placeCaretInEditor(editor);
        click(getToolbarButtonByLabel(editor, "Code"));
        const codeMenuElement = getControlMenu(editor, "code");
        expect(codeMenuElement.classList.contains("webhacker-menu--hidden")).toBe(false);

        codeMenuElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "ArrowDown",
                bubbles: true,
                cancelable: true
            })
        );
        codeMenuElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true
            })
        );

        expect(editor.contentEditableElement.querySelector("pre code")).not.toBeNull();
    });

    it("supports keyboard navigation and Enter in table menu", () => {
        placeCaretInEditor(editor);
        click(getToolbarButtonByLabel(editor, "Table"));
        const tableMenuElement = getControlMenu(editor, "table");
        expect(tableMenuElement.classList.contains("webhacker-menu--hidden")).toBe(false);

        tableMenuElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "ArrowRight",
                bubbles: true,
                cancelable: true
            })
        );
        tableMenuElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true
            })
        );

        const tableElement = editor.contentEditableElement.querySelector("table.wh-table");
        expect(tableElement).not.toBeNull();
        expect(tableElement.querySelectorAll("tr").length).toBe(1);
        expect(tableElement.querySelectorAll("td").length).toBe(2);
    });

    it("navigates table cells with Tab and Shift+Tab", () => {
        placeCaretInEditor(editor);
        editor.insertMinimalTable(2, 2);
        const tableCells = [...editor.contentEditableElement.querySelectorAll("td")];
        editor.ensureCaretAnchorInTableCell(tableCells[0], true);

        editor.contentEditableElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Tab",
                bubbles: true,
                cancelable: true
            })
        );
        expect(getActiveTableCell()).toBe(tableCells[1]);

        editor.contentEditableElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Tab",
                shiftKey: true,
                bubbles: true,
                cancelable: true
            })
        );
        expect(getActiveTableCell()).toBe(tableCells[0]);
    });

    it("exits table to next line when Tab is pressed in the last cell", () => {
        placeCaretInEditor(editor);
        editor.insertMinimalTable(1, 2);
        const tableElement = editor.contentEditableElement.querySelector("table.wh-table");
        const tableCells = [...tableElement.querySelectorAll("td")];
        editor.ensureCaretAnchorInTableCell(tableCells[1], true);

        editor.contentEditableElement.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Tab",
                bubbles: true,
                cancelable: true
            })
        );

        const paragraphAfterTableElement = tableElement.nextElementSibling;
        expect(paragraphAfterTableElement).not.toBeNull();
        expect(paragraphAfterTableElement.tagName).toBe("P");
        expect(getActiveTableCell()).toBeNull();
        expect(paragraphAfterTableElement.contains(window.getSelection().anchorNode)).toBe(true);
    });

    it("shows shortcuts manual dropdown", () => {
        click(getToolbarButtonByLabel(editor, "Keyboard shortcuts"));
        const shortcutsMenuElement = getControlMenu(editor, "shortcutsHelp");
        expect(shortcutsMenuElement).not.toBeNull();
        expect(shortcutsMenuElement.classList.contains("webhacker-menu--hidden")).toBe(false);
        expect(shortcutsMenuElement.textContent).toContain("Windows/Linux");
        expect(shortcutsMenuElement.textContent).toContain("macOS");
        expect(shortcutsMenuElement.textContent).toContain("Ctrl + Alt + C");
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
