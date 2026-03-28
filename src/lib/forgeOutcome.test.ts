import { describe, expect, it } from 'vitest'
import type { ItemDef } from '../config/smithing.types'
import { computeForgeOutcome, parseGField } from './forgeOutcome'
import { shortestPath, stateBeforeSuffix } from './pathfinding'

function item(partial: Partial<ItemDef> & Pick<ItemDef, 'suffix' | 'gByMaterial'>): ItemDef {
  return {
    sortIndex: 1,
    id: 'test_item',
    label: 'Тест',
    sourceId: 'ingot',
    ...partial,
  }
}

describe('parseGField', () => {
  it('ok для целого в диапазоне', () => {
    expect(parseGField(' 42 ')).toEqual({ ok: true, n: 42 })
    expect(parseGField('0')).toEqual({ ok: true, n: 0 })
    expect(parseGField('150')).toEqual({ ok: true, n: 150 })
  })
  it('empty', () => {
    expect(parseGField('')).toEqual({ ok: false, reason: 'empty' })
    expect(parseGField('   ')).toEqual({ ok: false, reason: 'empty' })
  })
  it('nan / notInt / outOfRange', () => {
    expect(parseGField('x')).toEqual({ ok: false, reason: 'nan' })
    expect(parseGField('3.5')).toEqual({ ok: false, reason: 'notInt' })
    expect(parseGField('-1')).toEqual({ ok: false, reason: 'outOfRange' })
    expect(parseGField('151')).toEqual({ ok: false, reason: 'outOfRange' })
  })
})

describe('computeForgeOutcome', () => {
  it('anyToG: кратчайший путь 0 → 2', () => {
    const r = computeForgeOutcome({
      mode: 'anyToG',
      parsedStart: parseGField('0'),
      parsedEnd: parseGField('2'),
      selectedItem: undefined,
      goalG: null,
      suffix: null,
    })
    expect(r.kind).toBe('ok')
    if (r.kind === 'ok') {
      expect(r.prefixMoves).toEqual([2])
      expect(r.mode).toBe('anyToG')
    }
  })

  it('anyToG: пустой старт — blocked', () => {
    const r = computeForgeOutcome({
      mode: 'anyToG',
      parsedStart: parseGField(''),
      parsedEnd: parseGField('10'),
      selectedItem: undefined,
      goalG: null,
      suffix: null,
    })
    expect(r.kind).toBe('blocked')
  })

  it('anyToG: неверная цель G — blocked', () => {
    const r = computeForgeOutcome({
      mode: 'anyToG',
      parsedStart: parseGField('0'),
      parsedEnd: parseGField('abc'),
      selectedItem: undefined,
      goalG: null,
      suffix: null,
    })
    expect(r.kind).toBe('blocked')
  })

  it('value: префикс от старта до s0 и полная последовательность ok', () => {
    const G = 10
    const suf = [2] as number[]
    const s0 = stateBeforeSuffix(G, suf)
    expect(shortestPath(0, s0)).not.toBeNull()

    const r = computeForgeOutcome({
      mode: 'value',
      parsedStart: parseGField('0'),
      parsedEnd: parseGField('99'),
      selectedItem: item({ suffix: suf, gByMaterial: { copper: G } }),
      goalG: G,
      suffix: suf,
    })
    expect(r.kind).toBe('ok')
    if (r.kind === 'ok') {
      expect(r.mode).toBe('value')
      expect(r.startState).toBe(0)
      expect(r.goalG).toBe(G)
      expect(r.prefixEnd).toBe(s0)
      expect(r.fullMoves).toEqual([...r.prefixMoves, ...suf])
    }
  })

  it('mark: старт = G рецепта, игнор некорректного поля «Старт»', () => {
    const G = 10
    const suf = [2] as number[]
    const s0 = stateBeforeSuffix(G, suf)

    const r = computeForgeOutcome({
      mode: 'mark',
      parsedStart: parseGField('not-a-number'),
      parsedEnd: parseGField('0'),
      selectedItem: item({ suffix: suf, gByMaterial: { copper: G } }),
      goalG: G,
      suffix: suf,
    })
    expect(r.kind).toBe('ok')
    if (r.kind === 'ok') {
      expect(r.mode).toBe('mark')
      expect(r.startState).toBe(G)
      expect(r.prefixEnd).toBe(s0)
    }
  })

  it('value: нет предмета — blocked', () => {
    const r = computeForgeOutcome({
      mode: 'value',
      parsedStart: parseGField('0'),
      parsedEnd: parseGField('1'),
      selectedItem: undefined,
      goalG: 5,
      suffix: [1],
    })
    expect(r.kind).toBe('blocked')
  })

  it('value: goalG null — blocked', () => {
    const r = computeForgeOutcome({
      mode: 'value',
      parsedStart: parseGField('0'),
      parsedEnd: parseGField('1'),
      selectedItem: item({ suffix: [1], gByMaterial: {} }),
      goalG: null,
      suffix: [1],
    })
    expect(r.kind).toBe('blocked')
  })

  it('value: пустой суффикс — blocked', () => {
    const r = computeForgeOutcome({
      mode: 'value',
      parsedStart: parseGField('0'),
      parsedEnd: parseGField('1'),
      selectedItem: item({ suffix: [], gByMaterial: { x: 1 } }),
      goalG: 1,
      suffix: [],
    })
    expect(r.kind).toBe('blocked')
  })

  it('value: состояние перед суффиксом вне 0..150 — blocked', () => {
    const r = computeForgeOutcome({
      mode: 'value',
      parsedStart: parseGField('0'),
      parsedEnd: parseGField('1'),
      selectedItem: item({ suffix: [100, 100], gByMaterial: { x: 50 } }),
      goalG: 50,
      suffix: [100, 100],
    })
    expect(r.kind).toBe('blocked')
  })

  it('value: пустое поле «Старт» — blocked', () => {
    const G = 10
    const suf = [2]
    const r = computeForgeOutcome({
      mode: 'value',
      parsedStart: parseGField(''),
      parsedEnd: parseGField('1'),
      selectedItem: item({ suffix: suf, gByMaterial: { x: G } }),
      goalG: G,
      suffix: suf,
    })
    expect(r.kind).toBe('blocked')
  })
})
