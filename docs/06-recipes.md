# Рецепты: типовые задачи с готовыми шагами

Формат раздела: "что нужно" -> "куда идти" -> "что проверить".

## 1) Нужно добавить язык подсветки кода

Куда идти:
1. `features/code/engine.js`
2. `constants/codeLanguages.js`
3. `translations/ru.yml`
4. `translations/en.yml`

Что сделать:
1. зарегистрировать язык в `engine.js`;
2. добавить язык в список опций;
3. добавить подписи языка в переводы.

Что проверить:
1. язык виден в меню code block;
2. подсветка реально работает;
3. sanitize не ломает `class="language-*"`.

## 2) Нужно добавить новую кнопку в toolbar

Куда идти:
1. `features/editor/toolbar/buttons/*.js`
2. `features/editor/toolbar/buttons/registry.js`
3. `features/editor/toolbar/layout.js`
4. `translations/*.yml`

Что сделать:
1. создать кнопку;
2. зарегистрировать;
3. поставить в layout;
4. добавить переводы.

Что проверить:
1. кнопка рендерится;
2. кнопка кликается;
3. состояние кнопки корректное.

## 3) Нужно изменить paste-поведение

Куда идти:
1. `features/editor/events/clipboard.js`

Что сделать:
1. изменить обработку `paste`;
2. не сломать code block-ветку;
3. сохранить вызовы `emitChange` и `syncToggleStates`.

Что проверить:
1. вставка обычного текста;
2. вставка в code block;
3. вставка из внешнего сайта.

## 4) Нужно ужесточить sanitize

Куда идти:
1. `sanitize/nodes.js`
2. `sanitize/attributes.js`
3. `sanitize/styles.js`
4. `tests/sanitize.html.test.js`

Что сделать:
1. изменить правило;
2. добавить регрессионный тест.

Что проверить:
1. опасные кейсы режутся;
2. нужная разметка не теряется.

## 5) Нужно поменять поведение code block

Куда идти:
1. `features/editor/toolbar/buttons/codeDropdown.js`
2. `features/code/editorBindings.js`
3. `features/code/engine.js`

Что сделать:
1. если меняется toggle, править dropdown;
2. если меняется caret/badge, править editorBindings;
3. если меняется подсветка, править engine.

Что проверить:
1. вход и выход из code block;
2. смена языка;
3. сохранение HTML без служебного UI.

## 6) Нужно поправить тему

Куда идти:
1. `ui/theme.js`
2. `styles/less/*`
3. тема хост-приложения (CSS variables)

Что проверить:
1. светлая и темная тема;
2. inline code;
3. code block;
4. контраст текста.

## 7) Нужно понять "почему не работает в view"

Чеклист:
1. контейнер имеет класс `.webhacker-view-content`;
2. перед `innerHTML` идет sanitize;
3. после `innerHTML` вызывается `highlightCodeBlocksInElement`;
4. подключен актуальный `dist/webhacker-editor.bundle.js`.

## 8) Что читать дальше

1. [09-visual-maps.md](./09-visual-maps.md)
2. [08-integration-guide.md](./08-integration-guide.md)
