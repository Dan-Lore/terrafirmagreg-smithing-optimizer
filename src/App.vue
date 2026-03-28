<script setup lang="ts">
import { computed } from 'vue'
import ForgeResultPanel from './components/ForgeResultPanel.vue'
import { useForgeApp } from './composables/useForgeApp'
import { DATA_SOURCE_DIR, NPM_GENERATE_SMITHING } from './lib/forgeUiCopy'

const {
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
} = useForgeApp()

const modeAnyToG = computed(() => forgeMode.value === 'anyToG')
const modeMark = computed(() => forgeMode.value === 'mark')
const materialLocked = computed(() => modeMark.value || modeAnyToG.value)
const sourceLocked = computed(() => modeAnyToG.value)
const itemSelectLocked = computed(() => modeAnyToG.value || itemList.value.length === 0)
const titleMaterialGroup = computed(() =>
  modeAnyToG.value ? TITLE_ANY_TO_G_FILTERS : modeMark.value ? TITLE_VALUE_ONLY_MATERIAL : undefined,
)
const titleWhenAnyToG = computed(() => (modeAnyToG.value ? TITLE_ANY_TO_G_FILTERS : undefined))
</script>

<template>
  <main class="page">
    <section class="card">
      <header class="header">
        <h1 class="title">Ковка — точка G</h1>
        <p class="subtitle">
          Те же команды и ограничение <b>0..150</b> на каждом шаге. Полная ковка: кратчайший префикс до состояния перед
          суффиксом, затем <b>суффикс предмета</b>. Данные в <code class="inlineHint">{{ DATA_SOURCE_DIR }}</code> (английский ключ /
          русская подпись) → <code class="inlineHint">{{ NPM_GENERATE_SMITHING }}</code>.
        </p>
      </header>

      <div class="filters">
        <div class="filterBlock">
          <div class="filterLabel">Режим ковки</div>
          <div class="modeInline" role="group" aria-label="Режим ковки">
            <label
              class="filterTile filterTile--mode"
              :class="{ active: modeAnyToG }"
            >
              <input v-model="forgeMode" type="radio" class="tileRadio" value="anyToG" />
              <span>Из любой точки в точку G</span>
            </label>
            <label
              class="filterTile filterTile--mode"
              :class="{ active: modeMark }"
            >
              <input v-model="forgeMode" type="radio" class="tileRadio" value="mark" />
              <span>Из точки G в предмет</span>
            </label>
            <label
              class="filterTile filterTile--mode"
              :class="{ active: forgeMode === 'value' }"
            >
              <input v-model="forgeMode" type="radio" class="tileRadio" value="value" />
              <span>Из любой точки в предмет</span>
            </label>
            <div
              class="filterTile filterTile--start"
              :class="{ filterTileMuted: modeMark }"
              :title="modeMark ? TITLE_VALUE_ONLY_START : undefined"
            >
              <label class="startLabel" for="startVal">Старт (0..150)</label>
              <input
                id="startVal"
                v-model="startValueInput"
                class="startInput"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                :disabled="modeMark"
                :aria-disabled="modeMark"
              />
            </div>
            <div
              v-show="modeAnyToG"
              class="filterTile filterTile--start"
            >
              <label class="startLabel" for="endVal">Цель G (0..150)</label>
              <input
                id="endVal"
                v-model="endValueInput"
                class="startInput"
                type="text"
                inputmode="numeric"
                autocomplete="off"
              />
            </div>
          </div>
          <p v-if="modeAnyToG" class="modeHint" aria-live="polite">
            Кратчайший путь в графе <b>0..150</b> от «Старт» до «Цель G». Предмет и суффикс не используются.
          </p>
          <p v-else-if="modeMark" class="modeHint" aria-live="polite">
            Префикс стартует от <b>G</b> выбранного рецепта, затем суффикс предмета.
          </p>
          <p v-else class="modeHint" aria-live="polite">
            Префикс от числа в поле «Старт» (по умолчанию <b>0</b>) до состояния перед суффиксом, затем суффикс предмета.
            Можно сменить материал и источник.
          </p>
        </div>

        <div class="filterBlock">
          <div class="filterLabel">Материал</div>
          <div
            class="tileRow"
            role="group"
            aria-label="Материал"
            :title="titleMaterialGroup"
          >
            <button
              v-for="m in materials"
              :key="m.id"
              type="button"
              class="filterTile filterTile--material"
              :class="{
                active: selectedMaterialId === m.id,
                filterTileMuted: materialLocked,
              }"
              :disabled="materialLocked"
              :aria-disabled="materialLocked"
              @click="selectedMaterialId = m.id"
            >
              <img class="tileIcon" :src="assetUrl(m.icon)" width="28" height="28" alt="" />
              <span>{{ m.label }}</span>
            </button>
          </div>
        </div>

        <div class="filterBlock">
          <div class="filterLabel">Из чего куём</div>
          <div
            class="tileRow"
            :title="titleWhenAnyToG"
          >
            <button
              v-for="s in sources"
              :key="s.id"
              type="button"
              class="filterTile filterTile--source"
              :class="{ active: selectedSourceId === s.id, filterTileMuted: sourceLocked }"
              :disabled="sourceLocked"
              :aria-disabled="sourceLocked"
              @click="selectedSourceId = s.id"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <div class="filterBlock">
          <div class="filterLabel">Что куём</div>
          <div
            class="selectShell"
            :class="{ filterTileMuted: modeAnyToG }"
            :title="titleWhenAnyToG"
          >
            <select
              id="item"
              v-model="selectedItemId"
              class="filterTile filterSelect"
              :disabled="itemSelectLocked"
              :aria-disabled="itemSelectLocked"
            >
              <option v-if="itemList.length === 0" value="" disabled>Нет предметов для этой пары</option>
              <option v-for="it in itemList" :key="it.id" :value="it.id">
                {{ it.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <ForgeResultPanel :model="forgeResultPanelModel" />
    </section>

    <footer class="footer">
      <span class="muted">
        Данные ковки: <code class="inlineHint">{{ DATA_SOURCE_DIR }}</code> → <code class="inlineHint">{{ NPM_GENERATE_SMITHING }}</code>
        · префикс — BFS в графе 0..150; таблица <code class="inlineHint">paths.ts</code> (после <code class="inlineHint">npm run precompute</code>) сверяется с BFS в тестах.
      </span>
    </footer>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px 16px;
  gap: 16px;
}

.card {
  width: min(920px, 100%);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 22px;
  backdrop-filter: blur(14px);
}

.header {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}

.title {
  font-size: 28px;
  line-height: 1.1;
  margin: 0;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0;
  color: var(--muted);
}

.filters {
  display: grid;
  gap: 16px;
}

.filterBlock {
  display: grid;
  gap: 8px;
}

.filterLabel {
  font-weight: 650;
  font-size: 13px;
  color: var(--muted);
}

.inlineHint {
  font-size: 0.92em;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--border);
}

.tileRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: stretch;
}

.modeInline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: stretch;
  min-height: 46px;
}

.filterTile {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  min-height: 44px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.28);
  color: var(--text);
  font: inherit;
  cursor: pointer;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.filterTile.active {
  border-color: rgba(124, 58, 237, 0.7);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.18);
}

.filterTileMuted,
.filterTile:disabled {
  opacity: 0.48;
  cursor: not-allowed;
  box-shadow: none;
}

.filterTile--mode {
  cursor: pointer;
  user-select: none;
}

.filterTile--start {
  gap: 10px;
  flex: 1 1 160px;
  min-width: min(220px, 100%);
  cursor: default;
}

.filterTile--material {
  border-radius: 12px;
}

.tileIcon {
  border-radius: 8px;
  display: block;
  flex-shrink: 0;
}

.tileRadio {
  margin: 0;
  accent-color: #7c3aed;
}

.startLabel {
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
}

.startInput {
  width: 72px;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.35);
  color: var(--text);
  font: inherit;
}

.startInput:focus:not(:disabled) {
  outline: none;
  border-color: rgba(124, 58, 237, 0.75);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.startInput:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.selectShell {
  max-width: 100%;
}

.filterSelect {
  width: 100%;
  max-width: 520px;
  display: block;
  cursor: pointer;
  appearance: none;
  padding-right: 36px;
  background-color: rgba(0, 0, 0, 0.28);
  background-image: linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.5) 50%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.5) 50%, transparent 50%);
  background-position: calc(100% - 18px) calc(50% - 3px), calc(100% - 12px) calc(50% - 3px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

.filterSelect:focus {
  outline: none;
  border-color: rgba(124, 58, 237, 0.75);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.18);
}

.filterSelect option {
  background: #0f172a;
  color: rgba(255, 255, 255, 0.95);
}

.modeHint {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.muted {
  color: var(--muted);
}

.footer {
  width: min(920px, 100%);
  display: flex;
  justify-content: center;
  padding: 8px 4px;
}
</style>
