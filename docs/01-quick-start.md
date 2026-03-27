# Быстрый старт

1. Установите зависимости.

```bash
npm install
```

2. Соберите бандл.

```bash
npm run build
```

3. Если Node старый, запускайте сборку через Node 20.

```bash
npx -y node@20 node_modules/webpack/bin/webpack.js
```

4. Подключите редактор на странице.

```html
<script src="./dist/webhacker-editor.bundle.js"></script>
<div id="editor"></div>
<script>
  const editor = new window.WebHackerEditor.default("#editor", {
    language: "ru",
    onChange: html => console.log(html)
  });
</script>
```

5. Пример работы с контентом.

```js
editor.setHTML("<p><strong>Привет</strong>, мир</p>");
const safeHtml = editor.getHTML();
console.log(safeHtml);
```
