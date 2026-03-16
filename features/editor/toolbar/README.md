# Toolbar редактора

## Что это
Сборка панели инструментов, layout и маршрутизация контролов.

## Точка входа
`indexToolbar.ts`

## Что внутри
- `buildToolbar.ts` — создание DOM тулбара.
- `createToolbarControl.ts` — выбор и создание конкретного контрола.
- `toolbarConfig.ts` — структура групп и кнопок.
- `toolbarContext.ts` — общий контекст и UI-хелперы.
- `controls/` — конкретные реализации контролов.

## Пример
```ts
import { buildToolbar } from "@/features/editor/toolbar/indexToolbar";
```

## Правила
- Конфиг и поведение держим раздельно.
- Сложные контролы выносим в `controls/`.
