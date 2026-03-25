# Тулбар

Весь тулбар: `features/editor/toolbar/index.ts`.

Добавить простую кнопку:
1. Добавьте конфиг в `COMMAND_CONTROLS`.
2. Добавьте `controlId` в `TOOLBAR_LAYOUT`.

```ts
COMMAND_CONTROLS.strike = {
  title: t => "Зачеркнутый текст",
  iconClassName: "fa-solid fa-strikethrough",
  commandName: "strikeThrough"
};

TOOLBAR_LAYOUT[2].push("strike");
```

Добавить dropdown-кнопку:
1. Создайте фабрику `createMyDropdown(...)` в этом же файле.
2. Верните её из `createCustomControl(...)`.
3. Добавьте `controlId` в `TOOLBAR_LAYOUT`.

```ts
if (controlId === "myDropdown") return createMyDropdown(editor, t);
```
