/**
 * Редактируйте data_source/*.txt и запускайте npm run generate-smithing.
 * См. scripts/generate-smithing-data.ts
 */

export type {
  ItemDef,
  MaterialDef,
  MaterialId,
  SmithingConfig,
  SourceDef,
  SourceId,
} from './smithing.types'

import type { ItemDef, MaterialDef, SmithingConfig, SourceDef, SourceId } from './smithing.types'
import { GENERATED_SMITHING_CONFIG } from '../generated/smithing-data'

export const SMITHING_CONFIG: SmithingConfig = GENERATED_SMITHING_CONFIG

function sortedBySortIndex<T extends { sortIndex: number }>(xs: T[]): T[] {
  return [...xs].sort((a, b) => a.sortIndex - b.sortIndex)
}

export function sortedMaterials(config: SmithingConfig = SMITHING_CONFIG): MaterialDef[] {
  return sortedBySortIndex(config.materials)
}

export function sortedSources(config: SmithingConfig = SMITHING_CONFIG): SourceDef[] {
  return sortedBySortIndex(config.sources)
}

/** Предметы для источника и материала: только с заданным G в data_source. По подписи для UI (кириллица). */
export function itemsForMaterialAndSource(
  materialId: string,
  source: SourceId,
  config: SmithingConfig = SMITHING_CONFIG,
): ItemDef[] {
  return config.items
    .filter((i) => i.sourceId === source && typeof i.gByMaterial[materialId] === 'number')
    .sort((a, b) => {
      const byLabel = a.label.localeCompare(b.label, 'ru', { sensitivity: 'base' })
      if (byLabel !== 0) return byLabel
      return a.id.localeCompare(b.id)
    })
}
