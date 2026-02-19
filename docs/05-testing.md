# Тестирование

## Стек

1. `vitest`
2. `jsdom`

Конфиг: `vitest.config.js`

## Как запустить

```bash
npm test
```

## Текущие тесты

1. `tests/sanitize.utils.test.js`  
Проверка URL sanitizer (`sanitizeHref`).

2. `tests/sanitize.html.test.js`  
Проверка HTML sanitizer:
   - удаление опасных атрибутов
   - корректная обработка ссылок
   - сохранение обычного текста
   - ограничение классов для code

3. `tests/toolbar.buttons.test.js`  
Проверка основных действий всех кнопок toolbar:
   - command buttons
   - dropdown actions
   - disabled image button

## Как добавлять новый тест

1. Создать файл в `tests/`, например `tests/feature-name.test.js`.
2. Использовать `describe/it/expect` из `vitest`.
3. Для UI-тестов в jsdom:
   - создать контейнер в `document.body`
   - создать инстанс редактора
   - смоделировать click/input/selection
4. Зафиксировать ожидаемый HTML/вызовы команд.

## Правила качества тестов

1. Один тест — одна причина падения.
2. Названия тестов должны описывать поведение, а не реализацию.
3. Для баг-фиксов добавлять регрессионный тест.
4. После любых изменений прогонять:
   - `npm test`
   - `npm run build`

