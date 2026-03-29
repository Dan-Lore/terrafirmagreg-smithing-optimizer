/**
 * Шаблон G_points - *.txt по структуре materials_suffixes.txt (заголовки секций + строки предметов).
 * После «=» в строках предметов ничего не подставляется — только вручную вписать число G.
 *
 * Запуск: npx tsx scripts/generate-g-points-template.ts "Wrought Iron"
 *         npm run generate-g-points-template -- "Copper"
 *
 * Опции: --stdout (только в консоль), --force (перезаписать существующий файл)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseBilingualSuffixLine, slugEn } from '../src/lib/smithingDataParse'
import { SMITHING_DATA_FILES } from '../src/lib/buildSmithingDatasetFromDataSource'

/** Как в готовых G_points: «English / Русский =123»; в шаблоне после «=» пусто. */
const TEMPLATE_LINE_SUFFIX = ' ='

function normalizeMaterialQuery(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

function findMaterialEnglishName(materialsText: string, query: string): string {
  const q = normalizeMaterialQuery(query)
  if (!q) {
    throw new Error('Укажите английское имя материала, как в data_source/materials (например: Wrought Iron).')
  }
  const qLower = q.toLowerCase()
  const qSlug = slugEn(q)
  for (const raw of materialsText.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^(.+?)\s*\/\s*(.+)$/)
    if (!m) continue
    const left = m[1]!.trim()
    if (left.toLowerCase() === qLower || slugEn(left) === qSlug) return left
  }
  throw new Error(
    `Материал «${q}» не найден в data_source/${SMITHING_DATA_FILES.materials}. Укажите левую часть строки до « / », как в манифесте.`,
  )
}

function buildTemplateLines(suffixText: string): string {
  const out: string[] = []
  for (const raw of suffixText.split(/\r?\n/)) {
    const trimmed = raw.trimEnd()
    if (trimmed === '') {
      out.push('')
      continue
    }
    const entry = parseBilingualSuffixLine(raw)
    if (entry) {
      out.push(`${entry.keyEn} / ${entry.labelRu}${TEMPLATE_LINE_SUFFIX}`)
    } else {
      out.push(trimmed)
    }
  }
  return out.join('\n') + (out.length > 0 ? '\n' : '')
}

function readUtf8(path: string, label: string): string {
  try {
    return readFileSync(path, 'utf8')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Не удалось прочитать «${label}» (${path}): ${msg}`)
  }
}

function main() {
  const argv = process.argv.slice(2)
  const toStdout = argv.includes('--stdout')
  const force = argv.includes('--force')
  const args = argv.filter((a) => !a.startsWith('--'))

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`Использование:
  tsx scripts/generate-g-points-template.ts "<English name as in materials>" [--stdout] [--force]

Пример:
  tsx scripts/generate-g-points-template.ts "Wrought Iron"

Создаётся data_source/G_points - <slug>.txt со строками из materials_suffixes.txt;
в строках предметов после «=» ничего нет — допишите число G.`)
    process.exit(0)
  }

  const root = process.cwd()
  const ds = resolve(root, 'data_source')
  const materialsPath = resolve(ds, SMITHING_DATA_FILES.materials)
  const suffixPath = resolve(ds, SMITHING_DATA_FILES.suffix)

  const materialsText = readUtf8(materialsPath, SMITHING_DATA_FILES.materials)
  const suffixText = readUtf8(suffixPath, SMITHING_DATA_FILES.suffix)

  const materialEn = findMaterialEnglishName(materialsText, args[0] ?? '')
  const slug = slugEn(materialEn)
  const fileName = `G_points - ${slug}.txt`
  const outPath = resolve(ds, fileName)

  const body = buildTemplateLines(suffixText)

  if (toStdout) {
    process.stdout.write(body)
    return
  }

  if (existsSync(outPath) && !force) {
    console.error(
      `Файл уже существует: ${outPath}\nИспользуйте --force для перезаписи или --stdout для вывода в консоль.`,
    )
    process.exit(1)
  }

  writeFileSync(outPath, body, 'utf8')
  console.log(`Written ${outPath} (материал: ${materialEn}, slug: ${slug})`)
}

try {
  main()
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
}
