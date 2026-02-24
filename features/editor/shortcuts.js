function shortcut(code, { shift = false, alt = false } = {}) {
    return { code, shift, alt };
}

export const SHORTCUT_ACTIONS = [
    {
        id: "undo",
        type: "command",
        command: "undo",
        allowInCodeBlock: true,
        shortcuts: [shortcut("KeyZ")]
    },
    {
        id: "redo",
        type: "command",
        command: "redo",
        allowInCodeBlock: true,
        shortcuts: [shortcut("KeyY"), shortcut("KeyZ", { shift: true })]
    },
    {
        id: "bold",
        type: "command",
        command: "bold",
        shortcuts: [shortcut("KeyB")]
    },
    {
        id: "italic",
        type: "command",
        command: "italic",
        shortcuts: [shortcut("KeyI")]
    },
    {
        id: "underline",
        type: "command",
        command: "underline",
        shortcuts: [shortcut("KeyU")]
    },
    {
        id: "code",
        type: "control",
        controlId: "code",
        shortcuts: [shortcut("KeyK", { alt: true })]
    },
    {
        id: "color",
        type: "control",
        controlId: "color",
        shortcuts: [shortcut("KeyC", { alt: true })]
    },
    {
        id: "link",
        type: "control",
        controlId: "link",
        shortcuts: [shortcut("KeyK")]
    },
    {
        id: "fontSize",
        type: "control",
        controlId: "heading",
        shortcuts: [shortcut("KeyH", { alt: true })]
    },
    {
        id: "alignLeft",
        type: "command",
        command: "justifyLeft",
        shortcuts: [shortcut("KeyL", { shift: true })]
    },
    {
        id: "alignCenter",
        type: "command",
        command: "justifyCenter",
        shortcuts: [shortcut("KeyE", { shift: true })]
    },
    {
        id: "alignRight",
        type: "command",
        command: "justifyRight",
        shortcuts: [shortcut("KeyR", { shift: true })]
    },
    {
        id: "unorderedList",
        type: "command",
        command: "insertUnorderedList",
        shortcuts: [shortcut("Digit8", { shift: true })]
    },
    {
        id: "orderedList",
        type: "command",
        command: "insertOrderedList",
        shortcuts: [shortcut("Digit7", { shift: true })]
    },
    {
        id: "table",
        type: "control",
        controlId: "table",
        shortcuts: [shortcut("KeyT", { alt: true })]
    },
    {
        id: "resetStyles",
        type: "command",
        command: "removeFormat",
        shortcuts: [shortcut("Backslash")]
    },
    {
        id: "shortcutsHelp",
        type: "control",
        controlId: "shortcutsHelp",
        shortcuts: [shortcut("Slash", { alt: true })]
    }
];

function toKeyLabel(code) {
    if (code.startsWith("Key")) return code.slice(3);
    if (code.startsWith("Digit")) return code.slice(5);
    if (code === "Backslash") return "\\";
    if (code === "Slash") return "/";
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
