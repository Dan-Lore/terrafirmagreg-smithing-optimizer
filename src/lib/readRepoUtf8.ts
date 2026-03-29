/**
 * Чтение файлов репозитория в Node (генераторы, слияние data_source, скрипты).
 */
import { readdirSync, readFileSync } from 'node:fs'

export function readUtf8OrThrow(absPath: string, label: string): string {
  try {
    return readFileSync(absPath, 'utf8')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`data_source: не удалось прочитать «${label}» (${absPath}): ${msg}`)
  }
}

export function readDirOrThrow(absPath: string): string[] {
  try {
    return readdirSync(absPath)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`data_source: не удалось прочитать каталог (${absPath}): ${msg}`)
  }
}
