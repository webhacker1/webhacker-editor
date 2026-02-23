# Контракт интеграции (простая версия)

Правила интеграции между библиотекой редактора и проектом-хостом.

Если нужен подробный путь "с нуля", сначала прочитай `docs/08-integration-guide.md`.

## 1) Кто за что отвечает

### Библиотека редактора отвечает за

1. UI редактора (toolbar, contenteditable, code block).
2. Получение безопасного HTML через `editor.getHTML()`.
3. Установку HTML через `editor.setHTML(...)`.
4. Утилиты для режима просмотра:
   - `sanitizeHtmlStringToSafeHtml(...)`
   - `highlightCodeBlocksInElement(...)`

### Проект-хост отвечает за

1. Подключение бандла и инициализацию редактора.
2. Хранение контента (API/БД).
3. Тему проекта (светлая/темная).
4. Безопасный рендер в view-режиме.

## 2) Публичный API (на него можно опираться)

Экспорт из `index.js`:

1. `default` -> класс `WebHackerEditor`
2. `sanitizeHtmlStringToSafeHtml`
3. `highlightCodeBlocksInElement`

Пример:

```js
const editor = new window.WebHackerEditor.default("#editor", {
  language: "ru",
  onChange: (safeHtml) => saveToApi(safeHtml)
});
```

## 3) Язык интерфейса

Поддержка:

1. `ru`
2. `en`

Правила:

1. Если `language` не передан, используется `ru`.
2. Если передан `language: "en"`, toolbar и меню будут на английском.

## 4) Тема и цвета

Есть два способа.

### Способ A (рекомендуется): тема задается проектом

Редактор подхватывает CSS variables хоста.

Минимум:

1. `--background-color`
2. `--text-color`
3. `--secondary-color`
4. `--border-color2`

Inline code использует:

1. `--code-inline-bg` <- `--secondary-color`
2. `--code-inline-border` <- `--border-color2`
3. `--code-inline-text` <- `--text-color`

### Способ B: локальный override редактора

```js
editor.setTheme({
  codeInlineBackground: "#334155",
  codeInlineBorder: "#475569",
  codeInlineText: "#e2e8f0"
});
```

Приоритет:

1. Переданные `theme.codeInline*` важнее.
2. Если их нет, берутся цвета темы сайта.

## 5) Контракт view-режима

Правильный контейнер:

1. `.webhacker-view-content`

Обязательный порядок действий:

1. Получить HTML из источника.
2. Пропустить через `sanitizeHtmlStringToSafeHtml(...)`.
3. Вставить в `innerHTML`.
4. Вызвать `highlightCodeBlocksInElement(container)`.

Пример:

```html
<article id="content" class="webhacker-view-content"></article>
<script src="/dist/webhacker-editor.bundle.js"></script>
<script>
  const raw = window.serverData?.content || "<p>Пусто</p>";
  const safe = window.WebHackerEditor.sanitizeHtmlStringToSafeHtml(raw);
  const el = document.getElementById("content");
  el.innerHTML = safe;
  window.WebHackerEditor.highlightCodeBlocksInElement(el);
</script>
```

## 6) Контракт безопасности

Минимально безопасная схема:

1. На сохранение брать `editor.getHTML()`.
2. Во view снова санитизировать перед `innerHTML`.
3. На backend использовать валидацию и параметризованные SQL-запросы.

Важно:

1. Фронтенд-санитайз полезен, но не заменяет backend-защиту.

## 7) Ограничения, о которых нужно знать

1. Code block считается отдельной сущностью редактора.
2. Подсветка кода зависит от вызова `highlightCodeBlocksInElement(...)` в view.
3. Старые классы view (`.rich-content`, `.wh-content`) не использовать.

## 8) Короткий checklist интеграции

- [ ] Подключен актуальный `dist/webhacker-editor.bundle.js`.
- [ ] Редактор создан через `new WebHackerEditor.default(...)`.
- [ ] Сохранение идет через `onChange` или `editor.getHTML()`.
- [ ] В view используется `.webhacker-view-content`.
- [ ] Перед `innerHTML` делается sanitize.
- [ ] После `innerHTML` вызывается подсветка code block.
