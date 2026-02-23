# Рецепты (быстрые задачи)

Короткие сценарии формата: "что нужно сделать" -> "где менять".

## 1) Добавить язык подсветки кода

1. Добавь язык в `features/code/engine.js`.
2. Добавь его в `constants/codeLanguages.js`.
3. Добавь переводы в `translations/ru.yml` и `translations/en.yml`.
4. Проверь в UI и прогони тесты.

## 2) Добавить новую кнопку в toolbar

1. Создай файл кнопки в `features/editor/toolbar/buttons/`.
2. Подключи в `registry.js`.
3. Добавь id кнопки в `layout.js`.
4. Добавь перевод текста кнопки.
5. Прогони `npm test` и `npm run build`.

## 3) Изменить поведение вставки (paste)

1. Открой `features/editor/events/clipboard.js`.
2. Измени логику вставки.
3. Добавь/обнови тесты sanitize.
4. Проверь вручную вставку из внешнего сайта.

## 4) Усилить sanitize

1. Если нужно убрать тег -> `sanitize/nodes.js`.
2. Если нужно убрать атрибут -> `sanitize/attributes.js`.
3. Если нужно убрать CSS-свойство -> `sanitize/styles.js`.
4. Сразу добавь тест в `tests/sanitize.html.test.js`.

## 5) Не работает подсветка кода в view

1. Проверь класс контейнера: `.webhacker-view-content`.
2. Проверь вызов `highlightCodeBlocksInElement(...)` после `innerHTML`.
3. Проверь, что подключен актуальный `dist/webhacker-editor.bundle.js`.

## 6) Не подтягиваются цвета темы

1. Проверь CSS variables в проекте-хосте.
2. Минимум: `--text-color`, `--secondary-color`, `--border-color2`.
3. Проверь, нет ли более специфичных CSS-правил, которые перебивают редактор.

## 7) Что дальше

Если внедряешь в продукт, читай:

1. `docs/08-integration-guide.md`
2. `docs/07-integration-contract.md`
