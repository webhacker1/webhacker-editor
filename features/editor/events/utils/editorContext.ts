import type { EditorEventContext } from "@/features/editor/events/eventTypes";

export const EDITOR_CONTEXT = {
    Code: "code",
    InlineCode: "inlineCode",
    Table: "table",
    List: "list",
    Heading: "heading",
    Block: "block",
    Root: "root",
} as const;

export type EditorContextType =
    | { type: typeof EDITOR_CONTEXT.Code; element: HTMLElement; pre: HTMLElement }
    | { type: typeof EDITOR_CONTEXT.InlineCode; element: HTMLElement }
    | { type: typeof EDITOR_CONTEXT.Table; element: HTMLElement }
    | { type: typeof EDITOR_CONTEXT.List; element: HTMLElement }
    | { type: typeof EDITOR_CONTEXT.Heading; element: HTMLElement }
    | { type: typeof EDITOR_CONTEXT.Block; element: HTMLElement }
    | { type: typeof EDITOR_CONTEXT.Root; element: HTMLElement };

export function resolveEditorContext(anchorNode: HTMLElement | null, editor: EditorEventContext): EditorContextType {
    const root = { type: EDITOR_CONTEXT.Root, element: editor.contentEditableElement };
    if (!anchorNode) return root;

    const pre = anchorNode.closest("pre");
    const preCode = pre?.querySelector("code");
    if (pre && preCode instanceof HTMLElement) return { type: EDITOR_CONTEXT.Code, element: preCode, pre: pre as HTMLElement };

    const code = anchorNode.closest("code");
    if (code instanceof HTMLElement && !code.closest("pre")) return { type: EDITOR_CONTEXT.InlineCode, element: code };

    const td = anchorNode.closest("td,th");
    if (td instanceof HTMLElement) return { type: EDITOR_CONTEXT.Table, element: td };

    const li = anchorNode.closest("li");
    if (li instanceof HTMLElement) return { type: EDITOR_CONTEXT.List, element: li };

    const heading = anchorNode.closest("h1,h2,h3,h4,h5,h6");
    if (heading instanceof HTMLElement) return { type: EDITOR_CONTEXT.Heading, element: heading };

    const block = anchorNode.closest("p,blockquote");
    if (block instanceof HTMLElement) return { type: EDITOR_CONTEXT.Block, element: block };

    return root;
}
