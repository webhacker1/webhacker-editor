# Фича: Code

## Что это
Фича для code block: подсветка и поведение в редакторе.

## Точка входа
`indexCode.ts`

## Что внутри
- `highlight.ts` — регистрация языков и подсветка.
- `editorFeature.ts` — интеграция с редактором.

## Пример
```ts
import * as codeFeature from "@/features/code/indexCode";
```

## Правила
- Логику подсветки держим в `highlight.ts`.
- Хуки редактора держим в `editorFeature.ts`.
