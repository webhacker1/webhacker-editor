# Архитектура

## Слои проекта

### `core/`

Базовая инфраструктура редактора, без продуктовой логики фич:

1. `core/WebHackerEditor.js`  
Базовый класс, рендер контейнера, базовые методы (`getHTML`, `setHTML`, toggle/menu helpers, sync states).

2. `core/commands.js`  
Тонкая обертка над `document.execCommand`.

### `features/`

Логика разбита по доменам:

1. `features/code/`  
Подсветка, UI поверх code block, сериализация/десериализация кода, автоподсветка в режиме просмотра.

2. `features/editor/toolbar/`  
Сборка тулбара, layout, registry, реализации кнопок (каждая кнопка в отдельном файле).

3. `features/editor/events/`  
События редактора:
   - `input.js`
   - `clipboard.js`
   - `selection.js`
   - `keyboard.js`
   - `index.js` (оркестрация)

4. `features/editor/selection.js`  
Утилиты работы с selection/caret.

5. `features/table/editorBindings.js`  
Логика вставки/редактирования таблиц.

### `sanitize/`

Слой очистки HTML:

1. `sanitize/sanitize.js` — вход в санитайз
2. `sanitize/nodes.js` — обход DOM-узлов
3. `sanitize/attributes.js` — фильтрация атрибутов
4. `sanitize/styles.js` — фильтрация inline-style
5. `sanitize/utils.js` — утилиты (`sanitizeHref`, `escapeHtml`, и т.д.)

### Прочее

1. `constants/` — константы (`allowedTags`, `codeLanguages`, `colors`)
2. `translations/` — `ru.yml`, `en.yml`
3. `tests/` — unit/integration тесты
4. `whEditor.less` — стили редактора

## Поток данных

1. Пользователь вводит/вставляет контент в `contenteditable`.
2. Слой `features/editor/events/*` обрабатывает события.
3. Для code block вызывается logic из `features/code/*`.
4. При сохранении вызывается `editor.getHTML()`.
5. `getHTML()` прогоняет HTML через `sanitizeHtmlStringToSafeHtml`.
6. На выводе (`view`) HTML также санитизируется и подсвечивается.

## Принципы, которые уже приняты

1. Feature-first структура: логика рядом с доменом.
2. Один файл — одна ответственность (особенно для toolbar-кнопок).
3. Санитайз обязателен перед хранением/рендером.
4. Публичный бандл один: `dist/webhacker-editor.bundle.js`.

