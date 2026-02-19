# Toolbar: устройство и расширение

## Где искать toolbar

1. Layout: `features/editor/toolbar/layout.js`
2. Сборка: `features/editor/toolbar/buildToolbar.js`
3. Реестр кнопок: `features/editor/toolbar/buttons/registry.js`
4. Общие UI-хелперы: `features/editor/toolbar/ui.js`
5. Реализации кнопок: `features/editor/toolbar/buttons/*.js`

## Как toolbar собирается

1. `core/WebHackerEditor.js` вызывает `buildToolbar(this, toolbarElement, t)`.
2. `buildToolbar` читает `TOOLBAR_LAYOUT`.
3. Для каждого id из layout дергается `createToolbarControl(controlId, editor, t)` из registry.
4. Registry выбирает фабрику нужной кнопки.

## Добавить новую кнопку (пошагово)

1. Создать файл кнопки в `features/editor/toolbar/buttons/`, например `strikeButton.js`.
2. Экспортировать фабрику:

```js
export function createStrikeButton(editor, t) {
  return createCommandButton(editor, {
    title: t.strike,
    iconClassName: "fa-solid fa-strikethrough",
    commandName: "strikeThrough"
  });
}
```

3. Добавить кнопку в `features/editor/toolbar/buttons/registry.js`.
4. Добавить id в нужную группу в `features/editor/toolbar/layout.js`.
5. Добавить перевод в `translations/en.yml` и `translations/ru.yml`.
6. Добавить тест в `tests/toolbar.buttons.test.js`.
7. Прогнать:
   - `npm test`
   - `npm run build`

## Когда делать `command button`, а когда `dropdown`

1. `Command button`  
Когда действие одношаговое и без дополнительного UI (`bold`, `undo`, `alignLeft`).

2. `Dropdown`  
Когда нужен выбор внутри меню (`headings`, `color`, `code`, `table`, `link`).

## Важные правила для новых кнопок

1. Всегда ставить `mousedown => preventDefault` на элементы меню, чтобы не потерять selection.
2. Для действий, зависящих от выделения, использовать `createMenuAction`.
3. Toggle-кнопки регистрировать через `trackToggleState` + `toggleKey`, если нужна подсветка активного состояния.
4. Не добавлять бизнес-логику в `core/WebHackerEditor.js` — только инфраструктура.

