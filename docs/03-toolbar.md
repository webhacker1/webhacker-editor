# Toolbar: устройство и расширение

Этот раздел отвечает на вопрос "как добавить или поменять кнопку".

## 1) Как устроен toolbar

1. `layout.js` задает порядок групп и кнопок;
2. `buildToolbar.js` строит DOM по layout;
3. `buttons/registry.js` связывает `controlId` с фабрикой кнопки;
4. `buttons/*.js` реализуют конкретные действия;
5. `ui.js` содержит общие хелперы кнопок и dropdown.

## 2) Поток при клике на кнопку

1. пользователь кликает кнопку;
2. `createToolbarButton` делает `focus` в редактор;
3. выполняется команда (`execCommand` или кастомная логика);
4. вызываются `emitChange()` и `syncToggleStates()`;
5. при необходимости запускается подсветка code block.

## 3) Реальный пример: добавить кнопку `strikeThrough`

### Шаг 1. Создай кнопку

Файл: `features/editor/toolbar/buttons/strikeButton.js`

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

### Шаг 2. Зарегистрируй кнопку

В `buttons/registry.js`:
1. импортируй `createStrikeButton`;
2. добавь ключ `strike: createStrikeButton`.

### Шаг 3. Добавь кнопку в layout

В `toolbar/layout.js` добавь `strike` в нужную группу.

### Шаг 4. Добавь переводы

В `translations/ru.yml` и `translations/en.yml` добавь `strike`.

### Шаг 5. Добавь тест

Проверь, что кнопка:
1. рендерится;
2. вызывает действие;
3. не ломает существующие кнопки.

## 4) Когда делать обычную кнопку, а когда dropdown

1. обычная кнопка - одно действие сразу (`bold`, `italic`);
2. dropdown - когда есть выбор (`code`, `math`, `heading`, `color`, `table`).

## 5) Math dropdown (формулы)

Куда идти:
1. `features/editor/toolbar/buttons/mathDropdown.js`
2. `features/math/editorBindings.js`
3. `styles/less/math.less`
4. `translations/ru.yml`
5. `translations/en.yml`

Что важно:
1. тексты кнопки/лейблов берутся из `t.math`;
2. ссылка на правила формул хранится одной константой в `mathDropdown.js`;
3. действия меню: `Вставить/Insert`, `Обновить/Update`, `Отмена/Cancel`;
4. на мобильных позиционирование окна задается в `styles/less/math.less` (`.webhacker-menu--math`).

## 6) Почему иногда кнопка не работает

1. есть файл кнопки, но нет записи в `registry.js`;
2. есть запись в `registry.js`, но нет `controlId` в `layout.js`;
3. тексты не добавлены в переводы;
4. кнопка отключается `syncToggleStates()` в активном code block/table.

## 7) Реальный чеклист перед PR по toolbar

1. кнопка появилась в UI;
2. есть переводы RU и EN;
3. состояние disabled/pressed корректно;
4. горячие клавиши не конфликтуют;
5. `npm test` и `npm run build` проходят.

## 8) Что читать дальше

1. [05-testing.md](./05-testing.md)
2. [06-recipes.md](./06-recipes.md)
