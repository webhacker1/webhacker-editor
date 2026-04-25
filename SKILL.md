---
name: webhacker-editor-repo-guide
description: Use this guide when working in the WEB HACKER EDITOR repository. It explains project structure, command pipeline, selection/toolbar behavior, formatting and list logic, sanitize boundaries, build/test workflow, and safe change checklist so an agent can quickly implement fixes without breaking editor behavior.
---

# WEB HACKER EDITOR: Agent Guide

## 1) Цель этого файла

Дать любому агенту быстрый и точный онбординг по репозиторию:

- где что находится;
- как проходит команда от кнопки до DOM;
- где править форматирование, списки, sanitize, toolbar;
- как не сломать выделение, history и сериализацию;
- как правильно собрать и проверить изменения.

## 2) Быстрый старт (5 минут)

1. Прочитай `index.ts`, `core/WebHackerEditor.ts`, `features/editor/setup.ts`.
2. Если задача по форматированию/спискам: открой `core/richtext/commands.ts` и `features/editor/events/index.ts`.
3. Если задача по toolbar/кнопкам/dropdown: открой `features/editor/toolbar/index.ts`.
4. Если задача по безопасности HTML: открой `sanitize/*` и `constants/allowedTags.ts`.
5. После любых изменений в src обязательно пересобери `dist`.

Команды:

```bash
npm install
npm run build
npm test
npm run typecheck
```

Если системный Node слишком старый, запускай так:

```bash
npx -y node@22 ./node_modules/webpack/bin/webpack.js
npx -y node@22 ./node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
```

## 3) Карта проекта

### Entrypoints

- `index.ts`
  - подключает стили;
  - экспортирует `WebHackerEditor` (default);
  - экспортирует `sanitizeHtmlStringToSafeHtml`, `highlightCodeBlocksInElement`, `renderMathBlocksInElement`.
- `index.html`, `view.html`
  - локальные страницы для ручной проверки поведения.

### Ядро

- `core/WebHackerEditor.ts`
  - конструктор, render UI, public API (`getHTML`, `setHTML`, `setTheme`), sync состояния кнопок, focus tracking.
- `core/commands.ts`
  - фасад `executeRichCommand(...)`.
- `core/richtext/runtime.ts`
  - мост между командами и history.
- `core/richtext/history.ts`
  - undo/redo и coalesce input-снимков.
- `core/richtext/commands.ts`
  - основная бизнес-логика команд (inline mark, align, list, color, format, link, delete, list tab/enter/backspace).
- `core/richtext/selection.ts`
  - утилиты range/caret/anchor.
- `core/richtext/registry.ts`
  - active editor instance.

### Editor features

- `features/editor/setup.ts`
  - единая установка фич (`code`, `math`, `table`, `events`).
- `features/editor/toolbar/index.ts`
  - layout toolbar, кнопки, dropdown, восстановление выделения, привязка команд.
- `features/editor/events/index.ts`
  - input/clipboard/selection/keyboard поведение.
- `features/editor/shortcuts/index.ts`
  - таблица шорткатов + матчер.
- `features/editor/selection/index.ts`
  - helper для caret в UI-части.

### Отдельные rich features

- `features/code/index.ts`
  - highlight.js, бейдж языка, действия блока кода, serializable cleanup.
- `features/math/index.ts`
  - KaTeX, рендер/редактирование формул, cleanup runtime UI перед сериализацией.
- `features/table/index.ts`
  - вставка таблиц, переход по ячейкам, выход из таблицы.

### Безопасность

- `sanitize/*`
  - рекурсивная очистка DOM и URL/CSS атрибутов.
- `constants/allowedTags.ts`
  - whitelist допустимых тегов.

### Тесты

- `tests/toolbar.buttons.test.ts` — поведение toolbar/selection/команд.
- `tests/sanitize.html.test.ts` — sanitize HTML.
- `tests/sanitize.utils.test.ts` — sanitize URL helpers.

## 4) Пайплайн выполнения команды

Источник команды:

- кнопка toolbar;
- dropdown action;
- keyboard shortcut;
- прямой вызов `executeRichCommand`.

Цепочка:

1. `executeRichCommand(...)` (`core/commands.ts`)
2. `runEditorCommand(...)` (`core/richtext/runtime.ts`)
3. `executeEditorCommand(...)` (`core/richtext/commands.ts`)
4. DOM mutation
5. history snapshot (`command`) если команда успешна
6. UI sync (`emitChange`, `syncToggleStates`) в вызывающем слое (toolbar/events/feature buttons)

Важно:

- `undo/redo` не пишут новый snapshot в `runEditorCommand`.
- input-события пишут snapshot типа `input` с coalesce-окном 1200ms.

## 5) Критичные зоны поведения

### 5.1 Inline marks (bold/italic/underline)

Главная точка: `toggleInlineMark(...)` в `core/richtext/commands.ts`.

Что уже заложено:

- поддержка `strong|b`, `em|i`, `u`;
- корректная работа на collapsed и range selection;
- попытка снять mark, если выделение почти полностью покрыто mark;
- разрезание single marked container без потери выделения;
- перемещение caret за пределы mark при выключении стиля на collapsed caret;
- структурная нормализация после операции.

Нормализация inline-контейнеров (`normalizeInvalidInlineMarkContainers`) делает:

- unwrap inline marks, если они обернули block-level элементы;
- merge nested однотипных marks;
- cleanup пустых marks (кроме узлов с атомарным контентом).

Та же идея нормализации есть в `features/editor/events/index.ts` на input. Это не дублирование "по ошибке", а защита структуры при прямом вводе и paste.

