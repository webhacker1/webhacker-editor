# Контракт интеграции

Этот файл фиксирует договоренности между библиотекой и хост-приложением.

## 1) Ответственности сторон

### Библиотека отвечает за

1. UI редактора;
2. API `getHTML`, `setHTML`, `setTheme`;
3. sanitize на уровне редактора;
4. утилиту подсветки для view.

### Хост-приложение отвечает за

1. инициализацию редактора;
2. сохранение и загрузку контента;
3. серверную безопасность;
4. повторный sanitize перед финальным рендером view.

## 2) Публичный API, на который можно опираться

Экспорт из `index.js`:
1. `default` - класс `WebHackerEditor`;
2. `sanitizeHtmlStringToSafeHtml`;
3. `highlightCodeBlocksInElement`.

Пример:

```js
const editor = new window.WebHackerEditor.default("#editor", {
  language: "ru",
  onChange: (safeHtml) => save(safeHtml)
});
```

## 3) Контракт данных

1. `onChange` получает уже очищенный HTML;
2. `getHTML()` возвращает очищенный HTML;
3. `setHTML(html)` принимает HTML и сам очищает перед вставкой.

Следствие:
1. в интеграции не нужно повторно sanitize перед `editor.setHTML(...)`;
2. но нужно sanitize перед `innerHTML` в view-странице.

## 4) Контракт темы

Есть 2 варианта:
1. использовать CSS variables хоста;
2. использовать `editor.setTheme(...)` для локального override.

Минимальные переменные, которые обычно нужны:
1. `--background-color`
2. `--text-color`
3. `--secondary-color`
4. `--border-color`
5. `--border-color2`
6. `--accent-color`
7. `--muted-color`

## 5) Контракт view-режима

Обязательные шаги:
1. получить HTML из источника;
2. сделать sanitize;
3. вставить в `innerHTML`;
4. вызвать `highlightCodeBlocksInElement(container)`.

## 6) Контракт безопасности

Минимум для production:
1. фронт: `editor.getHTML()` и sanitize в view;
2. бэк: валидация + параметризованные SQL-запросы;
3. хранение: ограничение размера и формата контента.

## 7) Известные ограничения

1. форматирование основано на `document.execCommand`;
2. поведение toolbar зависит от текущего selection;
3. служебный UI code block удаляется перед сериализацией.

## 8) Что читать дальше

1. [08-integration-guide.md](./08-integration-guide.md)
2. [04-security.md](./04-security.md)
