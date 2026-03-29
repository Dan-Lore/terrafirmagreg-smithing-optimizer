# Changelog

Все значимые изменения проекта описываются в этом файле.

## Соглашение о версиях

На **GitHub** (`origin/main`) последний закоммиченный снимок — пакет **`g-point-steps-spa` версии `0.1.0`** (минимальный SPA с таблицей путей из нуля). Отдельного коммита или тега под «мажорную версию 2» на удалённом репозитории **не было**: работа по оптимизатору ковки TerraFirmaGreg велась в рабочем дереве и не пушилась.

**Версия `2.1.0`** — первая зафиксированная в документации и в `package.json` линия **2.x** для текущего приложения; она описывает **полную разницу** между последним коммитом на `main` и состоянием проекта в этом репозитории (включая незакоммиченные файлы).

---

## 2.1.1 (2026-03-28)

Расширение набора материалов и рецептов в **`data_source/`** (в т.ч. латунь, сталь, красный сплав, дополнения в **`materials_suffixes.txt`** и файлах **G_points**). После правок данных выполняется **`npm run generate-smithing`**; закоммиченный **`src/generated/smithing-data.ts`** должен совпадать со слиянием каталога (тест **`smithingDataSource.generatedSync`**).

---

## 2.1.0 (2026-03-28)

Сравнение с **последним коммитом на `origin/main`** на момент подготовки записи (**`6d8fe6b`** — *Create static.yml*; родительская линия включает **`b2e23f5`** — Docker/bootstrap/Pages для базового SPA **`0.1.0`**). Ниже — сводка по `git diff HEAD` и по неотслеживаемым файлам.

### Валидация `data_source/`

- Модуль **`src/lib/buildSmithingDatasetFromDataSource.ts`**: слияние, **`declaredGPoints`** (учёт каждой строки предмета в G), коды **`SMITHING_STRUCTURAL_ERROR_CODES`**, проверка **`verifyGPointsCoverageInUi`**.
- Генератор при **ошибках состава** завершается с **кодом 1** и печатает расшифровку.
- **`smithingDataSource.validation.test.ts`** — только состав (заголовки ↔ `sources`, G ↔ суффиксы, непустой итог); без требования «у каждой строки суффикса есть G».
- **`smithingDataSource.uiCoverage.test.ts`** — все строки предметов из **G_points** отражены в конфиге; счётчик строк G совпадает с числом пар в **gByMaterial**; при сбое выводится список проблем.

### Идентификаторы источников (`data_source/sources`)

В актуальном дереве: **`ingot`**, **`rod`**, **`double_ingot`**, **`plate`** (подписи в UI: Слиток, Стержень, Двойной слиток, Пластина). Ранее в черновиках встречались `ingots` / `rods` — они заменены; **`id` предметов** в коде имеют вид `ingot_pickaxe_head`, `plate_unfinished_boots` и т.д.

### Метаданные пакета

| Было (в Git) | Стало (локально) |
|--------------|------------------|
| `name`: `g-point-steps-spa` | `terrafirmagreg-smithing-optimizer` |
| `version`: `0.1.0` | **`2.1.0`** |
| Скрипты: `dev`, `build`, `preview`, `precompute` | плюс `generate-smithing`, `typecheck`, `lint`, `test`, `test:watch`; **`build`** вызывает **`generate-smithing`** перед Vite |

### Данные и генерация (`data_source/`)

Новая папка — **единственный источник правды** для ковки:

| Файл | Назначение |
|------|------------|
| `data_source/materials` | Материалы: `English / Русский = путь к иконке` (порядок строк → сортировка в UI) |
| `data_source/sources` | Секции (слиток / стержень / двойной слиток): id, sortIndex, подпись UI, **точная** строка заголовка для суффиксов и G-файлов |
| `data_source/materials_suffixes.txt` | Суффиксы по предметам с заголовками секций из `sources` |
| `data_source/G_points - <material>.txt` | Точка G по материалу и предмету |
| `data_source/README.md` | Формат файлов и чеклист расширения |

Новый скрипт **`scripts/generate-smithing-data.ts`** (`npm run generate-smithing`): читает манифесты и txt → пишет **`src/generated/smithing-data.ts`**. Неизвестный заголовок вида `X / Y:` (не из `sources`) не сбрасывает текущую секцию; в консоль — предупреждение.

### Публичные ассеты

- **`public/icons/`** — SVG иконок материалов (медь, бронза, кованое железо, олово, сталь и т.д.), пути задаются из `data_source/materials`.

