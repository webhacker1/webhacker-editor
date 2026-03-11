# Архитектура: как устроен редактор и почему так

Этот файл отвечает на вопрос "где вносить изменения при задаче X".

## 1) Слои системы

1. `core/` - базовые механизмы редактора.
2. `features/` - прикладная функциональность.
3. `sanitize/` - слой очистки и нормализации HTML.
4. `styles/` - оформление интерфейса.
5. `tests/` - проверка стабильности и регрессий.

## 2) Главные точки входа

1. `index.js` - публичный вход и сборка модулей;
2. `core/WebHackerEditor.js` - основной класс;
3. `sanitize/sanitize.js` - вход sanitize;
4. `features/editor/events/index.js` - биндинг событий;
5. `features/editor/toolbar/buildToolbar.js` - сборка toolbar.

## 3) Как собирается поведение

### Базовый каркас

`WebHackerEditor` в `core/`:
1. строит DOM редактора;
2. хранит ссылки на элементы;
3. дает публичные методы `getHTML`, `setHTML`, `setTheme`.

### Расширения

Feature-модули добавляют методы в `WebHackerEditor.prototype`.

Это сделано, чтобы:
1. не раздувать `core/WebHackerEditor.js`;
2. изолировать фичи по папкам;
3. упрощать сопровождение.

## 4) Поток данных в рантайме

1. пользователь вводит текст;
2. `events/*` ловят действие;
3. `emitChange()` вызывает callback `onChange`;
4. `onChange` получает результат `getHTML()`;
5. `getHTML()` прогоняет данные через sanitize;
6. наружу уходит уже очищенный HTML.

## 5) Поток данных при `setHTML`

1. `setHTML` получает строку HTML;
2. строка сразу проходит sanitize;
3. безопасный HTML вставляется в редактор;
4. для блоков кода запускается подсветка;
5. toolbar синхронизирует состояния кнопок.

## 6) Где искать изменения по темам

1. UI toolbar: `features/editor/toolbar/*`
2. Обработка клавиш: `features/editor/events/keyboard.js`
3. Вставка из буфера: `features/editor/events/clipboard.js`
4. Code block: `features/code/*`
5. Formula block (LaTeX): `features/math/*`, `features/editor/toolbar/buttons/mathDropdown.js`
6. Таблицы: `features/table/editorBindings.js`
7. Безопасность HTML: `sanitize/*`
8. Темизация: `ui/theme.js`, `styles/less/*`

## 7) Практический пример: "нужно добавить новую кнопку"

Что меняется почти всегда:
1. файл кнопки в `features/editor/toolbar/buttons/`;
2. регистрация в `buttons/registry.js`;
3. позиция в `toolbar/layout.js`;
4. тексты в `translations/ru.yml` и `translations/en.yml`;
5. тест в `tests/toolbar.buttons.test.js`.

## 8) Практический пример: "нужно ужесточить sanitize"

Что меняется:
1. правила тегов: `constants/allowedTags.js` и/или `sanitize/nodes.js`;
2. правила атрибутов: `sanitize/attributes.js`;
3. правила `style`: `sanitize/styles.js`;
4. тесты: `tests/sanitize.html.test.js`.

## 9) Частые ошибки архитектурного уровня

1. менять только один слой, забывая о связанных слоях;
2. менять sanitize без тестов на регрессии;
3. считать, что `getHTML` возвращает raw-html, хотя это safe-html;
4. не вызывать подсветку в view-режиме после `innerHTML`.

## 10) Что читать дальше

1. [03-toolbar.md](./03-toolbar.md)
2. [04-security.md](./04-security.md)
3. [09-visual-maps.md](./09-visual-maps.md)
