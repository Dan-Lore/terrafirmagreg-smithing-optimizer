import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Абсолютный путь к каталогу `data_source/` от корня репозитория (Vitest, Node). */
export function getDataSourceDir(): string {
  const testLibDir = fileURLToPath(new URL('.', import.meta.url))
  // src/lib/test → .. → .. → .. → project root
  return resolve(testLibDir, '..', '..', '..', 'data_source')
}
