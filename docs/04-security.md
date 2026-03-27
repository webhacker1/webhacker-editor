# Безопасность

Редактор хранит и отдаёт только безопасный HTML.

1. `setHTML(html)` проходит через sanitize.
2. `getHTML()` снова санитизирует результат.

Где правила:
1. `constants/allowedTags.ts`
2. `sanitize/attributes.ts`
3. `sanitize/styles.ts`
4. `sanitize/nodes.ts`

Проверка: `tests/sanitize.html.test.ts`, `tests/sanitize.utils.test.ts`.

Пример:

```ts
import { sanitizeHtmlStringToSafeHtml } from "../index";

const dirty = '<a href="javascript:alert(1)" onclick="x()">link</a>';
const safe = sanitizeHtmlStringToSafeHtml(dirty);
console.log(safe); // href станет about:blank, onclick удалится
```
