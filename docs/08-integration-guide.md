# Пошаговая интеграция редактора (для новичков)

Пошаговый сценарий интеграции.

В конце ты получишь рабочую схему:

1. редактор на странице;
2. безопасное сохранение HTML;
3. безопасный показ HTML в режиме просмотра.

Если потом захочешь проверить формальные правила, смотри `docs/07-integration-contract.md`.

## Содержание

1. [Шаг 0. Что ты получишь в итоге](#step-0)
2. [Шаг 1. Подключи бандл и создай редактор](#step-1)
3. [Шаг 2. Подключи сохранение](#step-2)
4. [Шаг 3. Подключи тему проекта](#step-3)
5. [Шаг 4. Сделай страницу просмотра (view)](#step-4)
6. [Шаг 5. Проверь безопасность](#step-5)
7. [Шаг 6. Частые проблемы и проверки](#step-6)
8. [Готовый минимум: editor + view](#step-7)

<a id="step-0"></a>
## Шаг 0. Что ты получишь в итоге

Поток данных будет такой:

1. Пользователь редактирует текст.
2. Редактор отдает безопасный HTML.
3. Приложение сохраняет этот HTML.
4. View-страница берет HTML, снова чистит и показывает.
5. Code block подсвечивается после вставки.

Переходим к установке редактора на страницу.

<a id="step-1"></a>
## Шаг 1. Подключи бандл и создай редактор

### 1.1 Добавь контейнер и скрипт

```html
<div id="editor"></div>
<script src="/dist/webhacker-editor.bundle.js"></script>
```

### 1.2 Создай инстанс

```js
const editor = new window.WebHackerEditor.default("#editor", {
  language: "ru",
  onChange: (safeHtml) => {
    console.log("Текущий HTML:", safeHtml);
  }
});
```

Что важно:

1. `onChange` вызывается при изменении текста.
2. `safeHtml` уже очищен редактором.

Теперь сделаем нормальное сохранение.

<a id="step-2"></a>
## Шаг 2. Подключи сохранение

### 2.1 Почему не хардкодим endpoint в документации редактора

Потому что у каждого проекта свой API.  
Редактор должен быть переиспользуемым.

### 2.2 Шаблон с transport-слоем

```js
function initializeEditor({ container, transport, initialHtml = "", language = "ru" }) {
  const saveButton = container.querySelector("[data-role='save']");
  const textarea = container.querySelector("textarea");
  if (!saveButton || !textarea) return null;

  const mount = document.createElement("div");
  textarea.hidden = true;
  textarea.insertAdjacentElement("afterend", mount);

  let baseline = (initialHtml || textarea.value || "").trim();

  const editor = new window.WebHackerEditor.default(mount, {
    language,
    onChange(safeHtml) {
      textarea.value = safeHtml;
      const dirty = safeHtml !== baseline;
      saveButton.hidden = !dirty;
    }
  });

  if (baseline) editor.setHTML(baseline);

  saveButton.addEventListener("click", async () => {
    const htmlToSave = editor.getHTML();
    await transport.saveContent({ html: htmlToSave });
    baseline = htmlToSave;
    saveButton.hidden = true;
  });

  return editor;
}
```

Пример транспортного адаптера:

```js
function createEditorTransport(apiClient) {
  return {
    async saveContent({ html }) {
      await apiClient.post("/content/update", { content: html });
    }
  };
}
```

Теперь подключим тему.

<a id="step-3"></a>
## Шаг 3. Подключи тему проекта

Есть два варианта.

### Вариант A (лучше): редактор берет цвета сайта

Минимум переменных:

1. `--background-color`
2. `--text-color`
3. `--secondary-color`
4. `--border-color2`

```css
:root {
  --background-color: #ffffff;
  --text-color: #333333;
  --secondary-color: #f3f4f6;
  --border-color2: #d1d5db;
}

body.dark {
  --background-color: #2f3136;
  --text-color: #e5e7eb;
  --secondary-color: #3a3d42;
  --border-color2: #525763;
}
```

### Вариант B: перекрасить только редактор

```js
editor.setTheme({
  backgroundColor: "#0f172a",
  textColor: "#e2e8f0",
  codeInlineBackground: "#334155",
  codeInlineBorder: "#475569",
  codeInlineText: "#e2e8f0"
});
```

После темы делаем view.

<a id="step-4"></a>
## Шаг 4. Сделай страницу просмотра (view)

Порядок всегда один и тот же:

1. Взять HTML.
2. Очистить через sanitize.
3. Вставить в DOM.
4. Запустить подсветку code block.

```html
<article id="content" class="webhacker-view-content"></article>
<script src="/dist/webhacker-editor.bundle.js"></script>
<script>
  const rawHtml = window.serverData?.content || "<p>Пусто</p>";
  const safeHtml = window.WebHackerEditor.sanitizeHtmlStringToSafeHtml(rawHtml);
  const contentElement = document.getElementById("content");
  contentElement.innerHTML = safeHtml;
  window.WebHackerEditor.highlightCodeBlocksInElement(contentElement);
</script>
```

Теперь финально проверим безопасность.

<a id="step-5"></a>
## Шаг 5. Проверь безопасность

Что уже делает редактор:

1. На paste вставляет plain text.
2. Чистит HTML в `getHTML()`.

Что обязательно делает приложение:

1. На backend валидирует вход.
2. Использует параметризованные SQL-запросы.
3. В view снова санитизирует HTML перед `innerHTML`.

Если это сделано, у тебя нормальная базовая защита для редакторного контента.

<a id="step-6"></a>
## Шаг 6. Частые проблемы и проверки

1. После вставки с сайта видны теги.
Проверь, что загружен новый `dist/webhacker-editor.bundle.js` и очисти кеш.

2. Inline code светлый в dark-теме.
Проверь значения `--secondary-color`, `--text-color`, `--border-color2` в теме хоста.

3. В view нет подсветки code block.
Проверь вызов `highlightCodeBlocksInElement(...)` после `innerHTML`.

4. Локально не запускаются тесты/сборка.
Проверь версию Node.js (нужно 18+).

<a id="step-7"></a>
## Готовый минимум: editor + view

### editor.html

```html
<div id="editor"></div>
<script src="/dist/webhacker-editor.bundle.js"></script>
<script>
  const editor = new window.WebHackerEditor.default("#editor", {
    language: "ru",
    onChange: (safeHtml) => localStorage.setItem("wh:safe", safeHtml)
  });

  const saved = localStorage.getItem("wh:safe");
  if (saved) editor.setHTML(saved);
</script>
```

### view.html

```html
<article id="content" class="webhacker-view-content"></article>
<script src="/dist/webhacker-editor.bundle.js"></script>
<script>
  const raw = localStorage.getItem("wh:safe") || "<p>Пусто</p>";
  const safe = window.WebHackerEditor.sanitizeHtmlStringToSafeHtml(raw);
  const el = document.getElementById("content");
  el.innerHTML = safe;
  window.WebHackerEditor.highlightCodeBlocksInElement(el);
</script>
```

После этого у тебя есть полный рабочий цикл:

1. редактирование;
2. безопасное сохранение;
3. безопасный вывод.
