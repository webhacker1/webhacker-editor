# Фича: Math

## Что это
Поддержка математических блоков в редакторе и в runtime.

## Точка входа
`indexMath.ts`

## Что внутри
- `runtime.ts` — разбор, рендер и очистка math-блоков.
- `editorFeature.ts` — интеграция math в редактор.

## Пример
```ts
import * as mathFeature from "@/features/math/indexMath";
```

## Правила
- Рендер/парсинг держим в `runtime.ts`.
- Привязку к редактору держим в `editorFeature.ts`.
