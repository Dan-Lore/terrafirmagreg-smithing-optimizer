# Точка G (SPA)

SPA на Vue + Vite: по введённому `G` (0..150) показывает минимальную последовательность команд из набора `+2, +7, +13, +16, -3, -6, -9, -15`, чтобы из 0 попасть в `G` **не выходя** за диапазон 0..150 на каждом шаге.

Подробности: `SPECIFICATION.md`, изменения: `CHANGELOG.md`.

## Запуск

### Быстрый запуск по ссылке (Windows + CMD)

Запустить одной командой (скачает проект, при необходимости поставит Node.js LTS через `winget`, установит зависимости и поднимет dev-сервер):

```bat
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Dan-Lore/terrafirmagreg-smithing-optimizer/main/scripts/bootstrap-windows.ps1 | iex"
```

После запуска откройте:

```text
http://localhost:5173/
```

Остановка сервера: `Ctrl + C`.

### Публичная ссылка (без запуска на стороне друга, GitHub Pages)

Один раз настройте GitHub Pages в репозитории (Settings -> Pages -> Build and deployment -> GitHub Actions).
После этого при каждом `push` в `main` workflow соберёт проект и выложит `dist`.

Дальше другу достаточно открыть URL формата:

`https://<username>.github.io/<repo-name>/`

для вашего репозитория обычно это:

`https://dan-lore.github.io/terrafirmagreg-smithing-optimizer/`

1) Установка:

```bash
npm install
```

2) Предвычисление (один раз или при изменении команд):

```bash
npm run precompute
```

3) Dev server:

```bash
npm run dev
```

## Генерация данных

- Скрипт: `scripts/precompute-paths.ts`
- Генерируемый файл (лежит в гите): `src/generated/paths.ts`

