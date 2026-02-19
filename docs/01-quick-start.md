# Быстрый старт

## Требования

1. Node.js 18+ (рекомендуется LTS)
2. npm 9+

## Установка зависимостей

```bash
npm install
```

## Основные команды

1. Сборка прод-бандла:

```bash
npm run build
```

Результат: `dist/webhacker-editor.bundle.js` (один JS-файл со стилями внутри через `style-loader`).

2. Режим разработки (watch):

```bash
npm run start
```

3. Тесты:

```bash
npm test
```

## Точки входа

1. Публичный entry: `index.js`
2. Класс редактора: `core/WebHackerEditor.js`
3. Стили: `whEditor.less`

## Быстрый smoke-check после изменений

1. `npm test`
2. `npm run build`
3. Открыть `index.html` (режим редактора) и `view.html` (режим просмотра) и проверить:
   - toolbar
   - code block + подсветка
   - link/color/table
   - сериализация и восстановление контента

