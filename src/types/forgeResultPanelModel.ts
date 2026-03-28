import type { ForgeMode, ForgeOutcome } from '../lib/forgeOutcome'
import type { ItemDef, MaterialDef, SourceDef, SourceId } from '../config/smithing.types'

/** Единая модель для блока результата ковки (меньше пропсов у компонента). */
export type ForgeResultPanelModel = {
  outcome: ForgeOutcome
  forgeMode: ForgeMode
  goalG: number | null
  suffix: number[] | null
  suffixFormatted: string | null
  formatMove: (d: number) => string
  selection: {
    material: MaterialDef | undefined
    sourceId: SourceId
    sources: SourceDef[]
    item: ItemDef | undefined
  }
}
