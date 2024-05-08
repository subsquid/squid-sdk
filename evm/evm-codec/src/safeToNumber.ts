export function safeToNumber(value: number | bigint): number {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${value} is not a safe integer`)
  }
  return Number(value)
}
