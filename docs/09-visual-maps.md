# Визуальные карты проекта

Ниже те же идеи, но в формате диаграмм.

## 1) Карта модулей проекта

```mermaid
flowchart TB
    HostApp[Host app] --> Entry[index.js]
    Entry --> Core[core WebHackerEditor]
    Entry --> Events[features editor events]
    Entry --> Code[features code]
    Entry --> Table[features table]
    Entry --> Styles[styles and less]

    Core --> Toolbar[toolbar modules]
    Core --> Theme[ui theme]
    Core --> SanitizeIn[sanitize entry]
    SanitizeIn --> Nodes[sanitize nodes]
    Nodes --> Attr[sanitize attributes]
    Attr --> Css[sanitize styles]
    Attr --> Utils[sanitize utils]
```

Как читать:
1. `index.js` - центральная точка сборки;
2. `core` держит каркас;
3. `features` добавляют поведение;
4. sanitize - отдельный защитный слой.

## 2) Поток данных от пользователя к API

```mermaid
sequenceDiagram
    participant User
    participant Editable as contenteditable
    participant Events as events
    participant Editor as WebHackerEditor
    participant San as sanitize
    participant App as host app

    User->>Editable: type or paste
    Editable->>Events: browser event
    Events->>Editor: emitChange
    Editor->>Editor: getHTML
    Editor->>San: sanitize html
    San-->>Editor: safe html
    Editor-->>App: onChange safe html
```

Как читать:
1. события идут через `events/*`;
2. наружу отправляется только safe-html;
3. sanitize встроен в путь `getHTML`.

## 3) Как добавить новый функционал

```mermaid
flowchart LR
    Need[New feature] --> Choice{Feature type}

    Choice -->|Toolbar action| Tb1[Create button file]
    Tb1 --> Tb2[Register in registry]
    Tb2 --> Tb3[Add id to layout]
    Tb3 --> Tb4[Add translations]

    Choice -->|Editor behavior| Ed1[Change events or feature module]
    Ed1 --> Ed2[Update prototype extensions]
    Ed2 --> Ed3[Check index side imports]

    Tb4 --> Final[Test and build]
    Ed3 --> Final
    Final --> Merge[Docs and PR]
```

Как читать:
1. сначала определить тип задачи;
2. потом пройти свой обязательный маршрут;
3. в финале всегда тесты и документация.

## 4) Жизненный цикл code block

```mermaid
flowchart LR
    Plain[Plain text] --> Inline[Inline code]
    Plain --> Block[Code block]
    Inline --> Plain
    Inline --> Block
    Block --> BlockEdit[Typing and highlight at caret]
    Block --> BlockLang[Language change]
    Block --> Plain
```

Как читать:
1. `Inline code` и `Code block` - разные режимы;
2. у `Code block` есть свои действия: язык, подсветка, выход.

## 5) Модули code block

```mermaid
flowchart LR
    Dropdown[codeDropdown] --> Bindings[code editorBindings]
    Bindings --> Engine[code engine]
    Bindings --> Serialize[getSerializableEditorHtml]
    Serialize --> Safe[getHTML sanitize]
    Engine --> Hljs[highlight js]
    Bindings --> Languages[codeLanguages constants]
```

Как читать:
1. dropdown запускает поведение;
2. bindings управляет курсором и UI;
3. engine отвечает за подсветку;
4. сериализация убирает служебные элементы перед сохранением.

## 6) Где искать баг по симптомам

1. не работает включение блока кода: `features/editor/toolbar/buttons/codeDropdown.js`
2. сдвигается курсор внутри кода: `features/code/editorBindings.js`
3. не меняется язык: `constants/codeLanguages.js` и `features/code/editorBindings.js`
4. нет подсветки: `features/code/engine.js`
5. в сохранении лишний UI: `getSerializableEditorHtml` в `features/code/editorBindings.js`

## 7) Что читать после диаграмм

1. [02-architecture.md](./02-architecture.md)
2. [03-toolbar.md](./03-toolbar.md)
3. [06-recipes.md](./06-recipes.md)
