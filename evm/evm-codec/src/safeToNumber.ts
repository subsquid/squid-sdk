export function safeToNumber(value: number | bigint): number {
  if ( value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${value} is not a safe integer`)
  }
  return Number(value)
}
