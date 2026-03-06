# Quick Start: запуск проекта за 10-15 минут

## 1) Что нужно заранее

1. `Node.js` 18+
2. `npm` 9+

Проверка:

```bash
node -v
npm -v
```

## 2) Установка зависимостей

```bash
npm install
```

## 3) Основные команды

1. Сборка:

```bash
npm run build
```

2. Режим разработки:

```bash
npm run start
```

3. Тесты:

```bash
npm test
```

## 4) Что должно получиться после сборки

1. появится `dist/webhacker-editor.bundle.js`;
2. можно подключать бандл на страницу;
3. редактор создается через `new window.WebHackerEditor.default(...)`.

## 5) Минимальный локальный smoke-check

1. Открой `index.html`.
2. Проверь, что toolbar виден.
3. Проверь `Bold`.
4. Проверь `Inline code`.
5. Проверь `Code block`.
6. Проверь вставку текста через paste.
7. Проверь таблицу.
8. Убедись, что `onChange` возвращает HTML.

## 6) Пример инициализации с начальными данными

```js
const editor = new window.WebHackerEditor.default("#editor", {
  language: "ru",
  placeholderText: "Напиши что-нибудь",
  onChange: (safeHtml) => {
    console.log("changed", safeHtml);
  }
});

editor.setHTML("<p>Привет, команда</p>");
```

## 7) Пример view-страницы

```html
<article id="content" class="webhacker-view-content"></article>
<script src="/dist/webhacker-editor.bundle.js"></script>
<script>
  const rawHtml = "<pre><code class='language-javascript'>const x = 1;</code></pre>";
  const safeHtml = window.WebHackerEditor.sanitizeHtmlStringToSafeHtml(rawHtml);
  const content = document.getElementById("content");
  content.innerHTML = safeHtml;
  window.WebHackerEditor.highlightCodeBlocksInElement(content);
</script>
```

## 8) Если возникли проблемы

1. Проверь версии Node и npm.
2. Проверь, что используешь актуальный `dist/webhacker-editor.bundle.js`.
3. Очисти кэш браузера.
4. Прогони `npm test`.

## 9) Что читать дальше

1. [02-architecture.md](./02-architecture.md)
2. [03-toolbar.md](./03-toolbar.md)
3. [04-security.md](./04-security.md)
