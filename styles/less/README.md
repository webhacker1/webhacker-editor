# Less-стили

## Что это
Набор less-файлов, из которых собирается весь внешний вид редактора.

## Главный файл
`index.less`

## Что внутри
- `base.less` — базовые правила.
- `editor.less` — каркас редактора.
- `toolbar.less`, `menus.less`, `tooltips.less` — панель и меню.
- `code.less`, `math.less`, `mermaid.less`, `table.less` — стили фич.
- `forms.less`, `tokens.less` — служебные UI-токены и формы.

## Пример
```less
// styles/less/index.less
@import "./base.less";
@import "./editor.less";
```

## Правила
- Новую зону стилей добавляем отдельным файлом.
- В `index.less` держим только порядок подключений.
