/**
 * Слияние data_source → конфиг ковки.
 * Ошибки (severity: error): некорректный состав (заголовки, G без строки в суффиксах, G вне 0..150, пустой итог).
 * Строка суффикса без ни одного G в материалах не считается ошибкой — предмет просто не попадёт в UI.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { SmithingConfig } from '../config/smithing.types'
import type { SourceManifestRow, SuffixEntry } from './smithingDataParse'
import { MAX_G, MIN_G } from './commands'
import {
  parseBilingualGLine,
  parseBilingualSuffixLine,
  parseMaterialsManifest,
  parseSectionedFile,
  parseSourcesManifest,
  slugEn,
  stableItemId,
} from './smithingDataParse'

export const SMITHING_DATA_FILES = {
  suffix: 'materials_suffixes.txt',
  sources: 'sources',
  materials: 'materials',
} as const

export type SmithingDatasetIssue = {
  severity: 'error' | 'warn'
  code: string
  file: string
  line?: number
  message: string
}

export type BuiltSmithingItem = {
  sortIndex: number
  id: string
  label: string
  sourceId: string
  suffix: number[]
  gByMaterial: Record<string, number>
}

/** Одна объявленная в G_points строка предмета (не заголовок секции). */
export type GPointDeclaredRow = {
  file: string
  lineNo: number
  materialId: string
  sectionId: string
  keyEn: string
  g: number
}

export type BuiltSmithingDataset = {
  sourcesSorted: SourceManifestRow[]
  sourceIds: string[]
  materialIds: string[]
  items: BuiltSmithingItem[]
  materialsOutput: Array<{ id: string; sortIndex: number; label: string; icon: string }>
  sourcesOutput: Array<{ sortIndex: number; id: string; label: string }>
  issues: SmithingDatasetIssue[]
  /** Все успешно разобранные строки G (для проверки «всё из G попало в UI»). */
  declaredGPoints: GPointDeclaredRow[]
}

function emptySectionMaps<T>(sourceIds: string[]): Map<string, Map<string, T>> {
  const m = new Map<string, Map<string, T>>()
  for (const id of sourceIds) {
    m.set(id, new Map())
  }
  return m
}

function addIssue(
  issues: SmithingDatasetIssue[],
  severity: SmithingDatasetIssue['severity'],
  code: string,
  file: string,
  message: string,
  line?: number,
): void {
  issues.push({ severity, code, file, message, line })
}

function readUtf8OrThrow(absPath: string, label: string): string {
  try {
    return readFileSync(absPath, 'utf8')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`data_source: не удалось прочитать «${label}» (${absPath}): ${msg}`)
  }
}

function readDirOrThrow(absPath: string): string[] {
  try {
    return readdirSync(absPath)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`data_source: не удалось прочитать каталог (${absPath}): ${msg}`)
  }
}

/**
 * @param dsAbsolutePath — абсолютный путь к каталогу data_source
 */
