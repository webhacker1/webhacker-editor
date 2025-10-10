export function applyThemeVariables(editorRootElement, themeOptions) {
    if (!themeOptions) return;
    if (themeOptions.backgroundColor)
        editorRootElement.style.setProperty("--editor-background", themeOptions.backgroundColor);
    if (themeOptions.textColor)
        editorRootElement.style.setProperty("--text-color", themeOptions.textColor);
}
