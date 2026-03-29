import { describe, expect, it } from 'vitest'
import {
  buildSmithingDatasetFromDataSource,
  formatGUiCoverageFailure,
  formatSmithingIssuesForAssert,
  verifyGPointsCoverageInUi,
} from './buildSmithingDatasetFromDataSource'
import { getDataSourceDir } from './test/dataSourcePaths'

const dataSourceDir = getDataSourceDir()

describe('data_source: G_points → UI (слитый конфиг)', () => {
  it('каждая строка предмета в G_points (не заголовок) отражена в конфиге; счётчик строк G = числу пар в gByMaterial', () => {
    const built = buildSmithingDatasetFromDataSource(dataSourceDir)
    const errors = built.issues.filter((i) => i.severity === 'error')
    expect(errors.length, errors.length > 0 ? formatSmithingIssuesForAssert(errors) : '').toBe(0)

    const { ok, missing, declaredCount, configGCellCount } = verifyGPointsCoverageInUi(built)
    expect(ok, formatGUiCoverageFailure(missing)).toBe(true)
    expect(declaredCount).toBe(configGCellCount)
    expect(declaredCount).toBeGreaterThan(0)
  })
})
