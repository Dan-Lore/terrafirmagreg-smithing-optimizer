/**
 * Шаблон G_points - *.txt по структуре materials_suffixes.txt (заголовки секций + строки предметов).
 * После «=» в строках предметов ничего не подставляется — только вручную вписать число G.
 *
 * Запуск: npx tsx scripts/generate-g-points-template.ts "Wrought Iron"
 *         npm run generate-g-points-template -- "Copper"
 *
 * Опции: --stdout (только в консоль), --force (перезаписать существующий файл)
 */
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SMITHING_DATA_FILES } from '../src/lib/buildSmithingDatasetFromDataSource'
import { readUtf8OrThrow } from '../src/lib/readRepoUtf8'
import { parseBilingualSuffixLine, resolveMaterialKeyEnFromQuery, slugEn } from '../src/lib/smithingDataParse'

/** Как в готовых G_points: «English / Русский =123»; в шаблоне после «=» пусто. */
const TEMPLATE_LINE_SUFFIX = ' ='

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

  const materialsText = readUtf8OrThrow(materialsPath, SMITHING_DATA_FILES.materials)
  const suffixText = readUtf8OrThrow(suffixPath, SMITHING_DATA_FILES.suffix)

  const materialEn = resolveMaterialKeyEnFromQuery(materialsText, args[0] ?? '')
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
