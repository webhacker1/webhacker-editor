import {
    CODE_BACKSLASH,
    CODE_DIGIT_7,
    CODE_DIGIT_8,
    CODE_KEY_B,
    CODE_KEY_C,
    CODE_KEY_D,
    CODE_KEY_E,
    CODE_KEY_H,
    CODE_KEY_I,
    CODE_KEY_K,
    CODE_KEY_L,
    CODE_KEY_M,
    CODE_KEY_R,
    CODE_KEY_T,
    CODE_KEY_U,
    CODE_KEY_Y,
    CODE_KEY_Z,
    CODE_SLASH,
} from "@/constants/indexConstants";

function shortcut(code, { shift = false, alt = false } = {}) {
    return { code, shift, alt };
}

export const SHORTCUT_ACTIONS = [
    {
        id: "undo",
        type: "command",
        command: "undo",
        allowInCodeBlock: true,
        shortcuts: [shortcut(CODE_KEY_Z)]
    },
    {
        id: "redo",
        type: "command",
        command: "redo",
        allowInCodeBlock: true,
        shortcuts: [shortcut(CODE_KEY_Y), shortcut(CODE_KEY_Z, { shift: true })]
    },
    {
        id: "bold",
        type: "command",
        command: "bold",
        shortcuts: [shortcut(CODE_KEY_B)]
    },
    {
        id: "italic",
        type: "command",
        command: "italic",
        shortcuts: [shortcut(CODE_KEY_I)]
    },
    {
        id: "underline",
        type: "command",
        command: "underline",
        shortcuts: [shortcut(CODE_KEY_U)]
    },
    {
        id: "code",
        type: "control",
        controlId: "code",
        shortcuts: [shortcut(CODE_KEY_K, { alt: true })]
    },
    {
        id: "color",
        type: "control",
        controlId: "color",
        shortcuts: [shortcut(CODE_KEY_C, { alt: true })]
    },
    {
        id: "math",
        type: "control",
        controlId: "math",
        shortcuts: [shortcut(CODE_KEY_M, { alt: true })]
    },
    {
        id: "mermaid",
        type: "control",
        controlId: "mermaid",
        shortcuts: [shortcut(CODE_KEY_D, { alt: true })]
    },
    {
        id: "link",
        type: "control",
        controlId: "link",
        shortcuts: [shortcut(CODE_KEY_K)]
    },
    {
        id: "fontSize",
        type: "control",
        controlId: "heading",
        shortcuts: [shortcut(CODE_KEY_H, { alt: true })]
    },
    {
        id: "alignLeft",
        type: "command",
        command: "justifyLeft",
        shortcuts: [shortcut(CODE_KEY_L, { shift: true })]
    },
    {
        id: "alignCenter",
        type: "command",
        command: "justifyCenter",
        shortcuts: [shortcut(CODE_KEY_E, { shift: true })]
    },
    {
        id: "alignRight",
        type: "command",
        command: "justifyRight",
        shortcuts: [shortcut(CODE_KEY_R, { shift: true })]
    },
    {
        id: "unorderedList",
        type: "command",
        command: "insertUnorderedList",
        shortcuts: [shortcut(CODE_DIGIT_8, { shift: true })]
    },
    {
        id: "orderedList",
        type: "command",
        command: "insertOrderedList",
        shortcuts: [shortcut(CODE_DIGIT_7, { shift: true })]
    },
    {
        id: "table",
        type: "control",
        controlId: "table",
        shortcuts: [shortcut(CODE_KEY_T, { alt: true })]
    },
    {
        id: "resetStyles",
        type: "command",
        command: "removeFormat",
        shortcuts: [shortcut(CODE_BACKSLASH)]
    },
    {
        id: "shortcutsHelp",
        type: "control",
        controlId: "shortcutsHelp",
        shortcuts: [shortcut(CODE_SLASH, { alt: true })]
    }
];

function toKeyLabel(code) {
    if (code.startsWith("Key")) return code.slice(3);
    if (code.startsWith("Digit")) return code.slice(5);
    if (code === CODE_BACKSLASH) return "\\";
    if (code === CODE_SLASH) return "/";
    return code;
}

function formatSingleShortcut(shortcutDef, platform) {
    const parts = [];
    if (platform === "mac") {
        parts.push("⌘");
        if (shortcutDef.alt) parts.push("⌥");
        if (shortcutDef.shift) parts.push("⇧");
    } else {
        parts.push("Ctrl");
        if (shortcutDef.alt) parts.push("Alt");
        if (shortcutDef.shift) parts.push("Shift");
    }
    parts.push(toKeyLabel(shortcutDef.code));
    return parts.join(" + ");
}

export function formatShortcutList(shortcuts, platform) {
    return shortcuts.map(shortcutDef => formatSingleShortcut(shortcutDef, platform)).join(" / ");
}

export function matchesShortcutEvent(event, shortcutDef) {
    if (!event || event.getModifierState?.("AltGraph")) return false;
    return (
        (event.ctrlKey || event.metaKey) &&
        !event.repeat &&
        event.code === shortcutDef.code &&
        Boolean(event.shiftKey) === Boolean(shortcutDef.shift) &&
        Boolean(event.altKey) === Boolean(shortcutDef.alt)
    );
}
