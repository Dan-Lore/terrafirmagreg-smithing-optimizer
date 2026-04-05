import { describe, expect, it } from 'vitest'
import { formatForgeMove, formatForgeMoveSequence } from './formatForgeMove'

describe('formatForgeMove', () => {
  it('знак плюс для неотрицательных', () => {
    expect(formatForgeMove(16)).toBe('+16')
    expect(formatForgeMove(0)).toBe('+0')
  })
  it('отрицательные как есть', () => {
    expect(formatForgeMove(-15)).toBe('-15')
  })
})

describe('formatForgeMoveSequence', () => {
  it('пустой массив', () => {
    expect(formatForgeMoveSequence([])).toBe('')
  })
  it('одиночные шаги без изменений', () => {
    expect(formatForgeMoveSequence([16, -3, 2])).toBe('+16, -3, +2')
  })
  it('два и больше одинаковых подряд — x N', () => {
    expect(formatForgeMoveSequence([16, 16])).toBe('+16 x 2')
    expect(formatForgeMoveSequence([16, 16, 16])).toBe('+16 x 3')
    expect(formatForgeMoveSequence([-3, -3, -3])).toBe('-3 x 3')
  })
  it('смешанные серии', () => {
    expect(formatForgeMoveSequence([7, 7, -15, 2, 2])).toBe('+7 x 2, -15, +2 x 2')
  })
  it('одиночный после серии и наоборот', () => {
    expect(formatForgeMoveSequence([2, 2, 13])).toBe('+2 x 2, +13')
  })
})
