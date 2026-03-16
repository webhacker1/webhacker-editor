# Тесты

## Что это
Автотесты редактора.

## Что внутри
- `sanitize.html.test.ts` — проверка очистки HTML.
- `sanitize.utils.test.ts` — проверка sanitize-утилит.
- `toolbar.buttons.test.ts` — базовые сценарии toolbar.

## Как запустить
```bash
npm test
```

## Пример добавления теста
```ts
import { describe, it, expect } from "vitest";

describe("example", () => {
  it("works", () => {
    expect(true).toBe(true);
  });
});
```

## Правила
- Новые тесты называем по сценарию: `*.test.ts`.
- Сначала критичные пользовательские сценарии, потом детали реализации.
