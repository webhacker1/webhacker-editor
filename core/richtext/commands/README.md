# Команды Richtext

## Что это
Команды редактора, разложенные по зонам ответственности.

## Точка входа
`indexCommands.ts`

## Что внутри
- `inlineMarks.ts` — жирный, курсив, underline, unlink.
- `blockFormatting.ts` — заголовки, выравнивание, remove format.
- `lists.ts` — переключение списков.
- `listEditing.ts` — поведение Enter/Backspace/Tab в списках.
- `color.ts` — цвет текста.
- `content.ts` — вставка HTML/текста и удаление.
- `dom.ts` — общие DOM/range-хелперы.
- `types.ts` — типы команд и контекст.

## Пример
```ts
import { executeEditorCommand } from "@/core/richtext/commands/indexCommands";
```

## Правила
- Новую команду добавляем в профильный файл.
- Подключаем экспорт только через `indexCommands.ts`.
