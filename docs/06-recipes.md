# Рецепты

## 1) Добавить новый язык подсветки кода

1. Подключить язык в `features/code/engine.js`:
   - импорт модуля из `highlight.js/lib/languages/...`
   - добавить в `LANGUAGE_MODULES`
2. Добавить язык в `constants/codeLanguages.js`.
3. Добавить переводы названия языка в:
   - `translations/en.yml`
   - `translations/ru.yml`
4. Прогнать `npm test` и `npm run build`.

## 2) Добавить новый пункт в code language picker

1. Обновить `constants/codeLanguages.js`.
2. Проверить соответствие `labelKey` в переводах.
3. Проверить рендер picker в `features/code/editorBindings.js` (там используется `CODE_LANGUAGE_OPTIONS`).

## 3) Добавить новый sanitize rule

1. Определить слой:
   - фильтр тега/узла: `sanitize/nodes.js`
   - фильтр атрибутов: `sanitize/attributes.js`
   - фильтр стилей: `sanitize/styles.js`
   - URL/цветы и прочие утилиты: `sanitize/utils.js`
2. Добавить тест в:
   - `tests/sanitize.utils.test.js` или
   - `tests/sanitize.html.test.js`

## 4) Добавить новую кнопку toolbar

1. Создать файл кнопки в `features/editor/toolbar/buttons/`.
2. Подключить в `registry.js`.
3. Добавить id в `layout.js`.
4. Добавить переводы.
5. Добавить тест в `tests/toolbar.buttons.test.js`.

## 5) Добавить новый обработчик событий редактора

1. Выбрать модуль:
   - `features/editor/events/input.js`
   - `features/editor/events/clipboard.js`
   - `features/editor/events/selection.js`
   - `features/editor/events/keyboard.js`
2. Добавить логику в соответствующий bind-функционал.
3. Если нужен новый тип событий, добавить новый файл и подключить его в `features/editor/events/index.js`.

## 6) Где искать проблему по симптомам

1. Подсветка кода сломалась:
   - `features/code/engine.js`
   - `features/code/editorBindings.js`

2. Кнопка не работает:
   - `features/editor/toolbar/buttons/*.js`
   - `features/editor/toolbar/registry.js`
   - `features/editor/toolbar/layout.js`

3. Странности при copy/paste:
   - `features/editor/events/clipboard.js`
   - `sanitize/*`

4. Санитайз пропускает лишнее:
   - `sanitize/attributes.js`
   - `sanitize/nodes.js`
   - `constants/allowedTags.js`

