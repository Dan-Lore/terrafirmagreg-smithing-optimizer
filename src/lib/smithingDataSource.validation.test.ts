import { describe, expect, it } from 'vitest'
import {
  buildSmithingDatasetFromDataSource,
  formatSmithingIssuesForAssert,
} from './buildSmithingDatasetFromDataSource'
import { getDataSourceDir } from './test/dataSourcePaths'

const dataSourceDir = getDataSourceDir()

describe('data_source: валидация состава', () => {
  it('нет ошибок severity error (заголовки ↔ sources, G ↔ суффиксы, G в 0..150, непустой итог)', () => {
    const built = buildSmithingDatasetFromDataSource(dataSourceDir)
    const errors = built.issues.filter((i) => i.severity === 'error')

    expect(errors.length, errors.length > 0 ? formatSmithingIssuesForAssert(errors) : '').toBe(0)

    expect(built.materialIds.length).toBeGreaterThan(0)
    expect(built.items.length).toBeGreaterThan(0)
  })
})