### Логика приложения (`src/`)

| Область | Изменения |
|---------|-----------|
| **`src/lib/pathfinding.ts`** | BFS `shortestPath`, `stateBeforeSuffix`, `concatMoves`, проверки диапазона через общий **`applyDeltasInRange`** |
| **`src/lib/forgeOutcome.ts`** | Режимы **`anyToG`**, **`mark`**, **`value`**; таблица **`computeForgeOutcomeByMode`**; разбор полей G **`parseGField`** |
| **`src/lib/smithingDataParse.ts`** | Парсинг манифестов `sources` / `materials`, секционных файлов, bilingual-строк суффикса и G |
| **`src/config/smithing.types.ts`**, **`smithing.config.ts`** | Типы и доступ к **`GENERATED_SMITHING_CONFIG`** |
| **`src/composables/useForgeApp.ts`** | Состояние фильтров, расчёт исхода, модель панели результата |
| **`src/components/ForgeResultPanel.vue`** | Блок результата (мета, шаги, последовательности) |
| **`src/lib/forgeUiCopy.ts`** | Общие строки подсказок (`data_source/`, `npm run generate-smithing`, список файлов для панели) |
| **`src/types/forgeResultPanelModel.ts`** | Тип единого пропа **`model`** для панели результата |
| **`src/App.vue`** | Плиточные фильтры (режим, материал, источник, предмет), вычисляемые флаги блокировки (`modeAnyToG`, `materialLocked`, …), интеграция с **`forgeUiCopy`** |

Файлы **`src/lib/commands.ts`**, **`src/main.ts`**, **`src/generated/paths.ts`**, **`precompute-paths`** сохраняют роль проекта 0.1.0; таблица **`paths.ts`** по-прежнему сверяется с BFS в тестах.

### Тесты и статический анализ

- **Vitest** — `vitest.config.ts`
- Тесты: **`pathfinding.test.ts`**, **`pathsTable.test.ts`**, **`smithingDataParse.test.ts`**, **`forgeOutcome.test.ts`**
- **ESLint 9** + **typescript-eslint** + **eslint-plugin-vue** — `eslint.config.mjs`, скрипт **`npm run lint`** с **`--max-warnings 0`**
- **Проверка типов**: **`vue-tsc`** + **`tsc`** для Node-скриптов — `tsconfig.app.json`, **`tsconfig.node.json`**, обновлённый **`tsconfig.json`**
- **`src/vite-env.d.ts`** — типы для Vite / `import.meta.env`

Автотестов **Vue-компонентов** и **composable** нет (`@vue/test-utils` не подключался).

### CI/CD (`.github/workflows/`)

- **`pages.yml`**: после `npm ci` выполняются **`typecheck`**, **`lint`**, **`test`**, затем **`build`** с **`VITE_BASE_URL`** для подкаталога репозитория на GitHub Pages.
- **`static.yml`** — **удалён** (дублирование/устаревший сценарий относительно единого деплоя через Pages).

### Скрипты и прочее

- **`scripts/bootstrap-windows.ps1`** — после установки зависимостей вызывает **`npm run generate-smithing`** (актуальные данные ковки).
- **`scripts/precompute-paths.ts`** — мелкие правки при необходимости согласованности с новым `tsconfig`.
- **`index.html`** — заголовок/язык под текущий продукт.

### Документация

- **`README.md`** — описание оптимизатора ковки, режимов, `data_source/`, скриптов, структуры репозитория, ссылки на спецификацию и changelog.
- **`SPECIFICATION.md`** — постановка (граф 0..150, суффикс, G, режимы), формат данных из `data_source/`, сборка.
- Этот **`CHANGELOG.md`** — версия **2.1.0** и детальное сравнение с Git.

### Статистика diff (только уже отслеживаемые Git’ом файлы)

По **`git diff HEAD --shortstat`**: порядка **12 файлов**, **~+2674 / −371 строк** в изменённых путях. Дополнительно **десятки новых файлов** (см. списки выше), не входящих в last commit.

---

## 0.1.0 (2026-03-26) — последний релиз на GitHub до 2.1.0

- Первый SPA на Vue + Vite: отображение последовательности команд в диапазоне **0..150** на основе предвычисленной таблицы.
- **`scripts/precompute-paths.ts`** и **`src/generated/paths.ts`**.
- Docker, bootstrap Windows, workflow GitHub Pages (на момент коммита — без `generate-smithing` / smithing-данных).
