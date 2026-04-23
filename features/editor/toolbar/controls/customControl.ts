import {
    createCodeDropdown,
    createColorDropdown,
    createHeadingDropdown,
    createImageDisabledButton,
    createLinkDropdown,
    createMathDropdown,
    createMermaidDropdown,
    createShortcutsHelpDropdown,
    createTableDropdown,
    createVoiceControl
} from "@/features/editor/toolbar/controls/indexToolbarControls";

const CUSTOM_CONTROLS = {
    code: createCodeDropdown,
    math: createMathDropdown,
    mermaid: createMermaidDropdown,
    voice: createVoiceControl,
    color: createColorDropdown,
    link: createLinkDropdown,
    imageDisabled: createImageDisabledButton,
    heading: createHeadingDropdown,
    table: createTableDropdown,
    shortcutsHelp: createShortcutsHelpDropdown
};

export function createCustomControl(controlId, editor, t) {
    const controlFactory = CUSTOM_CONTROLS[controlId];
    return controlFactory ? controlFactory(editor, t) : null;
}
