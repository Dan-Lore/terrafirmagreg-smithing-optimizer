import { describe, expect, it } from 'vitest'
import { MAX_G, MIN_G } from './commands'
import {
  concatMoves,
  isValidSuffixPath,
  shortestPath,
  stateBeforeSuffix,
  validateFullMoves,
} from './pathfinding'

describe('stateBeforeSuffix', () => {
  it('обратное снятие суффикса', () => {
    expect(stateBeforeSuffix(10, [2, 3])).toBe(5)
    expect(stateBeforeSuffix(0, [])).toBe(0)
  })
})

describe('isValidSuffixPath', () => {
  it('валидный путь к цели', () => {
    expect(isValidSuffixPath(5, 10, [2, 3])).toBe(true)
  })
  it('выход за границу', () => {
    expect(isValidSuffixPath(149, 150, [16])).toBe(false)
  })
})

describe('shortestPath', () => {
  it('старт = цель', () => {
    expect(shortestPath(7, 7)).toEqual({ steps: 0, moves: [] })
  })
  it('один шаг +2', () => {
    expect(shortestPath(0, 2)?.moves).toEqual([2])
  })
  it('вне диапазона', () => {
    expect(shortestPath(-1, 5)).toBeNull()
    expect(shortestPath(0, 151)).toBeNull()
  })
  it('все вершины достижимы из 0 в графе 0..150', () => {
    for (let g = MIN_G; g <= MAX_G; g++) {
      expect(shortestPath(0, g)).not.toBeNull()
    }
  })
})

describe('validateFullMoves', () => {
  it('пустая последовательность', () => {
    expect(validateFullMoves(42, [])).toBe(true)
  })
})

describe('concatMoves', () => {
  it('склейка', () => {
    expect(concatMoves([1], [2, 3])).toEqual([1, 2, 3])
  })
})
