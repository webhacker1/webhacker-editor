# Фича: Table

## Что это
Минимальная работа с таблицами: вставка, каретка, выход из таблицы.

## Точка входа
`indexTable.ts`

## Что внутри
- `runtime.ts` — утилиты работы с DOM таблиц.
- `editorFeature.ts` — интеграция таблиц в редактор.

## Пример
```ts
import * as tableFeature from "@/features/table/indexTable";
```

## Правила
- Чистые DOM-утилиты держим в `runtime.ts`.
- Хуки и команды редактора держим в `editorFeature.ts`.
