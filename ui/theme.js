export function applyThemeVariables(editorRootElement, themeOptions) {
    if (!themeOptions) return;

    const inlineBackground =
        themeOptions.codeInlineBackground ||
        themeOptions.codeBlockBackground ||
        themeOptions.backgroundColor;
    const inlineBorder =
        themeOptions.codeInlineBorder || themeOptions.codeBlockBorder || themeOptions.backgroundColor;
    const inlineText =
        themeOptions.codeInlineText || themeOptions.codeBlockText || themeOptions.textColor;

    if (themeOptions.backgroundColor)
        editorRootElement.style.setProperty("--background-color", themeOptions.backgroundColor);
    if (themeOptions.textColor)
        editorRootElement.style.setProperty("--text-color", themeOptions.textColor);
    if (inlineBackground) editorRootElement.style.setProperty("--code-inline-bg", inlineBackground);
    if (inlineBorder) editorRootElement.style.setProperty("--code-inline-border", inlineBorder);
    if (inlineText) editorRootElement.style.setProperty("--code-inline-text", inlineText);
    if (themeOptions.codeBlockBackground)
        editorRootElement.style.setProperty("--code-block-bg", themeOptions.codeBlockBackground);
    if (themeOptions.codeBlockBorder)
        editorRootElement.style.setProperty("--code-block-border", themeOptions.codeBlockBorder);
    if (themeOptions.codeBlockText)
        editorRootElement.style.setProperty("--code-block-text", themeOptions.codeBlockText);
    if (themeOptions.codeTokenKeyword)
        editorRootElement.style.setProperty("--code-token-keyword", themeOptions.codeTokenKeyword);
    if (themeOptions.codeTokenString)
        editorRootElement.style.setProperty("--code-token-string", themeOptions.codeTokenString);
    if (themeOptions.codeTokenNumber)
        editorRootElement.style.setProperty("--code-token-number", themeOptions.codeTokenNumber);
    if (themeOptions.codeTokenTitle)
        editorRootElement.style.setProperty("--code-token-title", themeOptions.codeTokenTitle);
    if (themeOptions.codeTokenComment)
        editorRootElement.style.setProperty("--code-token-comment", themeOptions.codeTokenComment);
    if (themeOptions.codeTokenAttribute)
        editorRootElement.style.setProperty("--code-token-attribute", themeOptions.codeTokenAttribute);
    if (themeOptions.codeTokenLiteral)
        editorRootElement.style.setProperty("--code-token-literal", themeOptions.codeTokenLiteral);
    if (themeOptions.codeBadgeBackground)
        editorRootElement.style.setProperty("--code-badge-bg", themeOptions.codeBadgeBackground);
    if (themeOptions.codeBadgeBorder)
        editorRootElement.style.setProperty("--code-badge-border", themeOptions.codeBadgeBorder);
    if (themeOptions.codeBadgeText)
        editorRootElement.style.setProperty("--code-badge-text", themeOptions.codeBadgeText);
}
