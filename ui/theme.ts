const THEME_CSS_VARIABLES = {
    backgroundColor: "--background-color",
    textColor: "--text-color",
    secondaryColor: "--secondary-color",
    borderColor: "--border-color",
    mutedColor: "--muted-color",
    accentColor: "--accent-color",
    codeInlineBackground: "--code-inline-bg",
    codeInlineBorder: "--code-inline-border",
    codeInlineText: "--code-inline-text",
    codeBlockBackground: "--code-block-bg",
    codeBlockBorder: "--code-block-border",
    codeBlockText: "--code-block-text",
    codeTokenKeyword: "--code-token-keyword",
    codeTokenString: "--code-token-string",
    codeTokenNumber: "--code-token-number",
    codeTokenTitle: "--code-token-title",
    codeTokenComment: "--code-token-comment",
    codeTokenAttribute: "--code-token-attribute",
    codeTokenLiteral: "--code-token-literal",
    codeBadgeBackground: "--code-badge-bg",
    codeBadgeBorder: "--code-badge-border",
    codeBadgeText: "--code-badge-text"
} as const;

type ThemeOptionKey = keyof typeof THEME_CSS_VARIABLES;
type ThemeOptions = Partial<Record<ThemeOptionKey, string>>;

export function applyThemeVariables(
    editorRootElement: HTMLElement,
    themeOptions: ThemeOptions | null | undefined
): void {
    if (!themeOptions) return;

    (Object.keys(THEME_CSS_VARIABLES) as ThemeOptionKey[]).forEach(themeKey => {
        const themeValue = themeOptions[themeKey];
        if (themeValue === undefined || themeValue === null || themeValue === "") return;
        editorRootElement.style.setProperty(THEME_CSS_VARIABLES[themeKey], themeValue);
    });
}
