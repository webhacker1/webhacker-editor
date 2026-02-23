# Toolbar: как устроен и как расширять

## 1) Из чего состоит toolbar

1. `features/editor/toolbar/layout.js`  
Порядок кнопок и групп.

2. `features/editor/toolbar/buildToolbar.js`  
Сборка toolbar по layout.

3. `features/editor/toolbar/buttons/registry.js`  
Связка `id кнопки` -> `фабрика кнопки`.

4. `features/editor/toolbar/buttons/*.js`  
Реализация каждой кнопки.

5. `features/editor/toolbar/ui.js`  
Общие UI-хелперы для кнопок и dropdown.

## 2) Как toolbar строится во время запуска

1. `WebHackerEditor` создает root.
2. Вызывает `buildToolbar(...)`.
3. `buildToolbar` читает `TOOLBAR_LAYOUT`.
4. Для каждого `controlId` registry создает кнопку.
5. Кнопки вставляются в toolbar.

## 3) Добавляем новую кнопку (шаг за шагом)

Пример: кнопка `strikeThrough`.

1. Создай файл `features/editor/toolbar/buttons/strikeButton.js`.

```js
import { createCommandButton } from "./createCommandButton.js";

export function createStrikeButton(editor, t) {
  return createCommandButton(editor, {
    title: t.strike,
    iconClassName: "fa-solid fa-strikethrough",
    commandName: "strikeThrough"
  });
}
```

2. Подключи кнопку в `registry.js`.
3. Добавь `controlId` в `layout.js`.
4. Добавь переводы в `translations/ru.yml` и `translations/en.yml`.
5. Прогони тесты и сборку.

## 4) Когда делать обычную кнопку, а когда dropdown

1. Обычная кнопка (`createCommandButton`)  
Когда действие простое и делается сразу (bold, italic, undo).

2. Dropdown  
Когда нужно меню с выбором (heading, color, code language).

## 5) Частые ошибки

1. Теряется выделение в dropdown.
Решение: на `mousedown` внутри меню делать `preventDefault`.

2. Кнопка есть в коде, но не видна.
Решение: проверить и `registry.js`, и `layout.js`.

3. Кнопка не переводится.
Решение: добавить ключ в оба файла переводов.

## 6) Что дальше

Следующий файл:

1. `docs/04-security.md`
