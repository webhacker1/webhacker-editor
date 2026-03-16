# Toolbar: как расширять

Главный файл модуля toolbar: `features/editor/toolbar/indexToolbar.ts`.

## Базовые правила
1. У каждого контрола свой уникальный `controlId`.
2. Простой контрол добавляем в `COMMAND_CONTROLS`.
3. Контрол должен быть размещен в `TOOLBAR_LAYOUT`.

## Пример простой кнопки
```ts
COMMAND_CONTROLS.strike = {
  title: t => "Зачеркнутый",
  iconClassName: "fa-solid fa-strikethrough",
  commandName: "strikeThrough"
};
```

После этого добавьте `strike` в нужную группу в `TOOLBAR_LAYOUT`.

## Пример сложного контрола
Если кнопка разрастается (dropdown, форма, состояние):
1. Вынеси код в отдельный файл внутри `features/editor/toolbar/controls/`.
2. Экспортируй фабрику через `controls/indexToolbarControls.ts`.
3. Подключи контрол через `createToolbarControl.ts`.

Так toolbar остаётся читаемым и без монолита.
