import { describe, expect, it } from 'vitest'
import { PATHS } from '../generated/paths'
import { MAX_G, MIN_G } from './commands'
import { shortestPath } from './pathfinding'

/** Таблица `paths.ts` должна совпадать с BFS из нуля (как в `precompute-paths.ts`). */
describe('PATHS согласован с shortestPath(0, g)', () => {
  it.each(
    Array.from({ length: MAX_G - MIN_G + 1 }, (_, i) => MIN_G + i),
  )('цель g=%i', (g) => {
    const pre = PATHS[g]
    const live = shortestPath(0, g)
    if (pre === null) {
      expect(live).toBeNull()
    } else {
      expect(live).not.toBeNull()
      expect(live!.steps).toBe(pre.steps)
      expect(live!.moves).toEqual([...pre.moves])
    }
  })
})
