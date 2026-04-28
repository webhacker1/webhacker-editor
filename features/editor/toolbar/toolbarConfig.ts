export const MATH_DOCS_URL = "https://en.wikibooks.org/wiki/LaTeX/Mathematics";
export const MERMAID_DOCS_URL = "https://mermaid.js.org/intro/syntax-reference.html";

export const TOOLBAR_LAYOUT: Array<"separator" | string[]> = [
    ["undo", "redo"],
    "separator",
    ["bold", "italic", "underline", "code", "math", "mermaid", "voice", "color", "link", "imageDisabled"],
    "separator",
    ["heading"],
    "separator",
    ["alignLeft", "alignCenter", "alignRight"],
    "separator",
    ["unorderedList", "orderedList", "table"],
    "separator",
    ["resetStyles", "shortcutsHelp"]
];

export const COMMAND_CONTROLS = {
    undo: {
        title: t => t.undo,
        iconClassName: "fa-solid fa-rotate-left",
        commandName: "undo"
    },
    redo: {
        title: t => t.redo,
        iconClassName: "fa-solid fa-rotate-right",
        commandName: "redo"
    },
    bold: {
        title: t => t.bold,
        iconClassName: "fa-solid fa-bold",
        commandName: "bold",
        trackToggleState: true,
        toggleKey: "bold"
    },
    italic: {
        title: t => t.italic,
        iconClassName: "fa-solid fa-italic",
        commandName: "italic",
        trackToggleState: true,
        toggleKey: "italic"
    },
    underline: {
        title: t => t.underline,
        iconClassName: "fa-solid fa-underline",
        commandName: "underline",
        trackToggleState: true,
        toggleKey: "underline"
    },
    alignLeft: {
        title: t => t.alignLeft,
        iconClassName: "fa-solid fa-align-left",
        commandName: "justifyLeft",
        trackToggleState: true,
        toggleKey: "alignLeft"
    },
    alignCenter: {
        title: t => t.alignCenter,
        iconClassName: "fa-solid fa-align-center",
        commandName: "justifyCenter",
        trackToggleState: true,
        toggleKey: "alignCenter"
    },
    alignRight: {
        title: t => t.alignRight,
        iconClassName: "fa-solid fa-align-right",
        commandName: "justifyRight",
        trackToggleState: true,
        toggleKey: "alignRight"
    },
    unorderedList: {
        title: t => t.unorderedList,
        iconClassName: "fa-solid fa-list-ul",
        commandName: "insertUnorderedList",
        trackToggleState: true,
        toggleKey: "unorderedList"
    },
    orderedList: {
        title: t => t.orderedList,
        iconClassName: "fa-solid fa-list-ol",
        commandName: "insertOrderedList",
        trackToggleState: true,
        toggleKey: "orderedList"
    },
    resetStyles: {
        title: t => t.reset_styles,
        iconClassName: "fa-solid fa-eraser",
        commandName: "removeFormat"
    }
};
