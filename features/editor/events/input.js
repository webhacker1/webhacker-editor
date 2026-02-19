export function bindInputEvents(editor) {
    editor.contentEditableElement.addEventListener("input", () => {
        requestAnimationFrame(() => editor.highlightCodeAtCaret());
        editor.emitChange();
        editor.syncToggleStates();
    });
}

