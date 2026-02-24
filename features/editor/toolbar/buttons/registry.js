import { createUndoButton } from "./undoButton.js";
import { createRedoButton } from "./redoButton.js";
import { createBoldButton } from "./boldButton.js";
import { createItalicButton } from "./italicButton.js";
import { createUnderlineButton } from "./underlineButton.js";
import { createCodeDropdown } from "./codeDropdown.js";
import { createColorDropdown } from "./colorDropdown.js";
import { createLinkDropdown } from "./linkDropdown.js";
import { createImageDisabledButton } from "./imageDisabledButton.js";
import { createHeadingDropdown } from "./headingDropdown.js";
import { createAlignLeftButton } from "./alignLeftButton.js";
import { createAlignCenterButton } from "./alignCenterButton.js";
import { createAlignRightButton } from "./alignRightButton.js";
import { createUnorderedListButton } from "./unorderedListButton.js";
import { createOrderedListButton } from "./orderedListButton.js";
import { createTableDropdown } from "./tableDropdown.js";
import { createResetStylesButton } from "./resetStylesButton.js";
import { createShortcutsHelpDropdown } from "./shortcutsHelpDropdown.js";

const TOOLBAR_BUTTON_REGISTRY = {
    undo: createUndoButton,
    redo: createRedoButton,
    bold: createBoldButton,
    italic: createItalicButton,
    underline: createUnderlineButton,
    code: createCodeDropdown,
    color: createColorDropdown,
    link: createLinkDropdown,
    imageDisabled: createImageDisabledButton,
    heading: createHeadingDropdown,
    alignLeft: createAlignLeftButton,
    alignCenter: createAlignCenterButton,
    alignRight: createAlignRightButton,
    unorderedList: createUnorderedListButton,
    orderedList: createOrderedListButton,
    table: createTableDropdown,
    resetStyles: createResetStylesButton,
    shortcutsHelp: createShortcutsHelpDropdown
};

export function createToolbarControl(controlId, editor, t) {
    const controlFactory = TOOLBAR_BUTTON_REGISTRY[controlId];
    if (!controlFactory) throw new Error(`Unknown toolbar control: ${controlId}`);
    return controlFactory(editor, t);
}
