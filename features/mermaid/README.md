# Фича: Mermaid

## Что это
Поддержка mermaid-диаграмм в редакторе и в runtime.

## Точка входа
`indexMermaid.ts`

## Что внутри
- `runtime.ts` — нормализация и рендер диаграмм.
- `editorFeature.ts` — кнопки/действия и интеграция с редактором.

## Пример
```ts
import * as mermaidFeature from "@/features/mermaid/indexMermaid";
```

## Правила
- Асинхронный рендер и состояния держим в `runtime.ts`.
- UI-поведение редактора держим в `editorFeature.ts`.
