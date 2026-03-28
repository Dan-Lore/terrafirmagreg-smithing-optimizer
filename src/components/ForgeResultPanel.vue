<script setup lang="ts">
import { RESULT_PANEL_FILES_HINT } from '../lib/forgeUiCopy'
import type { ForgeResultPanelModel } from '../types/forgeResultPanelModel'

defineProps<{
  model: ForgeResultPanelModel
}>()
</script>

<template>
  <section class="result" aria-live="polite">
    <template v-if="model.outcome.kind === 'blocked'">
      <p class="muted">{{ model.outcome.message }}</p>
    </template>

    <template v-else>
      <div class="metaGrid">
        <div class="meta">
          <div class="metaK">Данные</div>
          <div class="metaV">
            <span class="fileHint">{{ RESULT_PANEL_FILES_HINT }}</span>
          </div>
        </div>
        <div class="meta">
          <div class="metaK">Выбор</div>
          <div class="metaV">
            <template v-if="model.forgeMode === 'anyToG'">— <span class="metaNote">(не используется)</span></template>
            <template v-else>
              {{ model.selection.material?.label }} ·
              {{ model.selection.sources.find((s) => s.id === model.selection.sourceId)?.label }} ·
              {{ model.selection.item?.label }}
            </template>
          </div>
        </div>
        <div class="meta">
          <div class="metaK">G</div>
          <div class="metaV">
            <template v-if="model.forgeMode === 'anyToG'">
              <template v-if="model.outcome.kind === 'ok'">
                <b>{{ model.outcome.goalG }}</b>
                <span class="metaNote"> (цель пути)</span>
              </template>
              <template v-else>—</template>
            </template>
            <template v-else-if="model.goalG === null">— (заглушка)</template>
            <template v-else>
              <b>{{ model.goalG }}</b>
            </template>
          </div>
        </div>
        <div class="meta">
          <div class="metaK">Суффикс предмета</div>
          <div class="metaV">
            <template v-if="model.forgeMode === 'anyToG'">— <span class="metaNote">(режим без предмета)</span></template>
            <template v-else-if="model.suffix === null || (model.suffix && model.suffix.length === 0)">
              — (заглушка)
            </template>
            <template v-else>
              <code class="inlineCode">{{ model.suffixFormatted }}</code>
            </template>
          </div>
        </div>
      </div>

      <template v-if="model.outcome.kind === 'ok'">
        <div class="summary">
          <template v-if="model.outcome.mode === 'anyToG'">
            <div class="pill">Шагов: <b>{{ model.outcome.totalSteps }}</b></div>
            <div class="pill ok">Достижимо: <b>да</b></div>
          </template>
          <template v-else>
            <div class="pill">Шагов префикса: <b>{{ model.outcome.prefixSteps }}</b></div>
            <div class="pill">Всего шагов: <b>{{ model.outcome.totalSteps }}</b></div>
            <div class="pill ok">Достижимо: <b>да</b></div>
          </template>
        </div>

        <div class="detail">
          <div v-if="model.outcome.mode === 'anyToG'" class="detailLine">
            Кратчайший путь: <b>{{ model.outcome.startState }}</b> → <b>{{ model.outcome.goalG }}</b>
          </div>
          <div v-else class="detailLine">
            Старт режима: <b>{{ model.outcome.startState }}</b> → перед суффиксом нужно попасть в
            <b>{{ model.outcome.prefixEnd }}</b>
          </div>
        </div>

        <div class="sequence">
          <div class="seqTitle">{{ model.outcome.mode === 'anyToG' ? 'Путь (минимум шагов)' : 'Префикс (минимум шагов)' }}</div>
          <code class="seqCode">
            <span v-if="model.outcome.prefixMoves.length === 0">— (пусто)</span>
            <span v-else>{{ model.outcome.prefixMoves.map(model.formatMove).join(', ') }}</span>
          </code>
        </div>

        <div v-if="model.outcome.mode !== 'anyToG'" class="sequence">
          <div class="seqTitle">Суффикс</div>
          <code class="seqCode suffix">
            {{ model.outcome.suffix.map(model.formatMove).join(', ') }}
          </code>
        </div>

        <div v-if="model.outcome.mode !== 'anyToG'" class="sequence">
          <div class="seqTitle">Полная последовательность</div>
          <code class="seqCode">
            <span v-if="model.outcome.fullMoves.length === 0">—</span>
            <span v-else>{{ model.outcome.fullMoves.map(model.formatMove).join(', ') }}</span>
          </code>
        </div>
      </template>
    </template>
  </section>
</template>

<style scoped>
.result {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: grid;
  gap: 14px;
}

.muted {
  color: var(--muted);
  margin: 0;
}

.metaGrid {
  display: grid;
  gap: 10px;
}

.meta {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 10px;
  align-items: start;
}

.metaK {
  color: var(--muted);
  font-size: 13px;
}

.metaV {
  font-size: 14px;
}

.metaNote {
  font-size: 12px;
  color: var(--muted);
  font-weight: normal;
}

.fileHint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}

.inlineCode {
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.28);
}

.summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.22);
}

.pill.ok {
  border-color: rgba(34, 197, 94, 0.45);
}

.detail {
  color: var(--muted);
  font-size: 13px;
}

.detailLine {
  margin: 0;
}

.sequence {
  display: grid;
  gap: 8px;
}

.seqTitle {
  font-weight: 600;
}

.seqCode {
  display: block;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.28);
  white-space: pre-wrap;
  word-break: break-word;
}

.seqCode.suffix {
  border-color: rgba(245, 158, 11, 0.45);
  background: rgba(245, 158, 11, 0.08);
}
</style>
