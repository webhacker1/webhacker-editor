# Тестирование

Как быстро проверить, что изменения не сломали редактор.

## 1) Что используется

1. `vitest`
2. `jsdom`

Конфиг: `vitest.config.js`.

## 2) Быстрый запуск

```bash
npm test
```

## 3) Какие тесты уже есть

1. `tests/sanitize.utils.test.js`  
Проверяет утилиты санитайза (например, URL).

2. `tests/sanitize.html.test.js`  
Проверяет очистку HTML.

3. `tests/toolbar.buttons.test.js`  
Проверяет кнопки и dropdown в toolbar.

## 4) Что запускать перед коммитом

1. `npm test`
2. `npm run build`

Если это багфикс в критичной части (sanitize, paste, code block), добавь отдельный регрессионный тест.

## 5) Как добавить новый тест

1. Создай файл в `tests/`.
2. Опиши поведение в названии `it(...)`.
3. Подготовь входные данные.
4. Проверь ожидаемый результат через `expect(...)`.

Короткий шаблон:

```js
import { describe, it, expect } from "vitest";

describe("feature X", () => {
  it("делает Y", () => {
    const result = "...";
    expect(result).toBe("...");
  });
});
```

## 6) Что дальше

Следующий файл:

1. `docs/06-recipes.md`
