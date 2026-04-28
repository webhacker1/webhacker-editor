export function extractPlainTextFromClipboard(htmlData: string, textData: string): string {
    if (typeof textData === "string" && textData.length) return textData;
    if (!htmlData) return "";
    const templateElement = document.createElement("template");
    templateElement.innerHTML = String(htmlData);
    return templateElement.content.textContent || "";
}
