# Фичи

## Что это
Фичи, которые расширяют базовый редактор.

## Точка входа
`indexFeatures.ts`

## Что внутри
- `code/` — работа с блоками кода.
- `editor/` — основной UI-слой редактора (toolbar/events/setup).
- `math/` — математические блоки.
- `mermaid/` — диаграммы mermaid.
- `table/` — таблицы.

## Пример
```ts
import { installDefaultEditorFeatures } from "@/features/indexFeatures";
```

## Правила
- У каждой фичи свой явный входной файл `indexName.ts`.
- Не ходим глубокими импортами между фичами без необходимости.
