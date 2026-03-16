# Архитектура

1. `index.ts` — точка входа библиотеки.
2. `core/WebHackerEditor.ts` — основной класс и публичный API.
3. `features/editor/setup.ts` — подключает все фичи редактора.

Слои:
1. `core/*` — команды, history, runtime, выделение.
2. `features/editor/*` — события и тулбар.
3. `features/code|math|table/index.ts` — отдельные фичи.
4. `sanitize/*` — очистка HTML.

Пример: куда добавлять новую фичу.
1. Создайте `features/myFeature/index.ts`.
2. Экспортируйте `installMyFeature(...)`.
3. Подключите её в `features/editor/setup.ts`.

```ts
// features/editor/setup.ts
import { installMyFeature } from "../myFeature/index";

installMyFeature();
```
