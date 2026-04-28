# Контролы Toolbar

## Что это
Файлы с конкретными кнопками/меню тулбара.

## Точка входа
`indexToolbarControls.ts`

## Что внутри
- `basicControls.ts` — базовые команды (bold, italic и т.д.).
- `codeControls.ts` — кнопки/меню для code block.
- `mathControl.ts` — вставка и управление math.
- `mermaidControl.ts` — вставка и управление mermaid.
- `voiceControl.ts` — голосовой ввод (диктовка в текущую позицию курсора).
- `tableControl.ts` — вставка таблиц.
- `shortcutsControl.ts` — подсказки по горячим клавишам.
- `customControl.ts` — кастомные контролы.

## Пример
```ts
import * as toolbarControls from "@/features/editor/toolbar/controls/indexToolbarControls";
```

## Правила
- Один домен контролов на файл.
- Общий экспорт только через `indexToolbarControls.ts`.
