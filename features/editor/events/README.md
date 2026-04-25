# События Editor

## Что это
Обработчики событий редактора (клавиатура, ввод, буфер, выделение).

## Точка входа
`indexEvents.ts`

## Что внутри
- `clipboardEvents.ts` — copy/paste.
- `inputEvents.ts` — нормализация ввода.
- `keyboardEvents.ts` — маршрутизация hotkeys/команд.
- `selectionEvents.ts` — синхронизация фокуса и выделения.
- `eventTypes.ts` — общие типы контекста событий.
- `utils/` — переиспользуемые маленькие помощники.

## Пример
```ts
import { installEditorEvents } from "@/features/editor/events/indexEvents";
```

## Правила
- Один источник событий = один `*Events.ts` файл.
- Общие штуки выносим в `utils/`, без дублирования.
