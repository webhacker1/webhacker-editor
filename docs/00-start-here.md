# Start Here: обзор проекта

Этот файл нужен для первого знакомства с кодовой базой.

## 1) Что это за проект

`WebHackerEditor` - это браузерный rich-text редактор.

Он делает 3 ключевые вещи:
1. дает UI редактирования (toolbar + поле ввода);
2. хранит контент в виде HTML;
3. очищает HTML (sanitize), чтобы убирать опасные и мусорные конструкции.

## 2) Основные подсистемы

1. `core/` - базовый класс редактора и публичные методы.
2. `features/` - функциональные модули (toolbar, события, code block, таблицы).
3. `sanitize/` - очистка HTML перед сохранением и выводом.
4. `styles/` - визуальный слой редактора.

## 3) Что важно понять в первую очередь

Самый важный нюанс архитектуры:
1. класс `WebHackerEditor` создается в `core/WebHackerEditor.js`;
2. потом он расширяется через `prototype` в feature-модулях;
3. эти модули подключаются side-effect импортами в `index.js`.

То есть поведение редактора "собирается" из нескольких файлов, а не лежит в одном месте.

Пример из `index.js`:

```js
import WebHackerEditor from "./core/WebHackerEditor.js";
import "./features/code/index.js";
import "./features/table/editorBindings.js";
import "./features/editor/events/index.js";
```

## 4) Мини-карта проекта

1. `index.js` - главный вход библиотеки
2. `core/WebHackerEditor.js` - базовый класс и публичные методы
3. `features/editor/events/*` - input, paste, keyboard, selection
4. `features/editor/toolbar/*` - кнопки и меню
5. `features/code/*` - code block и подсветка
6. `features/table/*` - таблицы
7. `sanitize/*` - фильтрация HTML
8. `ui/*` - утилиты UI и темы
9. `translations/*.yml` - тексты интерфейса
10. `tests/*` - тесты

## 5) Как идет путь данных

1. пользователь вводит текст в `contenteditable`;
2. события ловятся в `features/editor/events/*`;
3. редактор вызывает `emitChange()`;
4. внутри `emitChange()` идет `getHTML()`;
5. `getHTML()` очищает HTML через `sanitizeHtmlStringToSafeHtml()`;
6. снаружи приложение получает уже очищенный HTML.

Почему так важно:
1. интеграция получает стабильный формат;
2. меньше риск, что грязный HTML уедет в API.

## 6) Реальный минимальный пример

```html
<div id="editor"></div>
<script src="/dist/webhacker-editor.bundle.js"></script>
<script>
  const editor = new window.WebHackerEditor.default("#editor", {
    language: "ru",
    onChange: (safeHtml) => {
      console.log("safe html", safeHtml);
    }
  });
</script>
```

## 7) С чего начать работу в первый день

1. Прочитать [09-visual-maps.md](./09-visual-maps.md) - чтобы увидеть связи глазами.
2. Пройти [01-quick-start.md](./01-quick-start.md) - чтобы собрать и запустить локально.
3. Прочитать [02-architecture.md](./02-architecture.md) - чтобы знать, где что менять.
4. Если задача по UI - сразу открыть [03-toolbar.md](./03-toolbar.md).
5. Если задача по HTML/безопасности - сразу открыть [04-security.md](./04-security.md).

## 8) Частые причины некорректной работы

1. забыт side-effect импорт feature-модуля;
2. новая кнопка добавлена в файл, но не добавлена в `registry.js` или `layout.js`;
3. в view-режиме HTML рендерят без sanitize;
4. изменили sanitize-логику без новых тестов.

## 9) Что читать дальше

1. [09-visual-maps.md](./09-visual-maps.md)
2. [01-quick-start.md](./01-quick-start.md)
3. [02-architecture.md](./02-architecture.md)
