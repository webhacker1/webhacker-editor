# Быстрый старт

## Требования

1. `Node.js >= 20`
2. `npm >= 10`

Проверка:

```bash
node -v
npm -v
```

## Установка и запуск

```bash
npm install
npm run typecheck
npm test
npm run build
```

Локальная разработка (watch):

```bash
npm run start
```

## Минимальная интеграция в страницу

```html
<script src="./dist/webhacker-editor.bundle.js"></script>
<div id="editor"></div>
<script>
  const editor = new window.WebHackerEditor.default("#editor", {
    language: "ru",
    placeholderText: "Введите текст...",
    onChange: safeHtml => console.log(safeHtml)
  });
</script>
```

## Частые проблемы

1. Ошибка синтаксиса в `node_modules` с `??` или `?.` — у вас слишком старый Node.
2. Не применяются стили — убедитесь, что собирается `index.ts` (он импортирует `styles/less/index.less`).
3. Нет новых кнопок в toolbar — проверьте, что фича подключена в `features/editor/setup.ts`.
