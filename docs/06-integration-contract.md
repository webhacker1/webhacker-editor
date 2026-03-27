# Контракт интеграции

`new WebHackerEditor(rootSelectorOrElement, options)`

`options`:

1. `language`: `"ru" | "en"`.
2. `placeholderText`: строка.
3. `onChange(safeHtml)`: callback.
4. `theme`: объект CSS-переменных темы.

Методы:

1. `getHTML(): string` — безопасный HTML.
2. `setHTML(html: string): void` — вставка HTML через sanitize.
3. `setTheme(theme): void` — переопределение theme vars.

Пример:

```js
const editor = new window.WebHackerEditor.default("#editor", {
  language: "ru",
  placeholderText: "Введите текст...",
  onChange: safeHtml => {
    console.log("safe:", safeHtml);
  }
});

editor.setHTML("<p>Тест</p>");
console.log(editor.getHTML());
editor.setTheme({ accentColor: "#1d4ed8" });
```