### 5.2 Выделение и toolbar click

Ключевая зона: `features/editor/toolbar/index.ts`.

- на `mousedown` кнопки сохраняется `currentSavedSelectionRange`;
- при click выполняется `ensureValidSelectionInEditor(...)`;
- для не-collapsed selection есть отдельная логика, чтобы не потерять диапазон;
- после действия синкается aria-pressed у toggle-кнопок.

Если проблема "выделение пропадает" или "кнопка не снимает стиль на выделении", смотреть сначала сюда + `toggleInlineMark`.

### 5.3 Списки

`core/richtext/commands.ts`:

- `toggleList` (ul/ol convert/remove);
- `splitListItem` (Enter в непустом `li`);
- `outdentListItem` (Enter на пустом `li`, Shift+Tab);
- `sinkListItem` (Tab);
- `backspaceListItem` (Backspace в начале `li`).

`features/editor/events/index.ts`:

- routing клавиш Enter/Tab/Backspace в list-команды.

### 5.4 Таблицы

- `features/table/index.ts`: вставка + caret anchors + exit to paragraph.
- `events/index.ts`: Tab navigation по ячейкам.

### 5.5 Код и формулы

- Code: `features/code/index.ts` (highlight + runtime controls).
- Math: `features/math/index.ts` (KaTeX + runtime preview/actions).
- При copy/serialize runtime UI чистится (`stripMathRuntimeUi`, удаление code UI badge).

## 6) Sanitize и контракт данных

Безопасность двусторонняя:

- `setHTML(html)` → sanitize перед вставкой;
- `getHTML()` → sanitize перед выдачей наружу.

Проверяй изменения в:

- `sanitize/nodes.ts`
- `sanitize/attributes.ts`
- `sanitize/styles.ts`
- `sanitize/utils.ts`
- `constants/allowedTags.ts`

Если добавляешь новый тег/атрибут/style, обнови sanitize правила и тесты.

## 7) Практический workflow изменения

### Любая правка поведения редактора

1. Воспроизведи сценарий в `index.html` или `view.html`.
2. Внеси минимальные правки в source.
3. Обнови/добавь тест (если есть подходящий слой).
4. Пересобери bundle.
5. Проверь руками в браузере.
6. Проверь, что не сломаны: toggle states, selection, history, sanitize output.

### Обязательно после source-правок

```bash
npm run build
```

Если не пересобрать, в браузере останется старый `dist/webhacker-editor.bundle.js`.

## 8) Добавление новой команды или кнопки

### Новая команда

1. Реализация в `core/richtext/commands.ts`.
2. Подключение в `executeEditorCommand` switch.
3. При необходимости состояние в `queryEditorCommandState`.
4. Если команда влияет на toolbar pressed-state, добавь toggleKey mapping в `WebHackerEditor.syncToggleStates`.

### Новая toolbar кнопка

1. Добавь control в `COMMAND_CONTROLS` (`features/editor/toolbar/index.ts`).
2. Добавь controlId в `TOOLBAR_LAYOUT`.
3. Для dropdown-контрола добавь ветку в `createCustomControl(...)` и фабрику меню.
4. Для shortcut обнови `features/editor/shortcuts/index.ts`.

### Переводы

- ключи должны существовать в `translations/ru.yml` и `translations/en.yml`.

## 9) Чеклист перед завершением задачи

- [ ] Поведение работает на выделении и на caret.
- [ ] `emitChange()` вызывается там, где mutate происходит вне стандартного command flow.
- [ ] `syncToggleStates()` корректно отражает состояние.
- [ ] История (undo/redo) не ломается.
- [ ] `npm run build` выполнен, `dist` актуален.
- [ ] Тесты/проверки, релевантные задаче, пройдены.
- [ ] `getHTML()` возвращает безопасный результат (без runtime UI артефактов).

## 10) Типовые риски (не пропускать)

1. Потеря selection при клике toolbar.
2. Визуально кнопка выключена, но caret остается внутри mark-container.
3. Частично-marked selection: ожидается "снять стиль со всего выделения", а не смешанный результат.
4. Inline mark случайно оборачивает block nodes (нужно нормализовать).
5. Изменения в src не попали в браузер из-за неактуального `dist`.
6. Добавлен новый HTML-элемент, но sanitize не обновлен.

## 11) Что читать при конкретных задачах

- "Не снимается жирный/курсив/подчеркнутый":
  - `core/richtext/commands.ts` (`toggleInlineMark`, helpers)
  - `features/editor/toolbar/index.ts` (selection restore)
  - `features/editor/events/index.ts` (input normalization)

- "Проблемы со списком/Tab/Enter/Backspace":
  - `core/richtext/commands.ts` list commands
  - `features/editor/events/index.ts` keyboard routing

- "Нужно добавить кнопку в тулбар":
  - `features/editor/toolbar/index.ts`
  - `features/editor/shortcuts/index.ts`
  - `translations/*.yml`

- "XSS/небезопасный HTML":
  - `sanitize/*`
  - `constants/allowedTags.ts`
  - `tests/sanitize.*.test.ts`

## 12) Минимальные правила стиля изменений

- Предпочитай точечные правки вместо больших рефакторов.
- Не дублируй логику без причины; если дублирование уже есть в критичных местах (например normalize на input и command), удаляй только после проверки реальных сценариев.
- Не редактируй `dist/*` вручную; обновляй только сборкой.
- В сложной DOM-операции сначала сохранение/восстановление selection, потом mutation, потом UI sync.
