# Утилиты событий

## Что это
Локальные утилиты, которые используют обработчики событий.

## Точка входа
`indexEventUtils.ts`

## Что внутри
- `plainTextExtractor.ts` — достать plain text из clipboard.
- `selectionUtils.ts` — вспомогательные функции по выделению.
- `toolbarUtils.ts` — связь событий с toolbar.

## Пример
```ts
import { extractPlainTextFromClipboard } from "@/features/editor/events/utils/indexEventUtils";
```

## Правила
- Только маленькие и понятные функции.
- Слушатели событий здесь не вешаем.
