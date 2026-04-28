# Тестирование

## Обязательный набор команд перед PR

```bash
npm run typecheck
npm test
npm run build
```

## Что покрыто сейчас

1. `tests/sanitize.html.test.ts` — безопасность HTML.
2. `tests/sanitize.utils.test.ts` — URL/utility sanitize-функции.
3. `tests/toolbar.buttons.test.ts` — базовое поведение toolbar и команд.

## Мини-чеклист ручной проверки

1. Вставка из clipboard в обычный текст и в `pre code`.
2. Вставка/редактирование math блока.
3. Вставка/редактирование mermaid блока.
4. Undo/redo после команд toolbar.
5. `getHTML()` не возвращает опасные атрибуты/протоколы.
