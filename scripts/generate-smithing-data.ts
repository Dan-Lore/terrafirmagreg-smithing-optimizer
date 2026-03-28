/**
 * Собирает src/generated/smithing-data.ts из data_source/
 * Запуск: npm run generate-smithing
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildSmithingDatasetFromDataSource,
  formatSmithingIssuesForAssert,
  smithingDatasetHasErrors,
  SMITHING_DATA_FILES,
} from '../src/lib/buildSmithingDatasetFromDataSource'

function main() {
  const root = process.cwd()
  const ds = resolve(root, 'data_source')

  const built = buildSmithingDatasetFromDataSource(ds)

  for (const i of built.issues) {
    if (i.severity === 'warn') {
      console.warn(`[${i.file}${i.line != null ? `:${i.line}` : ''}] ${i.message}`)
    }
  }

  if (smithingDatasetHasErrors(built.issues)) {
    console.error('Ошибки data_source (исправьте и повторите generate-smithing):\n')
    console.error(formatSmithingIssuesForAssert(built.issues.filter((x) => x.severity === 'error')))
    process.exit(1)
  }

  if (built.materialIds.length === 0 || built.items.length === 0) {
    console.error('Нет материалов или предметов после слияния.')
    process.exit(1)
  }

  const { materialsOutput, sourcesOutput, items } = built
  const MATERIALS_FILE = SMITHING_DATA_FILES.materials
  const SOURCES_FILE = SMITHING_DATA_FILES.sources
  const SUFFIX_FILE = SMITHING_DATA_FILES.suffix

  const outPath = resolve(root, 'src', 'generated', 'smithing-data.ts')
  const body = `/* eslint-disable */
// Автогенерация: scripts/generate-smithing-data.ts (npm run generate-smithing)
// Источники: data_source/${MATERIALS_FILE}, data_source/${SOURCES_FILE}, data_source/${SUFFIX_FILE}, data_source/G_points - *.txt

import type { ItemDef, MaterialDef, SmithingConfig, SourceDef } from '../config/smithing.types'

export const GENERATED_MATERIALS: MaterialDef[] = ${JSON.stringify(materialsOutput)} as const

export const GENERATED_SOURCES: SourceDef[] = ${JSON.stringify(sourcesOutput)} as const

export const GENERATED_ITEMS: ItemDef[] = ${JSON.stringify(items)} as const

export const GENERATED_SMITHING_CONFIG: SmithingConfig = {
  materials: GENERATED_MATERIALS,
  sources: GENERATED_SOURCES,
  items: GENERATED_ITEMS,
}
`
  writeFileSync(outPath, body, 'utf8')
  console.log(`Written ${outPath}`)
  console.log(`Materials: ${built.materialIds.join(', ')}`)
  console.log(`Items: ${items.length}`)
}

try {
  main()
} catch (e) {
  console.error(e)
  process.exit(1)
}
