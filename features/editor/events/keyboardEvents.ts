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
    isCaretAtCodeStart,
    isCaretAtElementStart,
    shouldBlockMathFigureDeletion,
    triggerToolbarControl
} from "@/features/editor/events/utils/indexEventUtils";
import { getSelectionAnchorElement, placeCaretAfterElement, splitBlockAtCaret } from "@/features/editor/selection";
import { SHORTCUT_ACTIONS, matchesShortcutEvent } from "@/features/editor/shortcuts";
import { resolveEditorContext, EDITOR_CONTEXT } from "@/features/editor/events/utils/editorContext";

export function bindKeyboardEvents(editor: EditorEventContext): void {
    editor.contentEditableElement.addEventListener("keydown", event => {
        const hasCommandModifier = event.ctrlKey || event.metaKey;
        const selection = window.getSelection();
        const anchorNode = getSelectionAnchorElement(selection);
        const anchor = anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;
        const ctx = resolveEditorContext(anchor ?? null, editor);

        const emit = () => { editor.emitChange(); editor.syncToggleStates(); };
        const makeP = () => { const p = document.createElement("p"); p.appendChild(document.createElement("br")); return p; };
        const placeCaretAt = (node: Node, offset = 0) => { const r = document.createRange(); r.setStart(node, offset); r.collapse(true); selection?.removeAllRanges(); selection?.addRange(r); };

        if (event.key === KEY_BACKSPACE) {
            const currentBlock = anchor?.closest("p, h1, h2, h3, h4, h5, h6, blockquote");
            const prevSibling = currentBlock?.previousElementSibling;
            const isBlockEmpty = currentBlock?.textContent === "" && !currentBlock?.querySelector("img");

            if (
                selection?.isCollapsed &&
                ctx.type !== EDITOR_CONTEXT.Code && ctx.type !== EDITOR_CONTEXT.List &&
                isBlockEmpty &&
                prevSibling?.tagName === "FIGURE" &&
                isCaretAtElementStart(currentBlock as HTMLElement, selection)
            ) {
                event.preventDefault();
                currentBlock.remove();
                placeCaretAfterElement(prevSibling);
                emit();
                return;
            }

            if (shouldBlockMathFigureDeletion(editor, selection, -1)) {
                event.preventDefault();
                return;
            }

            if (ctx.type === EDITOR_CONTEXT.Code) {
                if (!(ctx.element instanceof HTMLElement)) { event.preventDefault(); return; }
                if (selection?.isCollapsed && isCaretAtCodeStart(ctx.element, selection)) {
                    event.preventDefault();
                    return;
                }
            }

            if (ctx.type === EDITOR_CONTEXT.List && selection?.isCollapsed && isCaretAtElementStart(ctx.element, selection)) {
                event.preventDefault();
                const handled = executeRichCommand("backspaceListItem", null, editor);
                if (handled) emit();
                return;
            }
        }

        if (event.key === KEY_DELETE) {
            if (shouldBlockMathFigureDeletion(editor, selection, 1)) {
                event.preventDefault();
                return;
            }

            if (ctx.type === EDITOR_CONTEXT.Code && !(ctx.element instanceof HTMLElement)) {
                event.preventDefault();
                return;
            }
        }

        if (event.key === KEY_TAB) {
            if (ctx.type === EDITOR_CONTEXT.Code) {
                event.preventDefault();
                executeRichCommand("insertText", "    ", editor);
                requestAnimationFrame(() => editor.highlightCodeAtCaret());
                editor.emitChange();
                return;
            }

            if (ctx.type === EDITOR_CONTEXT.Table) {
                event.preventDefault();
                const direction = event.shiftKey ? -1 : 1;
                const next = getAdjacentTableCell(ctx.element, direction);
                if (next) {
                    editor.ensureCaretAnchorInTableCell(next, true);
                    editor.syncToggleStates();
                } else if (!event.shiftKey) {
                    editor.exitTableToNextLine(ctx.element);
                }
                return;
            }

            if (ctx.type === EDITOR_CONTEXT.List) {
                event.preventDefault();
                const handled = executeRichCommand(event.shiftKey ? "outdent" : "sinkListItem", null, editor);
                if (handled) emit();
                return;
            }
        }

        if (event.key === KEY_ENTER) {
            if (ctx.type === EDITOR_CONTEXT.Code && hasCommandModifier && !event.shiftKey) {
                event.preventDefault();
                editor.exitCodeBlockToNextLine(ctx.element);
                return;
            }

            if (ctx.type === EDITOR_CONTEXT.InlineCode) {
                event.preventDefault();
                placeCaretAfterElement(ctx.element);
                executeRichCommand("insertParagraph", null, editor);
                emit();
                return;
            }

            if (!event.shiftKey && ctx.type !== EDITOR_CONTEXT.Code) {
                event.preventDefault();
                Array.from(editor.contentEditableElement.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim() !== "") {
                        const p = document.createElement("p");
                        node.replaceWith(p);
                        p.appendChild(node);
                    }
                });

                if (ctx.type === EDITOR_CONTEXT.List) {
                    const handled = executeRichCommand("splitListItem", null, editor);
                    if (handled) { event.preventDefault(); emit(); }
                    return;
                }

                if (ctx.type === EDITOR_CONTEXT.Table) return;

                if (ctx.type === EDITOR_CONTEXT.Heading) {
                    const isEmpty = ctx.element.textContent === "" && !ctx.element.querySelector("img");
                    if (isEmpty || isCaretAtElementStart(ctx.element, selection)) {
                        const p = makeP();
                        if (isEmpty) {
                            ctx.element.after(p);
                            placeCaretAt(p, 0);
                        } else {
                            ctx.element.before(p);
                            placeCaretAt(ctx.element, 0);
                        }
                        emit();
                        return;
                    }
                }

                if (editor.contentEditableElement.children.length === 0) {
                    const first = makeP();
                    const second = makeP();
                    editor.contentEditableElement.append(first, second);
                    placeCaretAt(second, 0);
                    emit();
                    return;
                }

                const newParagraph = document.createElement("p");
                splitBlockAtCaret(editor, newParagraph);
                placeCaretAt(newParagraph, 0);
                emit();
            }
        }

        if (hasCommandModifier && event.code === CODE_KEY_A && !event.shiftKey && !event.altKey && ctx.type === EDITOR_CONTEXT.Code) {
            event.preventDefault();
            return;
        }

        const matchingShortcutAction = SHORTCUT_ACTIONS.find(shortcutAction =>
            shortcutAction.shortcuts.some(shortcutDef => matchesShortcutEvent(event, shortcutDef)),
        );
        if (matchingShortcutAction) {
            if (ctx.type === EDITOR_CONTEXT.Code && !matchingShortcutAction.allowInCodeBlock) return;
            if (matchingShortcutAction.type === "control") {
                if (triggerToolbarControl(editor, matchingShortcutAction.controlId)) {
                    event.preventDefault();
                    return;
                }
            } else if (matchingShortcutAction.type === "command") {
                event.preventDefault();
                const handled = executeRichCommand(matchingShortcutAction.command, null, editor);
                if (handled) emit();
                return;
            }
        }
    });
}
