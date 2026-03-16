# Архитектура

## Простая идея
1. В каждом модуле есть явный входной файл: `indexName.ts`.
2. Внутри модуля можно делить код как удобно, но наружу отдаём API через этот входной файл.
3. Импорты между модулями делаем через алиасы `@/...`.

## Почему так
- Быстро понятно, откуда начинается модуль.
- Меньше случайных глубоких импортов.
- Проще поддерживать и рефакторить.

## Карта слоев
- `constants/` — общие константы.
- `core/` — базовый движок редактора.
- `features/` — расширения (editor/code/math/mermaid/table).
- `sanitize/` — безопасность HTML.
- `ui/` — общие UI-хелперы.
- `styles/` — стили.

## Главные входные файлы
- `constants/indexConstants.ts`
- `core/indexCore.ts`
- `core/richtext/indexRichtext.ts`
- `core/richtext/commands/indexCommands.ts`
- `core/richtext/utils/indexUtils.ts`
- `features/indexFeatures.ts`
- `features/editor/indexEditor.ts`
- `features/editor/events/indexEvents.ts`
- `features/editor/events/utils/indexEventUtils.ts`
- `features/editor/toolbar/indexToolbar.ts`
- `features/editor/toolbar/controls/indexToolbarControls.ts`
- `features/code/indexCode.ts`
- `features/math/indexMath.ts`
- `features/mermaid/indexMermaid.ts`
- `features/table/indexTable.ts`
- `sanitize/indexSanitize.ts`
- `ui/indexUi.ts`

## Примеры импортов
Правильно:

```ts
import WebHackerEditor from "@/core/indexCore";
import { sanitizeHtmlStringToSafeHtml } from "@/sanitize/indexSanitize";
import { KEYBOARD_KEYS } from "@/constants/indexConstants";
```

Нежелательно (глубокий импорт из другого слоя):

```ts
import { somethingInternal } from "@/features/editor/events/utils/selectionUtils";
```

## Как добавлять новый код
1. Добавь файл реализации в нужный модуль.
2. Подключи его в `indexName.ts` этого модуля.
3. Обнови `README.md` модуля (коротко: что добавилось).
4. Если изменился публичный контракт — обнови docs.
