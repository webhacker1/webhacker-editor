# Безопасность

Редактор хранит и отдает только безопасный HTML.

## Где лежит защита
1. `constants/allowedTags.ts` — разрешенные теги и служебные селекторы.
2. `sanitize/nodes.ts` — проход по DOM-узлам.
3. `sanitize/attributes.ts` — очистка атрибутов.
4. `sanitize/styles.ts` — фильтрация inline-стилей.
5. `sanitize/utils.ts` — sanitize URL/цветов и вспомогательные функции.

## Когда вызывается sanitize
1. В `setHTML(...)` перед вставкой контента.
2. В `getHTML()` перед выдачей наружу.
3. При paste из буфера обмена.

## Что нельзя делать
1. Убирать проверку протокола в `sanitizeHref`.
2. Расширять whitelist тегов без тестов.
3. Пропускать `sanitizeHtmlStringToSafeHtml` для внешнего HTML.

## Пример
```ts
import { sanitizeHtmlStringToSafeHtml } from "@/sanitize/indexSanitize";

const dirty = '<a href="javascript:alert(1)" onclick="boom()">x</a>';
const safe = sanitizeHtmlStringToSafeHtml(dirty);
```
