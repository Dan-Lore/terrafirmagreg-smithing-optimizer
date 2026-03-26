export const MIN_G = 0 as const
export const MAX_G = 150 as const

export const COMMANDS = [2, 7, 13, 16, -3, -6, -9, -15] as const
export type Command = (typeof COMMANDS)[number]

