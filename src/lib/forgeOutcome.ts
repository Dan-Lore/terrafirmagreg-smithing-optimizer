import type { ItemDef } from '../config/smithing.types'
import { MAX_G, MIN_G } from './commands'
import {
  concatMoves,
  isValidSuffixPath,
  shortestPath,
  stateBeforeSuffix,
  validateFullMoves,
} from './pathfinding'

export type ForgeMode = 'anyToG' | 'mark' | 'value'

export type ParseGResult =
  | { ok: true; n: number }
  | { ok: false; reason: 'empty' | 'nan' | 'notInt' | 'outOfRange' }

export function parseGField(raw: string): ParseGResult {
  const t = raw.trim()
  if (t.length === 0) return { ok: false as const, reason: 'empty' as const }
  const n = Number(t)
  if (!Number.isFinite(n)) return { ok: false as const, reason: 'nan' as const }
  if (!Number.isInteger(n)) return { ok: false as const, reason: 'notInt' as const }
  if (n < MIN_G || n > MAX_G) return { ok: false as const, reason: 'outOfRange' as const }
  return { ok: true as const, n }
}

export type ForgeOutcome =
  | { kind: 'blocked'; message: string }
  | {
      kind: 'ok'
      goalG: number
      prefixEnd: number
      suffix: number[]
      prefixMoves: number[]
      fullMoves: number[]
      prefixSteps: number
      totalSteps: number
      mode: ForgeMode
      startState: number
    }

export type ComputeForgeOutcomeInput = {
  mode: ForgeMode
  parsedStart: ParseGResult
  parsedEnd: ParseGResult
  selectedItem: ItemDef | undefined
  goalG: number | null
  suffix: number[] | null
}

function computeAnyToG(input: ComputeForgeOutcomeInput): ForgeOutcome {
  const { parsedStart, parsedEnd } = input
  if (!parsedStart.ok) {
    return { kind: 'blocked', message: 'Введите целое число 0..150 для стартовой точки.' }
  }
  if (!parsedEnd.ok) {
    return { kind: 'blocked', message: 'Введите целое число 0..150 для целевой точки G.' }
  }
  const startState = parsedStart.n
  const goal = parsedEnd.n
  const p = shortestPath(startState, goal)
  if (p === null) {
    return {
      kind: 'blocked',
      message: `От ${startState} до ${goal} нет пути в пределах 0..150.`,
    }
  }
  // Ходы из shortestPath уже по допустимым рёбрам графа 0..150
  return {
    kind: 'ok',
    goalG: goal,
    prefixEnd: goal,
    suffix: [],
    prefixMoves: p.moves,
    fullMoves: p.moves,
    prefixSteps: p.moves.length,
    totalSteps: p.moves.length,
    mode: 'anyToG',
    startState,
  }
}

/** Общая проверка рецепта и расчёт префикса для режимов «из G» / «из значения». */
function computeMarkOrValue(mode: 'mark' | 'value', input: ComputeForgeOutcomeInput): ForgeOutcome {
  const { parsedStart, selectedItem, goalG: gRecipe, suffix: suf } = input

  if (!selectedItem) {
    return {
      kind: 'blocked',
      message:
        'Нет предметов для выбранной пары «материал + источник». Допишите G в data_source или выберите другой источник.',
    }
  }

  const g = gRecipe
  if (g === null) {
    return { kind: 'blocked', message: 'Для выбранной пары материал + предмет точка G не задана в конфиге (null).' }
  }
  if (suf === null || suf.length === 0) {
    return {
      kind: 'blocked',
      message:
        'Суффикс для выбранного предмета не задан в конфиге. Задайте массив команд (1–3 шага) или временную заглушку.',
    }
  }

  const prefixEnd = stateBeforeSuffix(g, suf)
  if (prefixEnd < MIN_G || prefixEnd > MAX_G) {
    return {
      kind: 'blocked',
      message: `Вычисленное состояние перед суффиксом (${prefixEnd}) вне диапазона 0..150 — проверьте G и суффикс в конфиге.`,
    }
  }
  if (!isValidSuffixPath(prefixEnd, g, suf)) {
    return { kind: 'blocked', message: 'Суффикс не приводит к выбранной точке G при ограничении 0..150.' }
  }

  let startState: number
  if (mode === 'mark') {
    startState = g
  } else {
    if (!parsedStart.ok) {
      return { kind: 'blocked', message: 'Введите целое число 0..150 для стартовой точки.' }
    }
    startState = parsedStart.n
  }

  const p = shortestPath(startState, prefixEnd)
  if (p === null) {
    const msg =
      mode === 'mark'
        ? `От метки G=${g} до состояния перед суффиксом (${prefixEnd}) нет пути в пределах 0..150.`
        : `От ${startState} до состояния перед суффиксом (${prefixEnd}) нет пути в пределах 0..150.`
    return { kind: 'blocked', message: msg }
  }
  const prefixMoves = p.moves

  const full = concatMoves(prefixMoves, suf)
  if (!validateFullMoves(startState, full)) {
    return { kind: 'blocked', message: 'Полная последовательность выходит за пределы 0..150 на каком-то шаге.' }
  }

  return {
    kind: 'ok',
    goalG: g,
    prefixEnd,
    suffix: suf,
    prefixMoves,
    fullMoves: full,
    prefixSteps: prefixMoves.length,
    totalSteps: full.length,
    mode,
    startState,
  }
}

/** Расширяемость: новый режим — новая запись без правки `computeForgeOutcome`. */
export const computeForgeOutcomeByMode: Record<
  ForgeMode,
  (input: ComputeForgeOutcomeInput) => ForgeOutcome
> = {
  anyToG: computeAnyToG,
  mark: (input) => computeMarkOrValue('mark', input),
  value: (input) => computeMarkOrValue('value', input),
}

export function computeForgeOutcome(input: ComputeForgeOutcomeInput): ForgeOutcome {
  return computeForgeOutcomeByMode[input.mode](input)
}
