import {
    CODE_KEY_A,
    KEY_BACKSPACE,
    KEY_DELETE,
    KEY_ENTER,
    KEY_TAB,
} from "@/constants/indexConstants";
import { executeRichCommand } from "@/core/indexCore";
import type { EditorEventContext } from "@/features/editor/events/eventTypes";
import {
    getAdjacentTableCell,
    getSelectionListItem,
    isCaretAtCodeStart,
    isCaretAtElementStart,
    shouldBlockMathFigureDeletion,
    triggerToolbarControl
} from "@/features/editor/events/utils/indexEventUtils";
import { getSelectionAnchorElement, placeCaretAfterElement } from "@/features/editor/selection";
import { SHORTCUT_ACTIONS, matchesShortcutEvent } from "@/features/editor/shortcuts";

export function bindKeyboardEvents(editor: EditorEventContext): void {
    editor.contentEditableElement.addEventListener("keydown", event => {
        const hasCommandModifier = event.ctrlKey || event.metaKey;
        const selection = window.getSelection();
        const anchorNode = getSelectionAnchorElement(selection);
        const activePreElement = anchorNode && anchorNode.closest ? anchorNode.closest("pre") : null;
        const activeCodeElement = activePreElement
            ? activePreElement.querySelector("code")
            : anchorNode && anchorNode.closest
              ? anchorNode.closest("pre code")
              : null;
        const nearestCodeElement = anchorNode && anchorNode.closest ? anchorNode.closest("code") : null;
        const activeTableCellElement = anchorNode && anchorNode.closest ? anchorNode.closest("td,th") : null;
        const inlineCodeElement =
            nearestCodeElement && nearestCodeElement.closest && !nearestCodeElement.closest("pre")
                ? nearestCodeElement
                : null;
        const activeListItemElement = getSelectionListItem(selection);

        if (event.key === KEY_BACKSPACE || event.key === KEY_DELETE) {
            const direction = event.key === KEY_BACKSPACE ? -1 : 1;
            if (shouldBlockMathFigureDeletion(editor, selection, direction)) {
                event.preventDefault();
                return;
            }
        }

        if ((event.key === KEY_BACKSPACE || event.key === KEY_DELETE) && activePreElement) {
            const codeElement = activePreElement.querySelector("code");
            if (!(codeElement instanceof HTMLElement) || !(activeCodeElement instanceof HTMLElement)) {
                event.preventDefault();
                return;
            }
            if (
                event.key === KEY_BACKSPACE &&
                selection &&
                selection.isCollapsed &&
                isCaretAtCodeStart(activeCodeElement, selection)
            ) {
                event.preventDefault();
                return;
            }
        }

        if (
            event.key === KEY_BACKSPACE &&
            activeListItemElement &&
            !activeCodeElement &&
            selection &&
            selection.isCollapsed &&
            isCaretAtElementStart(activeListItemElement, selection)
        ) {
            event.preventDefault();
            const handled = executeRichCommand("backspaceListItem", null, editor);
            if (handled) {
                editor.emitChange();
                editor.syncToggleStates();
            }
            return;
        }

        if (hasCommandModifier && event.code === CODE_KEY_A && !event.shiftKey && !event.altKey && activeCodeElement) {
            event.preventDefault();
            return;
        }

        const matchingShortcutAction = SHORTCUT_ACTIONS.find(shortcutAction =>
            shortcutAction.shortcuts.some(shortcutDef => matchesShortcutEvent(event, shortcutDef)),
        );
        if (matchingShortcutAction) {
            if (activeCodeElement && !matchingShortcutAction.allowInCodeBlock) return;

            if (matchingShortcutAction.type === "control") {
                if (triggerToolbarControl(editor, matchingShortcutAction.controlId)) {
                    event.preventDefault();
                    return;
                }
            } else if (matchingShortcutAction.type === "command") {
                event.preventDefault();
                const handled = executeRichCommand(matchingShortcutAction.command, null, editor);
                if (handled) {
                    editor.emitChange();
                    editor.syncToggleStates();
                }
                return;
            }
        }

        if (event.key === KEY_TAB && activeCodeElement) {
            event.preventDefault();
            executeRichCommand("insertText", "    ", editor);
            requestAnimationFrame(() => editor.highlightCodeAtCaret());
            editor.emitChange();
            return;
        }

        if (event.key === KEY_TAB && activeTableCellElement && !activeCodeElement) {
            event.preventDefault();
            if (!(activeTableCellElement instanceof HTMLElement)) return;
            const direction = event.shiftKey ? -1 : 1;
            const nextTableCellElement = getAdjacentTableCell(activeTableCellElement, direction);
            if (nextTableCellElement) {
                editor.ensureCaretAnchorInTableCell(nextTableCellElement, true);
                editor.syncToggleStates();
            } else if (!event.shiftKey) {
                editor.exitTableToNextLine(activeTableCellElement);
            }
            return;
        }

        if (event.key === KEY_TAB && activeListItemElement && !activeCodeElement && !activeTableCellElement) {
            event.preventDefault();
            const commandName = event.shiftKey ? "outdent" : "sinkListItem";
            const handled = executeRichCommand(commandName, null, editor);
            if (handled) {
                editor.emitChange();
                editor.syncToggleStates();
            }
            return;
        }

        if (event.key === KEY_ENTER && activeCodeElement && hasCommandModifier && !event.shiftKey) {
            event.preventDefault();
            if (!(activeCodeElement instanceof HTMLElement)) return;
            editor.exitCodeBlockToNextLine(activeCodeElement);
            return;
        }

        if (event.key === KEY_ENTER && inlineCodeElement) {
            event.preventDefault();
            if (!(inlineCodeElement instanceof HTMLElement)) return;
            placeCaretAfterElement(inlineCodeElement);
            executeRichCommand("insertParagraph", null, editor);
            editor.emitChange();
            editor.syncToggleStates();
            return;
        }

        if (event.key === KEY_ENTER && !event.shiftKey && !activeCodeElement) {
            if (activeListItemElement) {
                const handled = executeRichCommand("splitListItem", null, editor);
                if (handled) {
                    event.preventDefault();
                    editor.emitChange();
                    editor.syncToggleStates();
                }
            }
        }
    });
}
