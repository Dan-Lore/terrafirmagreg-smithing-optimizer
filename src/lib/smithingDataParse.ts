/**
 * Чистый разбор строк data_source (суффиксы, G, манифесты sources/materials).
 * Используется генератором и тестами.
 */

export type SourceManifestRow = {
  id: string
  sortIndex: number
  label: string
  /** Строка после trim должна совпадать с заголовком в materials_suffixes.txt */
  headerLine: string
}

export type MaterialManifestRow = {
  id: string
  sortIndex: number
  label: string
  /** Путь для UI, с ведущим слэшем, например /icons/material-copper.svg */
  icon: string
}

export type SuffixEntry = { keyEn: string; labelRu: string; deltas: number[] }

function parseTabbedRow(raw: string, minCols: number, ctx: string): string[] {
  const parts = raw.split('\t').map((s) => s.trim())
  if (parts.length < minCols) {
    throw new Error(`${ctx}: ожидалось минимум ${minCols} колонок (табуляция), строка: ${JSON.stringify(raw)}`)
  }
  return parts
}

/**
 * Файл data_source/sources: табы. Колонки: id, sortIndex, label, headerLine (остальное — часть последней колонки).
 */
export function parseSourcesManifest(text: string): SourceManifestRow[] {
  const rows: SourceManifestRow[] = []
  const seenId = new Set<string>()
  const seenHeader = new Set<string>()
  let lineNo = 0
  for (const raw of text.split(/\r?\n/)) {
    lineNo++
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const parts = parseTabbedRow(raw, 4, `sources:${lineNo}`)
    const id = parts[0]!
    const sortIndex = Number(parts[1])
    const label = parts[2]!
    const headerLine = parts.slice(3).join('\t').trim()
    if (!id || !Number.isFinite(sortIndex) || !label || !headerLine) {
      throw new Error(`sources:${lineNo}: пустые поля в строке ${JSON.stringify(raw)}`)
    }
    if (seenId.has(id)) throw new Error(`sources:${lineNo}: повтор id "${id}"`)
    if (seenHeader.has(headerLine)) throw new Error(`sources:${lineNo}: повтор заголовка "${headerLine}"`)
    seenId.add(id)
    seenHeader.add(headerLine)
    rows.push({ id, sortIndex, label, headerLine })
  }
  if (rows.length === 0) throw new Error('sources: нет ни одной строки (после комментариев и пустых)')
  return rows
}

/** Путь из data_source/materials: public/... или /icons/... → URL под Vite public/. */
export function normalizeDataSourceIconPath(raw: string): string {
  let p = raw.trim().replace(/\\/g, '/')
  if (p.startsWith('public/')) p = `/${p.slice('public/'.length)}`
  else if (!p.startsWith('/')) p = `/${p}`
  return p
}

/**
 * Файл data_source/materials: строки `English / Русский = путь_к_иконке`.
 * Порядок строк задаёт sortIndex (10, 20, …).
 */
export function parseMaterialsManifest(text: string): MaterialManifestRow[] {
  const rows: MaterialManifestRow[] = []
  let lineNo = 0
  let order = 0
  for (const raw of text.split(/\r?\n/)) {
    lineNo++
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const bi = splitBilingualLine(line)
    if (!bi) throw new Error(`materials:${lineNo}: ожидалось "English / Русский = ...", получено ${JSON.stringify(raw)}`)
    const rhs = bi.right
    const m = rhs.match(/^(.+?)\s*=\s*(.+)$/)
    if (!m) throw new Error(`materials:${lineNo}: после "/" ожидается "= путь к иконке", строка ${JSON.stringify(raw)}`)
    const label = m[1]!.trim()
    const icon = normalizeDataSourceIconPath(m[2]!)
    const id = slugEn(bi.left)
    if (!id) throw new Error(`materials:${lineNo}: пустой id после slug из "${bi.left}"`)
    order += 1
    rows.push({ id, sortIndex: order * 10, label, icon })
  }
  if (rows.length === 0) throw new Error('materials: нет ни одной строки')
  const ids = new Set(rows.map((r) => r.id))
  if (ids.size !== rows.length) throw new Error('materials: повторяющийся материал (одинаковый английский ключ)')
  return rows
}

