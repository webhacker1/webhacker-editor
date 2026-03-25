<p align="center">
  <img src="./docs/assets/logo.png" alt="WEB HACKER EDITOR" width="180">
  <br>
  <h1 align="center">WEB HACKER EDITOR</h1>
</p>

```bash
npm install
npm run build
```

```html
<script src="./dist/webhacker-editor.bundle.js"></script>
<div id="editor"></div>
<script>
  const editor = new window.WebHackerEditor.default("#editor", { language: "ru" });
</script>
```

## API

1. `new WebHackerEditor(root, options)`
2. `getHTML()`
3. `setHTML(html)`
4. `setTheme(theme)`

## Документация

[docs/README.md](./docs/README.md)
