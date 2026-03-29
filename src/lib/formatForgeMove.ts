/** Форматирование одной дельты ковки для UI (совпадает с игровой записью +2, -15). */
export function formatForgeMove(delta: number): string {
  return delta >= 0 ? `+${delta}` : `${delta}`
}
