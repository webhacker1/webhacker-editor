export function escapeHtml(stringValue) {
    return String(stringValue).replace(
        /[&<>"']/g,
        match =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[match]
    );
}

function normalizeRawUrl(rawUrl) {
    return String(rawUrl ?? "")
        .trim()
        .replace(/[\u0000-\u001F\u007F\s]+/g, "");
}

export function sanitizeHref(rawUrl) {
    const value = normalizeRawUrl(rawUrl);
    if (!value) return "about:blank";

    if (/^https?:\/\//i.test(value) || /^mailto:/i.test(value) || /^tel:/i.test(value)) {
        return value;
    }

    if (/^\/\//.test(value)) return `https:${value}`;
    if (/^\//.test(value)) return value;
    if (/^[a-z][\w+.-]*:/i.test(value)) return "about:blank";
    return `https://${value}`;
}

export function ensureSafeUrl(rawUrl) {
    return sanitizeHref(rawUrl);
}

export function normalizeCssColorToHex(inputValue) {
    const value = String(inputValue || "").trim();
    if (/^#([0-9a-fA-F]{3}){1,2}$/.test(value)) {
        if (value.length === 4)
            return (
                "#" +
                value[1] +
                value[1] +
                value[2] +
                value[2] +
                value[3] +
                value[3]
            ).toUpperCase();
        return value.toUpperCase();
    }
    const rgbMatch = value.match(
        /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)$/
    );
    if (rgbMatch) {
        const clamp = n => Math.max(0, Math.min(255, parseInt(n, 10)));
        const toHex = n => clamp(n).toString(16).padStart(2, "0");
        return ("#" + toHex(rgbMatch[1]) + toHex(rgbMatch[2]) + toHex(rgbMatch[3])).toUpperCase();
    }
    return null;
}
