export function safeToNumber(value: number | bigint, min: number, max: number): number {
  if (value < min) {
    throw new Error(`value ${value} is less than minimum ${min}`)
  }
  if (value > max) {
    throw new Error(`value ${value} is greater than maximum ${max}`)
  }
  return Number(value)
}
