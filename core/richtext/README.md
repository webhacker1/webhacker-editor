# Richtext-слой

## Что это
Низкоуровневый движок редактирования: команды, history, selection.

## Точка входа
`indexRichtext.ts`

## Что внутри
- `commands/` — команды и их состояние.
- `history.ts` — undo/redo.
- `runtime.ts` — запуск команд и связь с history.
- `selection.ts` — общие утилиты для каретки и выделения.
- `registry.ts` — реестр активного редактора.
- `utils/` — локальные вспомогательные функции.

## Пример
```ts
import * as richtext from "@/core/richtext/indexRichtext";
```

## Правила
- Поведение команд должно быть предсказуемым.
- Публичные экспорты держим в `indexRichtext.ts`.
