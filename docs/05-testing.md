# Тестирование: как не ломать редактор

## 1) Что используется

1. `vitest`
2. `jsdom`

Конфиг: `vitest.config.js`.

## 2) Базовые команды

```bash
npm test
npm run build
```

## 3) Какие тесты уже есть

1. `tests/sanitize.utils.test.js` - утилиты sanitize
2. `tests/sanitize.html.test.js` - очистка HTML
3. `tests/toolbar.buttons.test.js` - toolbar и dropdown

## 4) Минимальный стандарт перед PR

1. пройти `npm test`;
2. пройти `npm run build`;
3. если правил sanitize коснулись, добавить regression-тест;
4. если toolbar коснулись, обновить toolbar-тесты.

## 5) Реальный пример regression-теста для sanitize

```js
import { describe, it, expect } from "vitest";
import { sanitizeHtmlStringToSafeHtml } from "../sanitize/sanitize.js";

describe("sanitize href", () => {
  it("replaces javascript urls with about:blank", () => {
    const raw = '<a href="javascript:alert(1)">x</a>';
    const safe = sanitizeHtmlStringToSafeHtml(raw);
    expect(safe).toContain('href="about:blank"');
  });
});
```

## 6) Реальный пример теста для toolbar

Что обычно проверяем:
1. кнопка есть в DOM;
2. клик вызывает ожидаемое действие;
3. dropdown открывается и закрывается;
4. состояния disabled корректны в code block/table.

## 7) Частые причины красных тестов

1. поменяли текст переводов, а тест ищет старый `aria-label`;
2. поменяли sanitize-правило, но ожидание в тесте старое;
3. в тесте не смоделировано выделение/caret;
4. тест зависит от side-effect импортов, но они не подключены.

## 8) Если у тебя старая версия Node

`vitest` в этом проекте ожидает современный runtime.
Ориентир: Node 18+.

## 9) Что читать дальше

1. [06-recipes.md](./06-recipes.md)
2. [03-toolbar.md](./03-toolbar.md)
