import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeRichCommand } from "@/core/indexCore";

vi.mock("@/translations/en.yml", () => ({
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
        mermaid: {
            label: "Diagram",
            inputLabel: "Enter Mermaid code",
            placeholder: "flowchart TD",
            preview: "Preview",
            docs: "Mermaid syntax",
            insert: "Insert",
            update: "Update",
            editBlock: "Edit diagram",
            deleteBlock: "Delete diagram",
            exitBlock: "Exit diagram block"
        },
        voice: {
            label: "Voice",
            start: "Start voice input",
            stop: "Stop voice input",
            unsupported: "Voice input is not supported in this browser"
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

vi.mock("@/translations/ru.yml", () => ({
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
        mermaid: {
            label: "Diagram",
            inputLabel: "Enter Mermaid code",
            placeholder: "flowchart TD",
            preview: "Preview",
            docs: "Mermaid syntax",
            insert: "Insert",
            update: "Update",
            editBlock: "Edit diagram",
            deleteBlock: "Delete diagram",
            exitBlock: "Exit diagram block"
        },
        voice: {
            label: "Voice",
            start: "Start voice input",
            stop: "Stop voice input",
            unsupported: "Voice input is not supported in this browser"
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

import WebHackerEditor from "@/core/indexCore";
import "@/features/editor/setup";

function click(element) {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

function userClick(element) {
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
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

function setCaretAtStartOfElement(editor, selector) {
    const targetElement = editor.contentEditableElement.querySelector(selector);
    const range = document.createRange();
    const textNode = targetElement.firstChild;

    if (textNode && textNode.nodeType === 3) {
        range.setStart(textNode, 0);
    } else {
        range.selectNodeContents(targetElement);
        range.collapse(true);
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

function setSelectionOffsetsInElement(editor, selector, startOffset, endOffset) {
    const targetElement = editor.contentEditableElement.querySelector(selector);
    const textNode = targetElement.firstChild;
    const range = document.createRange();
    range.setStart(textNode, startOffset);
    range.setEnd(textNode, endOffset);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.currentSavedSelectionRange = editor.saveSelectionRange();
}

function setSelectionBetweenElements(
    editor,
    startSelector,
    startOffset,
    endSelector,
    endOffset
) {
    const startElement = editor.contentEditableElement.querySelector(startSelector);
    const endElement = editor.contentEditableElement.querySelector(endSelector);
    const startTextNode = startElement.firstChild;
    const endTextNode = endElement.firstChild;
    const range = document.createRange();
    range.setStart(startTextNode, startOffset);
    range.setEnd(endTextNode, endOffset);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor.currentSavedSelectionRange = editor.saveSelectionRange();
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
        expect(getToolbarButtonByLabel(editor, "Diagram")).not.toBeNull();
        expect(getToolbarButtonByLabel(editor, "Start voice input")).not.toBeNull();
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

    it("keeps expanded selection after applying bold", () => {
        setTextSelection(editor, "abcd");
        userClick(getToolbarButtonByLabel(editor, "Bold text"));

        const selection = window.getSelection();
        expect(selection).not.toBeNull();
        expect(selection.isCollapsed).toBe(false);
        expect(selection.toString()).toContain("abcd");
    });

    it("keeps expanded multi-block selection after applying bold", () => {
        editor.contentEditableElement.innerHTML = "<p>first</p><p>second</p><p>third</p>";
        setSelectionBetweenElements(editor, "p:first-child", 0, "p:last-child", 5);
        userClick(getToolbarButtonByLabel(editor, "Bold text"));

        const selection = window.getSelection();
        expect(selection).not.toBeNull();
        expect(selection.isCollapsed).toBe(false);
        expect(selection.toString()).toContain("first");
        expect(selection.toString()).toContain("third");
    });

    it("removes bold only from selected part of bold text", () => {
        editor.contentEditableElement.innerHTML = "<p><strong>abcd</strong></p>";
        setSelectionOffsetsInElement(editor, "strong", 1, 3);
        click(getToolbarButtonByLabel(editor, "Bold text"));

        const strongNodes = [...editor.contentEditableElement.querySelectorAll("strong")];
        expect(strongNodes.length).toBeGreaterThan(0);
        expect(editor.contentEditableElement.textContent.replace(/\u200B/g, "")).toContain("abcd");
    });

    it("removes bold from partial selection inside one strong with leading zero-width space", () => {
        editor.contentEditableElement.innerHTML = "<p><strong>\u200Bывы ыф ВЫФ в</strong></p>";
        const strongElement = editor.contentEditableElement.querySelector("strong");
        const textNode = strongElement.firstChild;
        const range = document.createRange();
        range.setStart(textNode, 1);
        range.setEnd(textNode, textNode.textContent.length);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        editor.currentSavedSelectionRange = editor.saveSelectionRange();

        click(getToolbarButtonByLabel(editor, "Bold text"));
        expect(editor.contentEditableElement.querySelector("strong")).toBeNull();
        expect(editor.contentEditableElement.textContent.replace(/\u200B/g, "")).toContain("ывы ыф ВЫФ в");
    });

    it("does not remove whole bold block on collapsed caret toggle", () => {
        editor.contentEditableElement.innerHTML = "<p><strong>abc</strong></p>";
        setSelectionOffsetsInElement(editor, "strong", 1, 1);
        click(getToolbarButtonByLabel(editor, "Bold text"));

        expect(editor.contentEditableElement.querySelector("strong")).not.toBeNull();
    });

    it("disables bold for next input when toggled off at collapsed caret", () => {
        editor.contentEditableElement.innerHTML = "<p><strong>abc</strong></p>";
        setSelectionOffsetsInElement(editor, "strong", 3, 3);
        click(getToolbarButtonByLabel(editor, "Bold text"));
        executeRichCommand("insertText", "x", editor);

        const paragraphElement = editor.contentEditableElement.querySelector("p");
        const serialized = (paragraphElement.innerHTML || "").replace(/\u200B/g, "");
        expect(serialized).toContain("<strong>abc</strong>x");
    });

    it("disables italic for next input when toggled off at collapsed caret", () => {
        editor.contentEditableElement.innerHTML = "<p><em>abc</em></p>";
        setSelectionOffsetsInElement(editor, "em", 3, 3);
        click(getToolbarButtonByLabel(editor, "Italic text"));
        executeRichCommand("insertText", "x", editor);

        const paragraphElement = editor.contentEditableElement.querySelector("p");
        const serialized = (paragraphElement.innerHTML || "").replace(/\u200B/g, "");
        expect(serialized).toContain("<em>abc</em>x");
    });

    it("disables underline for next input when toggled off at collapsed caret", () => {
        editor.contentEditableElement.innerHTML = "<p><u>abc</u></p>";
        setSelectionOffsetsInElement(editor, "u", 3, 3);
        click(getToolbarButtonByLabel(editor, "Underlined text"));
        executeRichCommand("insertText", "x", editor);

        const paragraphElement = editor.contentEditableElement.querySelector("p");
        const serialized = (paragraphElement.innerHTML || "").replace(/\u200B/g, "");
        expect(serialized).toContain("<u>abc</u>x");
    });

    it("removes bold when selection spans multiple bold fragments", () => {
        editor.contentEditableElement.innerHTML =
            "<p><strong>ab</strong></p><p><strong>cd</strong></p>";
        setSelectionBetweenElements(editor, "p:first-child strong", 0, "p:last-child strong", 2);
        click(getToolbarButtonByLabel(editor, "Bold text"));

        expect(editor.contentEditableElement.querySelector("strong")).toBeNull();
        expect(editor.contentEditableElement.textContent.replace(/\u200B/g, "")).toContain("abcd");
    });

    it("does not create invalid strong wrapping block elements on multiline selection", () => {
        editor.contentEditableElement.innerHTML = "<p>ab</p><p>cd</p>";
        setSelectionBetweenElements(editor, "p:first-child", 0, "p:last-child", 2);
        click(getToolbarButtonByLabel(editor, "Bold text"));

        expect(editor.contentEditableElement.querySelector("strong > p")).toBeNull();
        expect(editor.contentEditableElement.querySelector("p > strong")).not.toBeNull();

        setSelectionBetweenElements(editor, "p:first-child strong", 0, "p:last-child strong", 2);
        click(getToolbarButtonByLabel(editor, "Bold text"));
        expect(editor.contentEditableElement.querySelector("strong")).toBeNull();
    });

    it("removes bold across blocks even when selection includes inter-block whitespace", () => {
        editor.contentEditableElement.innerHTML = "<p><strong>ab</strong></p>\n<p><strong>cd</strong></p>";
        setSelectionBetweenElements(editor, "p:first-child strong", 0, "p:last-child strong", 2);
        click(getToolbarButtonByLabel(editor, "Bold text"));
        expect(editor.contentEditableElement.querySelector("strong")).toBeNull();
    });

    it("removes bold from mixed selection when anchor starts inside bold text", () => {
        editor.contentEditableElement.innerHTML = "<p><strong>ab</strong> cd</p>";
        setSelectionBetweenElements(editor, "strong", 0, "p", 5);
        click(getToolbarButtonByLabel(editor, "Bold text"));

        expect(editor.contentEditableElement.querySelector("strong")).toBeNull();
        expect(editor.contentEditableElement.textContent.replace(/\u200B/g, "")).toContain("ab cd");
    });

    it("removes bold across list items with nested paragraphs", () => {
        editor.contentEditableElement.innerHTML =
            "<ol><li><strong><em>a</em></strong><p><strong><em>b</em></strong></p></li><li>\u200B<p><strong><em>c</em></strong></p></li></ol>";
        setSelectionBetweenElements(
            editor,
            "li:first-child strong em",
            0,
            "li:last-child strong em",
            1
        );
        click(getToolbarButtonByLabel(editor, "Bold text"));
        expect(editor.contentEditableElement.querySelector("strong")).toBeNull();
    });

    it("uses active editor selection on toolbar mousedown even with stale saved range", () => {
        editor.contentEditableElement.innerHTML = "<p>abcd</p>";
        setSelectionOffsetsInElement(editor, "p", 0, 2);

        const staleRange = document.createRange();
        const textNode = editor.contentEditableElement.querySelector("p").firstChild;
        staleRange.setStart(textNode, 3);
        staleRange.setEnd(textNode, 3);
        editor.currentSavedSelectionRange = staleRange;

        userClick(getToolbarButtonByLabel(editor, "Bold text"));
        const strongElement = editor.contentEditableElement.querySelector("strong");
        expect(strongElement).not.toBeNull();
        expect(strongElement.textContent).toBe("ab");
    });

    it("normalizes invalid inline mark containers on input", () => {
        editor.contentEditableElement.innerHTML = "<strong><p>broken</p></strong>";
        editor.contentEditableElement.dispatchEvent(new Event("input", { bubbles: true }));
        expect(editor.contentEditableElement.querySelector("strong > p")).toBeNull();
    });

    it("flattens nested strong nodes on input", () => {
        editor.contentEditableElement.innerHTML = "<p><strong>a<strong>b</strong></strong></p>";
        editor.contentEditableElement.dispatchEvent(new Event("input", { bubbles: true }));
        expect(editor.contentEditableElement.querySelector("strong strong")).toBeNull();
        expect(editor.contentEditableElement.textContent.replace(/\u200B/g, "")).toContain("ab");
    });

    it("keeps italic inside bold during normalization", () => {
        editor.contentEditableElement.innerHTML = "<p><strong>a<em>b</em></strong></p>";
        editor.contentEditableElement.dispatchEvent(new Event("input", { bubbles: true }));
        expect(editor.contentEditableElement.querySelector("strong em")).not.toBeNull();
    });

    it("keeps underline inside bold during normalization", () => {
        editor.contentEditableElement.innerHTML = "<p><strong>a<u>b</u></strong></p>";
        editor.contentEditableElement.dispatchEvent(new Event("input", { bubbles: true }));
        expect(editor.contentEditableElement.querySelector("strong u")).not.toBeNull();
    });

    it("applies align center from toolbar", () => {
        setTextSelection(editor, "abc");
        click(getToolbarButtonByLabel(editor, "Center"));
        expect(editor.contentEditableElement.querySelector("p").style.textAlign).toBe("center");
    });

    it("applies align center to all selected paragraphs", () => {
        editor.contentEditableElement.innerHTML = "<p>one</p><p>two</p><p>three</p>";
        setSelectionBetweenElements(editor, "p:first-child", 0, "p:last-child", 5);
        click(getToolbarButtonByLabel(editor, "Center"));

        const paragraphs = [...editor.contentEditableElement.querySelectorAll("p")];
        expect(paragraphs.every(paragraphElement => paragraphElement.style.textAlign === "center")).toBe(true);
    });

    it("keeps list marker with text when centering list item", () => {
        editor.contentEditableElement.innerHTML = "<ul><li>abc</li></ul>";
        setCaretAtEndOfElement(editor, "ul li");
        click(getToolbarButtonByLabel(editor, "Center"));
        const listItemElement = editor.contentEditableElement.querySelector("li");
        expect(listItemElement.style.textAlign).toBe("center");
        expect(listItemElement.style.listStylePosition).toBe("inside");

        click(getToolbarButtonByLabel(editor, "Align left"));
        expect(listItemElement.style.textAlign).toBe("");
        expect(listItemElement.style.listStylePosition).toBe("");
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

    it("splits list item on Enter even when a paragraph follows", () => {
        editor.contentEditableElement.innerHTML = "<ul><li>sd</li></ul><p>dsa</p>";
        setCaretAtEndOfElement(editor, "ul li");
        pressEditorKey(editor, { key: "Enter" });

        const listItems = [...editor.contentEditableElement.querySelectorAll("ul > li")];
        expect(listItems.length).toBe(2);
        expect(listItems[0].textContent.replace(/\u200B/g, "")).toBe("sd");
        expect(listItems[1].textContent.replace(/\u200B/g, "")).toBe("");
        expect(editor.contentEditableElement.querySelector("p").textContent).toContain("dsa");
    });

    it("exits list on Enter in an empty list item without invalid ul>p markup", () => {
        editor.contentEditableElement.innerHTML = "<ul><li>\u200B</li></ul>";
        setCaretAtEndOfElement(editor, "ul li");
        pressEditorKey(editor, { key: "Enter" });

        expect(editor.contentEditableElement.querySelector("ul")).toBeNull();
        expect(editor.contentEditableElement.querySelector("p")).not.toBeNull();
    });

    it("indents list item with Tab", () => {
        editor.contentEditableElement.innerHTML = "<ul><li>one</li><li>two</li></ul>";
        setCaretAtStartOfElement(editor, "ul > li:nth-child(2)");
        pressEditorKey(editor, { key: "Tab" });

        expect(editor.contentEditableElement.querySelectorAll("ul > li").length).toBe(1);
        expect(
            editor.contentEditableElement.querySelector("ul > li > ul > li").textContent.replace(/\u200B/g, "")
        ).toBe("two");
    });

    it("outdents nested list item with Shift+Tab", () => {
        editor.contentEditableElement.innerHTML = "<ul><li>one<ul><li>two</li></ul></li></ul>";
        setCaretAtStartOfElement(editor, "ul > li > ul > li");
        pressEditorKey(editor, { key: "Tab", shiftKey: true });

        const topListItems = [...editor.contentEditableElement.querySelectorAll("ul > li")];
        expect(topListItems.length).toBe(2);
        expect(topListItems[0].textContent.replace(/\u200B/g, "")).toContain("one");
        expect(topListItems[1].textContent.replace(/\u200B/g, "")).toContain("two");
    });

    it("merges list item with previous on Backspace at start", () => {
        editor.contentEditableElement.innerHTML = "<ul><li>one</li><li>two</li></ul>";
        setCaretAtStartOfElement(editor, "ul > li:nth-child(2)");
        pressEditorKey(editor, { key: "Backspace" });

        const listItems = [...editor.contentEditableElement.querySelectorAll("ul > li")];
        expect(listItems.length).toBe(1);
        expect(listItems[0].textContent.replace(/\u200B/g, "")).toContain("onetwo");
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

    it("toggles dropdown menu state on repeated trigger clicks", () => {
        const codeButtonElement = getToolbarButtonByLabel(editor, "Code");
        const dropdownMenuElement = codeButtonElement
            .closest(".webhacker-dropdown")
            .querySelector(".webhacker-menu");

        click(codeButtonElement);
        expect(dropdownMenuElement.classList.contains("webhacker-menu--hidden")).toBe(false);

        click(codeButtonElement);
        expect(dropdownMenuElement.classList.contains("webhacker-menu--hidden")).toBe(true);
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
        console.log(editor.contentEditableElement.innerHTML);

        expect(editor.contentEditableElement.querySelector("figure code.language-math")).not.toBeNull();
        const serializedHtml = editor.getHTML();
        expect(serializedHtml).toContain('<code class="language-math">');
        expect(serializedHtml).not.toContain("webhacker-math__preview");
        expect(serializedHtml).not.toContain("webhacker-math__actions");
    });

    it("handles mermaid dropdown actions and keeps serialization clean", () => {
        click(getToolbarButtonByLabel(editor, "Diagram"));

        const mermaidInputElement = editor.toolbarElement.querySelector(".webhacker-mermaid-form__input");
        const mermaidInsertButtonElement = editor.toolbarElement.querySelector(
            ".webhacker-mermaid-form .webhacker-button--primary"
        );

        mermaidInputElement.value = "flowchart TD\\nA[Start] --> B[Done]";
        mermaidInputElement.dispatchEvent(new Event("input", { bubbles: true }));
        click(mermaidInsertButtonElement);

        expect(editor.contentEditableElement.querySelector("figure code.language-mermaid")).not.toBeNull();
        const serializedHtml = editor.getHTML();
        expect(serializedHtml).toContain('<code class="language-mermaid">');
        expect(serializedHtml).not.toContain("webhacker-mermaid__preview");
        expect(serializedHtml).not.toContain("webhacker-mermaid__actions");
    });

    it("does not delete math block with Backspace when caret is after it", () => {
        click(getToolbarButtonByLabel(editor, "Formula"));
        const mathInputElement = editor.toolbarElement.querySelector(".webhacker-math-form__input");
        const mathInsertButtonElement = [...editor.toolbarElement.querySelectorAll(".webhacker-button")].find(
            buttonElement => buttonElement.textContent.trim() === "Insert"
        );

        mathInputElement.value = "x^2";
        mathInputElement.dispatchEvent(new Event("input", { bubbles: true }));
        click(mathInsertButtonElement);
        expect(editor.contentEditableElement.querySelector("figure.webhacker-math")).not.toBeNull();

        pressEditorKey(editor, { key: "Backspace" });
        expect(editor.contentEditableElement.querySelector("figure.webhacker-math")).not.toBeNull();
    });

    it("does not delete math block with Delete when caret is before it", () => {
        editor.contentEditableElement.innerHTML =
            '<p>test</p><figure class="webhacker-math"><code class="language-math">x^2</code></figure>';
        editor.renderMathBlocks();
        setCaretAtEndOfElement(editor, "p");

        pressEditorKey(editor, { key: "Delete" });
        expect(editor.contentEditableElement.querySelector("figure.webhacker-math")).not.toBeNull();
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

    it("updates existing link instead of nesting a new anchor", () => {
        editor.contentEditableElement.innerHTML = '<p><a href="https://old.example">old</a></p>';
        setCaretAtEndOfElement(editor, "a");

        click(getToolbarButtonByLabel(editor, "Link"));
        const [urlInputElement, textInputElement] = editor.toolbarElement.querySelectorAll(
            ".webhacker-input"
        );
        urlInputElement.value = "https://new.example";
        textInputElement.value = "new text";

        const okButtonElement = [...editor.toolbarElement.querySelectorAll(".webhacker-button")].find(
            buttonElement => buttonElement.textContent.trim() === "OK"
        );
        click(okButtonElement);

        const anchors = [...editor.contentEditableElement.querySelectorAll("a")];
        expect(anchors.length).toBe(1);
        expect(anchors[0].getAttribute("href")).toBe("https://new.example");
        expect(anchors[0].textContent).toBe("new text");
    });

    it("clear color removes active inline color style", () => {
        setTextSelection(editor, "abc");
        click(getToolbarButtonByLabel(editor, "Text color"));
        const colorSwatchElement = editor.toolbarElement.querySelector(".webhacker-swatch");
        click(colorSwatchElement);
        expect(editor.contentEditableElement.querySelector('span[style*="color"]')).not.toBeNull();

        click(getToolbarButtonByLabel(editor, "Text color"));
        const clearColorButtonElement = editor.toolbarElement.querySelector(
            ".webhacker-color .webhacker-button--ghost"
        );
        click(clearColorButtonElement);
        expect(editor.contentEditableElement.querySelector('span[style*="color"]')).toBeNull();
    });

    it("recolors mixed plain and pre-colored text into one selected color", () => {
        editor.contentEditableElement.innerHTML =
            '<p><span style="color:#ef4444">red</span> plain <span style="color:#2563eb">blue</span></p>';

        const paragraphElement = editor.contentEditableElement.querySelector("p");
        const startTextNode = paragraphElement.firstChild.firstChild;
        const endTextNode = paragraphElement.lastChild.firstChild;
        const range = document.createRange();
        range.setStart(startTextNode, 0);
        range.setEnd(endTextNode, endTextNode.textContent.length);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        editor.currentSavedSelectionRange = editor.saveSelectionRange();

        click(getToolbarButtonByLabel(editor, "Text color"));
        const targetSwatchElement = editor.toolbarElement.querySelector('.webhacker-swatch[data-color="#10B981"]');
        click(targetSwatchElement);

        const colorSpans = [...editor.contentEditableElement.querySelectorAll("span")];
        const usedColors = colorSpans
            .map(element => (element as HTMLElement).style.color)
            .filter(Boolean);
        expect(usedColors.length).toBeGreaterThan(0);
        expect(new Set(usedColors).size).toBe(1);
    });

    it("does not emit change when only opening a dropdown", () => {
        const onChange = vi.fn();
        document.body.innerHTML = '<div id="editor"></div>';
        editor = new WebHackerEditor("#editor", { language: "en", onChange });

        click(getToolbarButtonByLabel(editor, "Code"));
        expect(onChange).not.toHaveBeenCalled();
    });

    it("does not hijack typing keys inside link form fields", () => {
        setTextSelection(editor, "site");
        click(getToolbarButtonByLabel(editor, "Link"));

        const [urlInputElement] = editor.toolbarElement.querySelectorAll(".webhacker-input");
        urlInputElement.focus();
        const spaceEvent = new KeyboardEvent("keydown", {
            key: " ",
            bubbles: true,
            cancelable: true
        });

        const wasNotCanceled = urlInputElement.dispatchEvent(spaceEvent);
        expect(wasNotCanceled).toBe(true);
        expect(spaceEvent.defaultPrevented).toBe(false);
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
