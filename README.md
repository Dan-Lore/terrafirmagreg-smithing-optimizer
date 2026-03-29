# TerraFirmaGreg — оптимизатор ковки (точка G)

**Версия 2.1.1** (в `package.json`). На GitHub до push остаётся последний закоммиченный снимок **0.1.0** под именем `g-point-steps-spa`; подробное сравнение — в [`CHANGELOG.md`](CHANGELOG.md).

SPA на **Vue 3 + Vite + TypeScript**: для выбранного **материала**, **источника** (слиток / стержень / двойной слиток / пластина — id в данных: `ingot`, `rod`, `double_ingot`, `plate`) и **предмета** строится **кратчайшая** последовательность команд из фиксированного набора, с удержанием значения в диапазоне **0..150** на каждом шаге. Учитываются **суффикс предмета** (последние команды ковки) и целевая точка **G** из данных.

Подробная логика и формат файлов: [`SPECIFICATION.md`](SPECIFICATION.md), формат `data_source/`: [`data_source/README.md`](data_source/README.md). История изменений: [`CHANGELOG.md`](CHANGELOG.md).

## Возможности

- Три режима ковки: **из любой точки в точку G** (старт и цель 0..150); **из точки G в предмет** (старт = G рецепта; материал заблокирован); **из любой точки в предмет** (старт с клавиатуры 0..150, по умолчанию **0**; этот режим выбран по умолчанию).
- Данные по секциям (**Ingot**, **Rod**, **Double Ingot**, **Plate**) в **`data_source/`** (английский ключ + русская подпись); интерфейс на русском.
- Автогенерация `src/generated/smithing-data.ts` и опциональная таблица путей из нуля `src/generated/paths.ts`.

## Запуск

```bash
npm install
npm run dev
```

Проверки: `npm run typecheck`, `npm run lint`, `npm run test` (Vitest: pathfinding, таблица `paths.ts`, парсер `data_source`, **валидация состава `data_source/`**, **покрытие G_points → конфиг**, **совпадение `data_source/` с закоммиченным `src/generated/smithing-data.ts`**, логика режимов ковки). Слой **Vue** отдельными тестами пока не покрыт — см. `CHANGELOG.md`.

После изменения файлов в `data_source/`:

```bash
npm run generate-smithing
```

Сборка (включает генерацию ковки):

```bash
npm run build
```

Пересчёт только таблицы путей **из 0** (если менялись команды в `src/lib/commands.ts`):

```bash
npm run precompute
```

## Скрипты

| Скрипт | Назначение |
|--------|------------|
| `npm run dev` | Dev-сервер Vite |
| `npm run generate-smithing` | `data_source/` → `src/generated/smithing-data.ts` |
| `npm run precompute` | BFS из 0 → `src/generated/paths.ts` |
| `npm run build` | `generate-smithing` + production-сборка |
| `npm run preview` | Превью production-сборки |

## Быстрый запуск на Windows (CMD)

Скачивает репозиторий, при необходимости ставит Node через `winget`, ставит зависимости и поднимает dev-сервер:

```bat
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Dan-Lore/terrafirmagreg-smithing-optimizer/main/scripts/bootstrap-windows.ps1 | iex"
```

## Публичный деплой (GitHub Pages)

В репозитории: **Settings → Pages → Build and deployment → GitHub Actions**. После push в `main` workflow собирает проект. Типичный URL: `https://<user>.github.io/<repo>/`.

## Docker

```bash
docker compose up --build
```

Откройте `http://localhost:8080`.

## Структура (важное)

- `data_source/materials` — материалы и пути к иконкам.
- `data_source/sources` — id секций, сортировка, подписи, строки заголовков для `materials_suffixes.txt` и G-файлов.
- `data_source/materials_suffixes.txt` — суффиксы по предметам и секциям.
- `data_source/G_points - <material>.txt` — точки G по материалу.
- `scripts/generate-smithing-data.ts` — чтение `data_source/` → `src/generated/smithing-data.ts`.
- `scripts/precompute-paths.ts` — предвычисление путей из 0 (вспомогательно).
- `src/App.vue` — фильтры и оболочка страницы; расчёт исхода — `src/composables/useForgeApp.ts`, `src/lib/forgeOutcome.ts`.
- `src/components/ForgeResultPanel.vue` — блок результата.
- `src/lib/pathfinding.ts` — BFS и состояние перед суффиксом.
