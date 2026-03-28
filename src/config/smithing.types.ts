/**
 * Типы конфигурации ковки. Данные генерируются в src/generated/smithing-data.ts
 */

export type MaterialId = string

/** Идентификатор источника (секции ковки), задаётся в data_source/sources */
export type SourceId = string

export interface MaterialDef {
  sortIndex: number
  id: MaterialId
  label: string
  /** Путь относительно public/, например /icons/material-copper.svg */
  icon: string
}

export interface SourceDef {
  sortIndex: number
  id: SourceId
  label: string
}

export interface ItemDef {
  sortIndex: number
  id: string
  label: string
  sourceId: SourceId
  /** Суффикс ковки (последние команды). Пустой массив — нет данных в materials_suffixes.txt */
  suffix: number[] | null
  /**
   * G по материалам: только там, где в G_points есть числовое значение.
   * Пары без рецепта в файле материала не попадают в список для этого материала.
   */
  gByMaterial: Partial<Record<MaterialId, number>>
}

export interface SmithingConfig {
  materials: MaterialDef[]
  sources: SourceDef[]
  items: ItemDef[]
}
