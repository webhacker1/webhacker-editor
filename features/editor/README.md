# Фича: Editor

## Что это
Главная фича сборки редактора: setup, события, toolbar.

## Точка входа
`indexEditor.ts`

## Что внутри
- `setup.ts` — конвейер подключения фич.
- `featureRegistry.ts` — безопасная (идемпотентная) регистрация фич.
- `selection.ts` — общие функции по выделению.
- `shortcuts.ts` — сочетания клавиш.
- `events/` — обработка DOM-событий.
- `toolbar/` — сборка и контролы тулбара.
- `insertBlock.ts` — утилита вставки блочного элемента (пример: mermaid, table, codeBlock элементы).

## Пример
```ts
import { installDefaultEditorFeatures } from "@/features/editor/indexEditor";
```

## Правила
- Оркестрация подключения фич только в `setup.ts`.
- Логику событий и toolbar держим в отдельных подпапках.