export function splitBilingualLine(line: string): { left: string; right: string } | null {
  const m = line.match(/^(.+?)\s*\/\s*(.+)$/)
  if (!m) return null
  return { left: m[1]!.trim(), right: m[2]!.trim() }
}

function bilingualKeyRhs(raw: string): { keyEn: string; rhs: string } | null {
  const bi = splitBilingualLine(raw.trim())
  if (!bi) return null
  return { keyEn: bi.left, rhs: bi.right }
}

export function slugEn(en: string): string {
  return en
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export type SectionParseWarning = { lineNo: number; message: string }

/**
 * Разбор файла с секциями: заголовки задаются манифестом sources (точное совпадение строки после trim).
 * Строка вида «X / Y:», не из манифеста: вызывается `onWarning` (в `buildSmithingDatasetFromDataSource` это превращается в ошибку `UNKNOWN_SECTION_HEADER`).
 */
export function parseSectionedFile(
  content: string,
  sources: SourceManifestRow[],
  lineHandler: (sectionId: string, line: string, lineNo: number) => void,
  onWarning?: (w: SectionParseWarning) => void,
): void {
  const headerToId = new Map<string, string>()
  for (const s of sources) {
    headerToId.set(s.headerLine.trim(), s.id)
  }

  let section: string | null = null
  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!
    const trimmed = raw.trim()
    if (!trimmed) continue

    const sid = headerToId.get(trimmed)
    if (sid !== undefined) {
      section = sid
      continue
    }

    if (/^.+\/\s*.+:\s*$/.test(trimmed)) {
      onWarning?.({
        lineNo: i + 1,
        message: `Неизвестный заголовок секции (нет в data_source/sources): ${JSON.stringify(trimmed)}`,
      })
      continue
    }

    if (!section) continue
    lineHandler(section, raw, i + 1)
  }
}

export function parseBilingualSuffixLine(raw: string): SuffixEntry | null {
  const row = bilingualKeyRhs(raw)
  if (!row) return null
  const { keyEn, rhs } = row

  const eqForm = rhs.match(/^(.+?)\s*=\s*((?:[+-]\d+)(?:\s+[+-]\d+)*)\s*$/)
  if (eqForm) {
    const nums = eqForm[2]!.match(/[+-]\d+/g)
    if (!nums?.length) return null
    return {
      keyEn,
      labelRu: eqForm[1]!.trim(),
      deltas: nums.map((s) => parseInt(s, 10)),
    }
  }

  const tail = rhs.match(/^(.+?)\s+((?:[+-]\d+)(?:\s+[+-]\d+)*)\s*$/)
  if (!tail) return null
  const nums = tail[2]!.match(/[+-]\d+/g)
  if (!nums?.length) return null
  return {
    keyEn,
    labelRu: tail[1]!.trim(),
    deltas: nums.map((s) => parseInt(s, 10)),
  }
}

export function parseBilingualGLine(raw: string): { keyEn: string; labelRu: string; g: number } | null {
  const row = bilingualKeyRhs(raw)
  if (!row) return null
  const { keyEn, rhs } = row

  const eqForm = rhs.match(/^(.+?)\s*=\s*(\d+)\s*$/)
  if (eqForm) {
    return {
      keyEn,
      labelRu: eqForm[1]!.trim(),
      g: parseInt(eqForm[2]!, 10),
    }
  }

  const tail = rhs.match(/^(.+?)\s+(\d+)\s*$/)
  if (!tail) return null
  return {
    keyEn,
    labelRu: tail[1]!.trim(),
    g: parseInt(tail[2]!, 10),
  }
}

export function stableItemId(sectionId: string, keyEn: string): string {
  return `${sectionId}_${slugEn(keyEn)}`
}
