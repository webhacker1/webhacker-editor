import { describe, it, expect } from "vitest";
import { sanitizeHtmlStringToSafeHtml } from "../sanitize/sanitize.js";

function toElement(html) {
    const templateElement = document.createElement("template");
    templateElement.innerHTML = html;
    return templateElement.content;
}

describe("sanitizeHtmlStringToSafeHtml", () => {
    it("sanitizes dangerous anchor attributes", () => {
        const sanitized = sanitizeHtmlStringToSafeHtml(
            '<a href="javascript:alert(1)" onclick="alert(2)" style="color: red">Click</a>'
        );
        const anchorElement = toElement(sanitized).querySelector("a");

        expect(anchorElement).not.toBeNull();
        expect(anchorElement.getAttribute("href")).toBe("about:blank");
        expect(anchorElement.getAttribute("target")).toBe("_blank");
        expect(anchorElement.getAttribute("rel")).toBe("noopener noreferrer nofollow ugc");
        expect(anchorElement.getAttribute("onclick")).toBeNull();
    });

    it("removes invalid images", () => {
        const sanitized = sanitizeHtmlStringToSafeHtml(
            '<p>before<img src="javascript:alert(1)" alt="x">after</p>'
        );
        const root = toElement(sanitized);

        expect(root.querySelector("img")).toBeNull();
        expect(root.textContent).toContain("before");
        expect(root.textContent).toContain("after");
    });

    it("preserves harmless SQL text as plain content", () => {
        const payload = "SELECT * FROM users; DROP TABLE users;";
        const sanitized = sanitizeHtmlStringToSafeHtml(`<p>${payload}</p>`);
        const paragraphElement = toElement(sanitized).querySelector("p");

        expect(paragraphElement).not.toBeNull();
        expect(paragraphElement.textContent).toBe(payload);
    });

    it("strips unsupported tags and event handlers", () => {
        const sanitized = sanitizeHtmlStringToSafeHtml(
            '<script>alert(1)</script><p onclick="hack()">ok</p>'
        );
        const root = toElement(sanitized);

        expect(root.querySelector("script")).toBeNull();
        expect(root.querySelector("p").getAttribute("onclick")).toBeNull();
        expect(root.textContent).toContain("alert(1)");
    });

    it("keeps only allowed code classes", () => {
        const sanitized = sanitizeHtmlStringToSafeHtml(
            '<code class="language-javascript hljs evil" onclick="x()">const a = 1;</code>'
        );
        const codeElement = toElement(sanitized).querySelector("code");

        expect(codeElement).not.toBeNull();
        expect(codeElement.getAttribute("class")).toBe("language-javascript hljs");
        expect(codeElement.getAttribute("onclick")).toBeNull();
    });
});

