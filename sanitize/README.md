# Слой Sanitize

## Что это
Слой безопасности: очищает HTML и опасные значения.

## Точка входа
`indexSanitize.ts`

## Что внутри
- `sanitize.ts` — входная функция sanitize HTML-строки.
- `nodes.ts` — рекурсивный обход DOM-узлов.
- `attributes.ts` — очистка атрибутов.
- `styles.ts` — белый список inline-стилей.
- `utils.ts` — безопасные URL/цвета/служебные helpers.

## Пример
```ts
import { sanitizeHtmlStringToSafeHtml } from "@/sanitize/indexSanitize";
```

## Правила
- Любое расширение разрешенных тегов/атрибутов только осознанно.
- По умолчанию поведение должно быть безопасным.