export function buildSmithingDatasetFromDataSource(dsAbsolutePath: string): BuiltSmithingDataset {
  const issues: SmithingDatasetIssue[] = []
  const ds = dsAbsolutePath

  const sourcesText = readUtf8OrThrow(resolve(ds, SMITHING_DATA_FILES.sources), SMITHING_DATA_FILES.sources)
  const sourcesManifest = parseSourcesManifest(sourcesText)
  const sourcesSorted = [...sourcesManifest].sort((a, b) => a.sortIndex - b.sortIndex)

  const materialRows = parseMaterialsManifest(
    readUtf8OrThrow(resolve(ds, SMITHING_DATA_FILES.materials), SMITHING_DATA_FILES.materials),
  )
  const materialById = new Map(materialRows.map((m) => [m.id, m]))

  const suffixPath = resolve(ds, SMITHING_DATA_FILES.suffix)
  const suffixText = readUtf8OrThrow(suffixPath, SMITHING_DATA_FILES.suffix)
  const sourceIds = sourcesSorted.map((s) => s.id)
  const suffixMap = emptySectionMaps<SuffixEntry>(sourceIds)

  parseSectionedFile(suffixText, sourcesManifest, (section, raw) => {
    const p = parseBilingualSuffixLine(raw)
    if (!p) return
    const slug = slugEn(p.keyEn)
    suffixMap.get(section)!.set(slug, p)
  }, (w) => {
    addIssue(issues, 'error', 'UNKNOWN_SECTION_HEADER', SMITHING_DATA_FILES.suffix, w.message, w.lineNo)
  })

  const gFiles = readDirOrThrow(ds).filter((f: string) => f.startsWith('G_points - ') && f.endsWith('.txt'))
  const gData = new Map<string, Map<string, Map<string, number>>>()
  const declaredGPoints: GPointDeclaredRow[] = []

  for (const file of gFiles) {
    const inner = file.replace(/^G_points\s*-\s*/i, '').replace(/\.txt$/i, '')
    const materialId = inner.trim().replace(/\s+/g, '_').toLowerCase()
    const meta = materialById.get(materialId)
    if (!meta) {
      addIssue(
        issues,
        'warn',
        'UNKNOWN_MATERIAL_FILE',
        file,
        `Файл материала не описан в data_source/${SMITHING_DATA_FILES.materials} — пропуск.`,
      )
      continue
    }
    const text = readUtf8OrThrow(resolve(ds, file), file)
    const matMap = emptySectionMaps<number>(sourceIds)
    parseSectionedFile(
      text,
      sourcesManifest,
      (section, raw, lineNo) => {
        const p = parseBilingualGLine(raw)
        if (!p) return
        if (p.g < MIN_G || p.g > MAX_G) {
          addIssue(
            issues,
            'error',
            'G_OUT_OF_RANGE',
            file,
            `Секция "${section}": "${p.keyEn}" — G=${p.g} вне допустимого диапазона ${MIN_G}..${MAX_G} (как в игре и в расчёте путей).`,
            lineNo,
          )
          return
        }
        const slug = slugEn(p.keyEn)
        if (!suffixMap.get(section)?.has(slug)) {
          addIssue(
            issues,
            'error',
            'G_KEY_NOT_IN_SUFFIXES',
            file,
            `Секция "${section}": English key "${p.keyEn}" (G=${p.g}) отсутствует в ${SMITHING_DATA_FILES.suffix} — строка не попадёт в конфиг; проверьте опечатку или секцию.`,
            lineNo,
          )
          return
        }
        matMap.get(section)!.set(slug, p.g)
        declaredGPoints.push({
          file,
          lineNo,
          materialId,
          sectionId: section,
          keyEn: p.keyEn,
          g: p.g,
        })
      },
      (w) => {
        addIssue(issues, 'error', 'UNKNOWN_SECTION_HEADER', file, w.message, w.lineNo)
      },
    )
    gData.set(materialId, matMap)
  }

  for (const row of materialRows) {
    if (!gData.has(row.id)) {
      addIssue(
        issues,
        'warn',
        'MATERIAL_WITHOUT_G_FILE',
        SMITHING_DATA_FILES.materials,
        `Материал "${row.id}" есть в ${SMITHING_DATA_FILES.materials}, но нет файла G_points - <id>.txt — для него не будет рецептов.`,
      )
    }
  }

  const materialIds = [...gData.keys()].sort(
    (a, b) => (materialById.get(a)?.sortIndex ?? 999) - (materialById.get(b)?.sortIndex ?? 999),
  )

  if (materialIds.length === 0) {
    addIssue(
      issues,
      'error',
      'NO_MATERIALS_WITH_G',
      SMITHING_DATA_FILES.materials,
      'Нет ни одного материала с загруженными G_points — UI будет пустым.',
    )
  }

  const items: BuiltSmithingItem[] = []
  let sortIndex = 10
  for (const section of sourcesSorted) {
    const entries = [...suffixMap.get(section.id)!.entries()].sort((a, b) =>
      a[1].keyEn.localeCompare(b[1].keyEn, 'en'),
    )
    for (const [, entry] of entries) {
      const suffix = entry.deltas
      const gByMaterial: Record<string, number> = {}
      for (const mid of materialIds) {
        const g = gData.get(mid)?.get(section.id)?.get(slugEn(entry.keyEn))
        if (typeof g === 'number') gByMaterial[mid] = g
      }
      if (Object.keys(gByMaterial).length === 0) {
        continue
      }
      items.push({
        sortIndex,
        id: stableItemId(section.id, entry.keyEn),
        label: entry.labelRu,
        sourceId: section.id,
        suffix,
        gByMaterial,
      })
      sortIndex += 10
    }
  }

  if (items.length === 0 && materialIds.length > 0) {
    addIssue(
      issues,
      'error',
      'NO_ITEMS_AFTER_MERGE',
      SMITHING_DATA_FILES.suffix,
      'После слияния суффиксов и G не осталось ни одного предмета.',
    )
  }

  const sourcesOutput = sourcesSorted.map((s) => ({
    sortIndex: s.sortIndex,
    id: s.id,
    label: s.label,
  }))

  const materialsOutput = materialIds.map((id) => {
    const m = materialById.get(id)!
    return {
      id,
      sortIndex: m.sortIndex,
      label: m.label,
      icon: m.icon,
    }
  })

  return {
    sourcesSorted,
    sourceIds,
    materialIds,
    items,
    materialsOutput,
    sourcesOutput,
    issues,
    declaredGPoints,
  }
}

