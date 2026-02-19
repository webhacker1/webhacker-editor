import { describe, it, expect } from "vitest";
import { sanitizeHref } from "../sanitize/utils.js";

describe("sanitize URL helpers", () => {
    it("blocks dangerous href schemes", () => {
        expect(sanitizeHref("javascript:alert(1)")).toBe("about:blank");
        expect(sanitizeHref("vbscript:alert(1)")).toBe("about:blank");
    });

    it("blocks obfuscated dangerous href schemes", () => {
        expect(sanitizeHref("java\nscript:alert(1)")).toBe("about:blank");
        expect(sanitizeHref(" java\t script:alert(1) ")).toBe("about:blank");
    });

    it("keeps safe href values", () => {
        expect(sanitizeHref("https://example.com")).toBe("https://example.com");
        expect(sanitizeHref("mailto:mail@example.com")).toBe("mailto:mail@example.com");
        expect(sanitizeHref("tel:+10000000000")).toBe("tel:+10000000000");
        expect(sanitizeHref("//cdn.example.com")).toBe("https://cdn.example.com");
        expect(sanitizeHref("/docs/path")).toBe("/docs/path");
        expect(sanitizeHref("example.com")).toBe("https://example.com");
    });
});
