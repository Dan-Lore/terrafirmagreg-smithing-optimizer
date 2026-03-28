import { COMMANDS, MAX_G, MIN_G } from './commands'

export type PathResult = { steps: number; moves: number[] }

/**
 * Состояние непосредственно перед применением суффикса (последовательность префикса заканчивается здесь).
 * Для целевой точки G и суффикса [d1..dk]: s0 + d1 + ... + dk = G ⇒ s0 = G с обратным вычитанием dk..d1.
 */
export function stateBeforeSuffix(goalG: number, suffix: number[]): number {
  let x = goalG
  for (let i = suffix.length - 1; i >= 0; i--) {
    x -= suffix[i]!
  }
  return x
}

/** Последовательное применение дельт; false, если любой шаг выходит за [MIN_G, MAX_G]. */
function applyDeltasInRange(start: number, deltas: number[]): { ok: true; x: number } | { ok: false } {
  let x = start
  for (const d of deltas) {
    x += d
    if (x < MIN_G || x > MAX_G) return { ok: false }
  }
  return { ok: true, x }
}

/** Проверка, что применение суффикса из начального состояния не выходит за 0..150 и заканчивается в goalG. */
export function isValidSuffixPath(start: number, goalG: number, suffix: number[]): boolean {
  const r = applyDeltasInRange(start, suffix)
  return r.ok && r.x === goalG
}

/** Проверка полной последовательности (префикс + суффикс) от startState. */
export function validateFullMoves(startState: number, moves: number[]): boolean {
  return applyDeltasInRange(startState, moves).ok
}

/**
 * Кратчайший путь по числу шагов (BFS) в графе 0..150 с рёбрами из COMMANDS.
 */
export function shortestPath(start: number, goal: number): PathResult | null {
  if (start < MIN_G || start > MAX_G || goal < MIN_G || goal > MAX_G) return null
  if (start === goal) return { steps: 0, moves: [] }

  const size = MAX_G - MIN_G + 1
  const dist = Array<number>(size).fill(Number.POSITIVE_INFINITY)
  const prev = Array<number>(size).fill(-1)
  const move = Array<number>(size).fill(0)

  const q: number[] = []
  dist[start] = 0
  q.push(start)

  for (let qi = 0; qi < q.length; qi++) {
    const x = q[qi]!
    const xDist = dist[x]!
    if (x === goal) break
    for (const delta of COMMANDS) {
      const y = x + delta
      if (y < MIN_G || y > MAX_G) continue
      if (dist[y] !== Number.POSITIVE_INFINITY) continue
      dist[y] = xDist + 1
      prev[y] = x
      move[y] = delta
      q.push(y)
    }
  }

  if (dist[goal] === Number.POSITIVE_INFINITY) return null

  const moves: number[] = []
  let cur = goal
  while (cur !== start) {
    const d = move[cur]!
    moves.push(d)
    cur = prev[cur]!
    if (cur < 0) break
  }
  moves.reverse()
  return { steps: moves.length, moves }
}

export function concatMoves(prefix: number[], suffix: number[]): number[] {
  return [...prefix, ...suffix]
}
