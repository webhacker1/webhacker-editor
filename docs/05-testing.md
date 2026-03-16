# Тестирование

Основные команды:

```bash
npm test
npm run build
npm run typecheck
```

Проверяется:
1. sanitize и URL-фильтрация;
2. базовое поведение тулбара;
3. сборка.

Если системный Node старый:

```bash
npx -y node@20 node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
npx -y node@20 node_modules/webpack/bin/webpack.js
```
