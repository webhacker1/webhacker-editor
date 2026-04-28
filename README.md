<p align="center">
  <img src="./docs/assets/logo.png" alt="WEB HACKER EDITOR" width="180">
</p>

<h1 align="center">WEB HACKER EDITOR</h1>

Легковесный WYSIWYG-редактор с поддержкой code, math и mermaid, построенный на TypeScript + LESS.

## Быстрый запуск

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Подключение

```html
<script src="./dist/webhacker-editor.bundle.js"></script>
<div id="editor"></div>
<script>
  const editor = new window.WebHackerEditor.default("#editor", { language: "ru" });
</script>
```

## Публичный API

1. `new WebHackerEditor(root, options)`
2. `getHTML()`
3. `setHTML(html)`
4. `setTheme(theme)`

## Документация

Вся документация для разработчиков: [docs/README.md](./docs/README.md)

## Структура проекта

1. Внутри каждого модуля есть свой входной файл `indexName.ts`.
2. В каждой основной папке есть `README.md` с коротким описанием и примерами.
3. Подробная карта слоев: [docs/02-architecture.md](./docs/02-architecture.md)
