const MAX_HISTORY_ITEMS = 200;
const INPUT_COALESCE_WINDOW_MS = 1200;

export class RichTextHistory {
    entries: string[];
    cursor: number;
    lastKind: string | null;
    lastUpdatedAt: number;

    constructor(initialHtml = "") {
        const normalizedInitialHtml = String(initialHtml || "");
        this.entries = [normalizedInitialHtml];
        this.cursor = 0;
        this.lastKind = null;
        this.lastUpdatedAt = 0;
    }

    current() {
        return this.entries[this.cursor] || "";
    }

    reset(html = "") {
        const normalizedHtml = String(html || "");
        this.entries = [normalizedHtml];
        this.cursor = 0;
        this.lastKind = null;
        this.lastUpdatedAt = 0;
    }

    record(html, kind = "command") {
        const normalizedHtml = String(html || "");
        if (normalizedHtml === this.current()) return false;

        const now = Date.now();
        const shouldCoalesceInput =
            kind === "input" &&
            this.lastKind === "input" &&
            now - this.lastUpdatedAt < INPUT_COALESCE_WINDOW_MS;

        if (shouldCoalesceInput) {
            this.entries[this.cursor] = normalizedHtml;
        } else {
            this.entries = this.entries.slice(0, this.cursor + 1);
            this.entries.push(normalizedHtml);
            if (this.entries.length > MAX_HISTORY_ITEMS) {
                this.entries.shift();
            } else {
                this.cursor += 1;
            }
            this.cursor = this.entries.length - 1;
        }

        this.lastKind = kind;
        this.lastUpdatedAt = now;
        return true;
    }

    undo() {
        if (this.cursor <= 0) return null;
        this.cursor -= 1;
        this.lastKind = "undo";
        this.lastUpdatedAt = Date.now();
        return this.current();
    }

    redo() {
        if (this.cursor >= this.entries.length - 1) return null;
        this.cursor += 1;
        this.lastKind = "redo";
        this.lastUpdatedAt = Date.now();
        return this.current();
    }
}
