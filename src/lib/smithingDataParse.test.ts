import { describe, expect, it, vi } from 'vitest'
import {
  normalizeDataSourceIconPath,
  parseBilingualGLine,
  parseBilingualSuffixLine,
  parseMaterialsManifest,
  parseSectionedFile,
  parseSourcesManifest,
  resolveMaterialKeyEnFromQuery,
  slugEn,
  splitBilingualLine,
  stableItemId,
} from './smithingDataParse'

const SAMPLE_SOURCES = parseSourcesManifest(`ingot\t10\tСлиток\tIngot / Слиток:
rod\t20\tСтержень\tRod / Стержень:
`)

describe('splitBilingualLine', () => {
  it('делит по первому /', () => {
    expect(splitBilingualLine('A / B / C')).toEqual({ left: 'A', right: 'B / C' })
  })
})

describe('parseSourcesManifest', () => {
  it('читает табы и порядок секций', () => {
    const rows = parseSourcesManifest(`# c
ingot\t10\tСлиток\tIngot / Слиток:
rod\t20\tСтержень\tRod / Стержень:
`)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ id: 'ingot', sortIndex: 10, label: 'Слиток', headerLine: 'Ingot / Слиток:' })
  })
})

describe('parseMaterialsManifest', () => {
  it('slug, подпись и путь к иконке', () => {
    const rows = parseMaterialsManifest(`Copper / Медь = public/icons/material-copper.svg`)
    expect(rows).toEqual([
      {
        id: 'copper',
        keyEn: 'Copper',
        sortIndex: 10,
        label: 'Медь',
        icon: '/icons/material-copper.svg',
      },
    ])
  })
})

describe('resolveMaterialKeyEnFromQuery', () => {
  const manifest = `Copper / Медь = public/icons/material-copper.svg
Wrought Iron / Железо = public/icons/x.svg`

  it('по точному английскому имени и по slug', () => {
    expect(resolveMaterialKeyEnFromQuery(manifest, 'Copper')).toBe('Copper')
    expect(resolveMaterialKeyEnFromQuery(manifest, 'copper')).toBe('Copper')
    expect(resolveMaterialKeyEnFromQuery(manifest, 'wrought_iron')).toBe('Wrought Iron')
  })

  it('ошибка для неизвестного материала', () => {
    expect(() => resolveMaterialKeyEnFromQuery(manifest, 'Gold')).toThrow(/не найден/)
  })
})

describe('normalizeDataSourceIconPath', () => {
  it('Windows path и public/', () => {
    expect(normalizeDataSourceIconPath('public\\icons\\x.svg')).toBe('/icons/x.svg')
  })
})

describe('parseBilingualSuffixLine', () => {
  it('формат с =', () => {
    expect(parseBilingualSuffixLine('Axe Head / Оголовье топора = +13 -3 +2')).toEqual({
      keyEn: 'Axe Head',
      labelRu: 'Оголовье топора',
      deltas: [13, -3, 2],
    })
  })
  it('legacy без =', () => {
    expect(parseBilingualSuffixLine('Rod / Стержень -15')).toEqual({
      keyEn: 'Rod',
      labelRu: 'Стержень',
      deltas: [-15],
    })
  })
  it('null при мусоре', () => {
    expect(parseBilingualSuffixLine('no slash')).toBeNull()
  })
})

describe('parseBilingualGLine', () => {
  it('с =', () => {
    expect(parseBilingualGLine('Pickaxe Head / Оголовье кирки = 100')).toEqual({
      keyEn: 'Pickaxe Head',
      labelRu: 'Оголовье кирки',
      g: 100,
    })
  })
  it('без =', () => {
    expect(parseBilingualGLine('Chain / Цепь 87')).toEqual({
      keyEn: 'Chain',
      labelRu: 'Цепь',
      g: 87,
    })
  })
})

describe('slugEn / stableItemId', () => {
  it('slug', () => {
    expect(slugEn('Fish hook')).toBe('fish_hook')
  })
  it('stableItemId', () => {
    expect(stableItemId('ingot', 'Scythe Head')).toBe('ingot_scythe_head')
  })
})

describe('parseSectionedFile', () => {
  it('раскладывает строки по секциям из манифеста', () => {
    const rows: string[] = []
    parseSectionedFile(
      `Ingot / Слиток:
Foo / Бар = +2
Rod / Стержень:
Baz / Квук = -3
`,
      SAMPLE_SOURCES,
      (section, raw) => {
        rows.push(`${section}:${raw.trim()}`)
      },
    )
    expect(rows).toEqual(['ingot:Foo / Бар = +2', 'rod:Baz / Квук = -3'])
  })

  it('неизвестный заголовок X / Y: — предупреждение, секция не сбрасывается', () => {
    const warn = vi.fn()
    const rows: string[] = []
    parseSectionedFile(
      `Ingot / Слиток:
A / Б = +1
Weird / Странно:
B / В = +2
`,
      SAMPLE_SOURCES,
      (section, raw) => {
        rows.push(`${section}:${raw.trim()}`)
      },
      (w) => warn(w),
    )
    expect(warn).toHaveBeenCalled()
    expect(rows.some((r) => r.includes('Weird'))).toBe(false)
    expect(rows).toContain('ingot:B / В = +2')
  })
})
