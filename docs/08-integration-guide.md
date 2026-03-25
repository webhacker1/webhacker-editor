# Пошаговая интеграция в продукт

Ниже реальный путь: "страница редактирования" + "страница просмотра".

## 1) Шаг 1. Подключи бандл и создай редактор

```html
<div id="editor"></div>
<script src="/dist/webhacker-editor.bundle.js"></script>
<script>
  const editor = new window.WebHackerEditor.default("#editor", {
    language: "ru",
    onChange: (safeHtml) => {
      console.log("safe html", safeHtml);
    }
  });
</script>
```

## 2) Шаг 2. Подключи сохранение

Простой пример через транспортный слой:

```js
function createEditorTransport(apiClient) {
  return {
    async saveContent({ html }) {
      await apiClient.post("/content/update", { content: html });
    }
  };
}

function wireSaveButton(editor, saveButton, transport) {
  saveButton.addEventListener("click", async () => {
    const htmlToSave = editor.getHTML();
    await transport.saveContent({ html: htmlToSave });
  });
}
```

Почему так:
1. редактор не знает про твой API;
2. интеграционный код остается переносимым.

## 3) Шаг 3. Подгрузи начальный контент

```js
const initialHtml = serverData?.content || "<p></p>";
editor.setHTML(initialHtml);
```

## 4) Шаг 4. Настрой тему

### Вариант A: через CSS variables хоста

```css
:root {
  --background-color: #ffffff;
  --text-color: #1f2937;
  --secondary-color: #f3f4f6;
  --border-color2: #d1d5db;
}
```

### Вариант B: через JS

```js
editor.setTheme({
  backgroundColor: "#0f172a",
  textColor: "#e2e8f0",
  secondaryColor: "#1e293b",
  borderColor: "#334155",
  mutedColor: "#94a3b8",
  accentColor: "#60a5fa",
  codeInlineBackground: "#334155",
  codeInlineBorder: "#475569",
  codeInlineText: "#e2e8f0"
});
```

## 5) Шаг 5. Реализуй view-страницу правильно

```html
<article id="content" class="webhacker-view-content"></article>
<script src="/dist/webhacker-editor.bundle.js"></script>
<script>
  const rawHtml = serverData?.content || "<p>Пусто</p>";
  const safeHtml = window.WebHackerEditor.sanitizeHtmlStringToSafeHtml(rawHtml);
  const content = document.getElementById("content");
  content.innerHTML = safeHtml;
  window.WebHackerEditor.highlightCodeBlocksInElement(content);
</script>
```

## 6) Шаг 6. Реальный lifecycle страницы редактирования

1. backend отдает текущее содержимое;
2. `editor.setHTML(initialHtml)`;
3. пользователь редактирует;
4. `onChange` или кнопка Save берет `editor.getHTML()`;
5. backend сохраняет;
6. view-страница показывает через sanitize + highlight.

## 7) Частые интеграционные ошибки

1. сохраняют `innerHTML` напрямую из `contenteditable` вместо `getHTML()`;
2. рендерят в view без sanitize;
3. забывают `highlightCodeBlocksInElement` после рендера;
4. не обновляют бандл после изменений в библиотеке.

## 8) Мини-checklist перед релизом

1. контент корректно сохраняется и загружается;
2. опасные ссылки нейтрализуются;
3. code block подсвечивается в view;
4. тема нормально выглядит в светлой и темной схеме;
5. локально проходят `npm test` и `npm run build`.

## 9) Что читать дальше

1. [07-integration-contract.md](./07-integration-contract.md)
2. [04-security.md](./04-security.md)
