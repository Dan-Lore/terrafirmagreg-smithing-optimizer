import { describe, expect, it } from 'vitest'
import { GENERATED_SMITHING_CONFIG } from '../generated/smithing-data'
import {
  buildSmithingDatasetFromDataSource,
  builtDatasetToSmithingConfig,
  formatSmithingIssuesForAssert,
} from './buildSmithingDatasetFromDataSource'
import { getDataSourceDir } from './test/dataSourcePaths'

const dataSourceDir = getDataSourceDir()

describe('data_source ↔ src/generated/smithing-data.ts', () => {
  it('закоммиченный smithing-data.ts совпадает со слиянием каталога data_source (после правок запустите npm run generate-smithing)', () => {
    const built = buildSmithingDatasetFromDataSource(dataSourceDir)
    const errors = built.issues.filter((i) => i.severity === 'error')
    expect(errors.length, errors.length > 0 ? formatSmithingIssuesForAssert(errors) : '').toBe(0)

    const fromDisk = builtDatasetToSmithingConfig(built)
    expect(fromDisk).toEqual(GENERATED_SMITHING_CONFIG)
  })
})
