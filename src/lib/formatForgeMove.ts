/** Форматирование одной дельты ковки для UI (совпадает с игровой записью +2, -15). */
export function formatForgeMove(delta: number): string {
  return delta >= 0 ? `+${delta}` : `${delta}`
}

/**
 * Последовательность для UI: подряд одинаковые команды схлопываются в «+16 x 2», «-3 x 3» и т.д.
 */
export function formatForgeMoveSequence(moves: number[]): string {
  if (moves.length === 0) return ''
  const parts: string[] = []
  let i = 0
  while (i < moves.length) {
    const d = moves[i]!
    let run = 1
    while (i + run < moves.length && moves[i + run] === d) run++
    const token = formatForgeMove(d)
    parts.push(run >= 2 ? `${token} x ${run}` : token)
    i += run
  }
  return parts.join(', ')
}
