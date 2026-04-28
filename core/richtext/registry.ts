let activeEditorInstance = null;

export function setActiveEditor(editor) {
    activeEditorInstance = editor || null;
}

export function getActiveEditor() {
    return activeEditorInstance;
}
