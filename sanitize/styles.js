import { normalizeCssColorToHex } from "./utils.js";

export function sanitizeStyleAttributeForElement(element, options = {}) {
    if (!element.hasAttribute("style")) return;
    const stripColors = !!options.stripColors;

    const tagName = element.tagName.toLowerCase();
    const rules = (element.getAttribute("style") || "")
        .split(";")
        .map(s => s.trim())
        .filter(Boolean);

    const blockAlignTags = new Set([
        "p",
        "div",
        "blockquote",
        "li",
        "td",
        "th",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6"
    ]);

    let colorHex = null;
    let textAlign = null;

    for (const rule of rules) {
        const parts = rule.split(":");
        const propertyName = parts[0] ? parts[0].trim().toLowerCase() : "";
        const propertyValue = parts[1] ? parts[1].trim() : "";

        if (!stripColors && propertyName === "color" && tagName === "span") {
            const hex = normalizeCssColorToHex(propertyValue);
            if (hex) colorHex = hex;
        }

        if (/^background(-color)?$/.test(propertyName)) {
            continue;
        }

        if (propertyName === "text-align" && blockAlignTags.has(tagName)) {
            const val = propertyValue.toLowerCase();
            if (val === "left" || val === "right" || val === "center" || val === "justify")
                textAlign = val;
        }

        if (propertyName === "text-decoration") {
            continue;
        }
    }

    const parts = [];
    if (colorHex) parts.push(`color: ${colorHex}`);
    if (textAlign) parts.push(`text-align: ${textAlign}`);

    if (parts.length) element.setAttribute("style", parts.join("; "));
    else element.removeAttribute("style");
}
