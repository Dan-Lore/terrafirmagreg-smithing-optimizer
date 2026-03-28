import { computed, ref, watch } from 'vue'
import {
  type ForgeMode,
  computeForgeOutcome,
  parseGField,
} from '../lib/forgeOutcome'
import {
  type ItemDef,
  type MaterialDef,
  type SourceId,
  itemsForMaterialAndSource,
  sortedMaterials,
  sortedSources,
} from '../config/smithing.config'
import type { ForgeResultPanelModel } from '../types/forgeResultPanelModel'

export function useForgeApp() {
  const materials = sortedMaterials()
  const sources = sortedSources()

  const selectedMaterialId = ref<string>(materials[0]?.id ?? '')
  const selectedSourceId = ref<SourceId>(sources[0]?.id ?? '')

  const itemList = computed(() =>
    itemsForMaterialAndSource(selectedMaterialId.value, selectedSourceId.value),
  )
  const selectedItemId = ref<string>('')

  watch(
    [itemList, selectedMaterialId, selectedSourceId],
    () => {
      const list = itemList.value
      if (list.length === 0) {
        selectedItemId.value = ''
        return
      }
      if (!list.some((i) => i.id === selectedItemId.value)) {
        selectedItemId.value = list[0]!.id
      }
    },
    { immediate: true },
  )

  const forgeMode = ref<ForgeMode>('value')
  const startValueInput = ref<string>('0')
  const endValueInput = ref<string>('150')

  const selectedMaterial = computed(
    (): MaterialDef | undefined => materials.find((m) => m.id === selectedMaterialId.value),
  )

  const selectedItem = computed((): ItemDef | undefined =>
    itemList.value.find((i) => i.id === selectedItemId.value),
  )

  function assetUrl(path: string): string {
    const p = path.startsWith('/') ? path.slice(1) : path
    return `${import.meta.env.BASE_URL}${p}`
  }

  const goalG = computed(() => {
    const item = selectedItem.value
    if (!item) return null
    const g = item.gByMaterial[selectedMaterialId.value]
    return typeof g === 'number' ? g : null
  })

  const selectedSuffix = computed((): number[] | null => {
    const s = selectedItem.value?.suffix
    if (s === null || s === undefined) return null
    return s
  })

  const TITLE_VALUE_ONLY_MATERIAL =
    'Смена сплава доступна только в режиме «Из любой точки в предмет»'
  const TITLE_VALUE_ONLY_START =
    'Поле «Старт» задано точкой G рецепта в режиме «Из точки G в предмет»'
  const TITLE_ANY_TO_G_FILTERS =
    'Материал, источник и предмет не используются в режиме «Из любой точки в точку G»'

  const parsedStartValue = computed(() => parseGField(startValueInput.value))
  const parsedEndValue = computed(() => parseGField(endValueInput.value))

  const outcome = computed(() =>
    computeForgeOutcome({
      mode: forgeMode.value,
      parsedStart: parsedStartValue.value,
      parsedEnd: parsedEndValue.value,
      selectedItem: selectedItem.value,
      goalG: goalG.value,
      suffix: selectedSuffix.value,
    }),
  )

  function formatMove(delta: number) {
    return delta >= 0 ? `+${delta}` : `${delta}`
  }

  const suffixFormatted = computed(() => {
    const s = selectedSuffix.value
    if (s === null || s.length === 0) return null
    return s.map(formatMove).join(', ')
  })

  const forgeResultPanelModel = computed(
    (): ForgeResultPanelModel => ({
      outcome: outcome.value,
      forgeMode: forgeMode.value,
      goalG: goalG.value,
      suffix: selectedSuffix.value,
      suffixFormatted: suffixFormatted.value,
      formatMove,
      selection: {
        material: selectedMaterial.value,
        sourceId: selectedSourceId.value,
        sources,
        item: selectedItem.value,
      },
    }),
  )

  return {
    materials,
    sources,
    selectedMaterialId,
    selectedSourceId,
    itemList,
    selectedItemId,
    forgeMode,
    startValueInput,
    endValueInput,
    assetUrl,
    TITLE_VALUE_ONLY_MATERIAL,
    TITLE_VALUE_ONLY_START,
    TITLE_ANY_TO_G_FILTERS,
    forgeResultPanelModel,
  }
}