/** Снимок конфига как в `src/generated/smithing-data.ts` (для сравнения с закоммиченной генерацией). */
export function builtDatasetToSmithingConfig(built: BuiltSmithingDataset): SmithingConfig {
  return {
    materials: built.materialsOutput,
    sources: built.sourcesOutput,
    items: built.items.map((i) => ({
      sortIndex: i.sortIndex,
      id: i.id,
      label: i.label,
      sourceId: i.sourceId,
      suffix: i.suffix,
      gByMaterial: i.gByMaterial,
    })),
  }
}

/** Коды ошибок «состава» data_source: любой новый код error из addIssue должен попадать сюда или в тестах проверять все error. */
export const SMITHING_STRUCTURAL_ERROR_CODES = new Set([
  'UNKNOWN_SECTION_HEADER',
  'G_KEY_NOT_IN_SUFFIXES',
  'G_OUT_OF_RANGE',
  'NO_MATERIALS_WITH_G',
  'NO_ITEMS_AFTER_MERGE',
])

export function smithingStructuralErrors(issues: SmithingDatasetIssue[]): SmithingDatasetIssue[] {
  return issues.filter((i) => i.severity === 'error' && SMITHING_STRUCTURAL_ERROR_CODES.has(i.code))
}

export function formatSmithingStructuralFailure(errors: SmithingDatasetIssue[]): string {
  if (errors.length === 0) return ''
  return [
    'Валидация состава data_source не пройдена (исправьте и снова npm run test / generate-smithing):',
    ...errors.map(
      (i) =>
        `  • ${i.file}${i.line != null ? `:${i.line}` : ''} [${i.code}] ${i.message}`,
    ),
  ].join('\n')
}

/**
 * Проверка: каждая объявленная в G_points строка предмета есть в слитом конфиге с тем же G.
 * Плюс счётчик: число объявлений G === сумма размеров gByMaterial по всем предметам.
 */
export function verifyGPointsCoverageInUi(built: BuiltSmithingDataset): {
  ok: boolean
  missing: string[]
  declaredCount: number
  configGCellCount: number
} {
  const missing: string[] = []
  for (const row of built.declaredGPoints) {
    const id = stableItemId(row.sectionId, row.keyEn)
    const item = built.items.find((i) => i.id === id)
    if (!item) {
      missing.push(
        `${row.file}:${row.lineNo} — материал "${row.materialId}", секция "${row.sectionId}", предмет "${row.keyEn}" (G=${row.g}): в конфиге нет объединённого предмета "${id}". Проверьте materials_suffixes.txt и совпадение секции с data_source/sources.`,
      )
      continue
    }
    if (item.gByMaterial[row.materialId] !== row.g) {
      missing.push(
        `${row.file}:${row.lineNo} — "${row.keyEn}" для "${row.materialId}": в G указано ${row.g}, в конфиге gByMaterial[${row.materialId}]=${String(item.gByMaterial[row.materialId])}.`,
      )
    }
  }

  const configGCellCount = built.items.reduce((s, i) => s + Object.keys(i.gByMaterial).length, 0)
  const declaredCount = built.declaredGPoints.length
  if (declaredCount !== configGCellCount) {
    missing.push(
      `Счётчики не сходятся: в G_points объявлено ${declaredCount} строк предметов (каждая строка с числом G), в конфиге всего ${configGCellCount} пар (предмет×материал) в gByMaterial. Возможны дубликаты строк в одном G-файле или рассинхрон генератора.`,
    )
  }

  return { ok: missing.length === 0, missing, declaredCount, configGCellCount }
}

export function formatGUiCoverageFailure(missing: string[]): string {
  if (missing.length === 0) return ''
  return ['Строки из G_points не полностью отражены в UI (слитом конфиге):', ...missing.map((m) => `  • ${m}`)].join(
    '\n',
  )
}

export function smithingDatasetHasErrors(issues: SmithingDatasetIssue[]): boolean {
  return issues.some((i) => i.severity === 'error')
}

export function formatSmithingIssuesForAssert(issues: SmithingDatasetIssue[]): string {
  return issues
    .map((i) => `[${i.severity}] ${i.file}${i.line != null ? `:${i.line}` : ''} (${i.code}) ${i.message}`)
    .join('\n')
}
