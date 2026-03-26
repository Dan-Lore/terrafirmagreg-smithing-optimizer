<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAX_G, MIN_G } from './lib/commands'
import { PATHS } from './generated/paths'

const gInput = ref<string>('0')

const parsedG = computed(() => {
  const trimmed = gInput.value.trim()
  if (trimmed.length === 0) return { ok: false as const, reason: 'empty' as const }
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return { ok: false as const, reason: 'nan' as const }
  if (!Number.isInteger(n)) return { ok: false as const, reason: 'notInt' as const }
  if (n < MIN_G || n > MAX_G) return { ok: false as const, reason: 'outOfRange' as const, n }
  return { ok: true as const, n }
})

const result = computed(() => {
  if (!parsedG.value.ok) return null
  return PATHS[parsedG.value.n] ?? null
})

function formatMove(delta: number) {
  return delta >= 0 ? `+${delta}` : `${delta}`
}
</script>

<template>
  <main class="page">
    <section class="card">
      <header class="header">
        <h1 class="title">Точка G</h1>
        <p class="subtitle">
          Минимальная последовательность команд, чтобы из <b>0</b> попасть в <b>G</b> не выходя за
          диапазон <b>0..150</b>.
        </p>
      </header>

      <div class="form">
        <label class="label" for="g">Целевая точка G (0..150)</label>
        <div class="row">
          <input
            id="g"
            v-model="gInput"
            inputmode="numeric"
            class="input"
            placeholder="Например: 42"
            aria-describedby="g-help"
          />
          <span class="badge">команд: 8</span>
        </div>
        <div id="g-help" class="help">
          Доступные команды: +2, +7, +13, +16, -3, -6, -9, -15
        </div>
      </div>

      <section class="result" aria-live="polite">
        <template v-if="!parsedG.ok">
          <p class="muted" v-if="parsedG.reason === 'empty'">Введите целое число.</p>
          <p class="muted" v-else-if="parsedG.reason === 'nan'">Это не похоже на число.</p>
          <p class="muted" v-else-if="parsedG.reason === 'notInt'">Нужно целое число.</p>
          <p class="muted" v-else>G должно быть в диапазоне 0..150.</p>
        </template>

        <template v-else>
          <template v-if="result === null">
            <p class="muted">
              Для G={{ parsedG.n }} решения нет при ограничении на диапазон 0..150.
            </p>
          </template>
          <template v-else>
            <div class="summary">
              <div class="pill">
                Минимум шагов: <b>{{ result.steps }}</b>
              </div>
              <div class="pill ok">
                Достижимо: <b>да</b>
              </div>
            </div>

            <div class="sequence">
              <div class="seqTitle">Последовательность команд</div>
              <code class="seqCode">
                <span v-if="result.moves.length === 0">— (уже в 0)</span>
                <span v-else>
                  {{ result.moves.map(formatMove).join(', ') }}
                </span>
              </code>
            </div>
          </template>
        </template>
      </section>
    </section>

    <footer class="footer">
      <span class="muted">Данные предвычислены одним запуском скрипта и сохранены в проекте.</span>
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
  width: min(860px, 100%);
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

.form {
  display: grid;
  gap: 8px;
}

.label {
  font-weight: 600;
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input {
  flex: 1;
  height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.28);
  color: var(--text);
  outline: none;
}

.input:focus {
  border-color: rgba(124, 58, 237, 0.7);
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.18);
}

.badge {
  user-select: none;
  border-radius: 999px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 12px;
}

.help {
  color: var(--muted);
  font-size: 13px;
}

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

.footer {
  width: min(860px, 100%);
  display: flex;
  justify-content: center;
  padding: 8px 4px;
}
</style>

