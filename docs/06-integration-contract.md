# Контракт интеграции

## Создание экземпляра
```ts
const editor = new window.WebHackerEditor.default("#editor", {
  language: "ru",
  placeholderText: "Введите текст...",
  onChange: safeHtml => console.log(safeHtml),
  theme: {
    accentColor: "#2563EB"
  }
});
```

## Конструктор
`new WebHackerEditor(rootSelectorOrElement, options)`

`rootSelectorOrElement`:
1. CSS-селектор (например, `"#editor"`).
2. Или `HTMLElement`.

`options`:
1. `language`: `"ru" | "en"` (по умолчанию `"ru"`).
2. `placeholderText`: `string | null`.
3. `onChange`: `(safeHtml: string) => void`.
4. `theme`: объект с CSS-переменными темы.

## Публичные методы
1. `getHTML(): string` — возвращает безопасный HTML.
2. `setHTML(html: string): void` — вставляет HTML через sanitize.
3. `setTheme(theme): void` — обновляет CSS-переменные темы.

## Гарантии
1. Наружу возвращается только санитизированный HTML.
2. Внутренняя структура модулей скрыта за `indexName.ts` входами.
3. Внешняя интеграция не зависит от внутреннего разбиения файлов.
