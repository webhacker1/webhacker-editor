# Утилиты Richtext

## Что это
Мелкие переиспользуемые функции для richtext-слоя.

## Точка входа
`indexUtils.ts`

## Что внутри
- `inlineMarks.ts` — нормализация inline-оберток.

## Пример
```ts
import * as richtextUtils from "@/core/richtext/utils/indexUtils";
```

## Правила
- Утилиты должны быть маленькими и понятными.
- Без лишних побочных эффектов.
