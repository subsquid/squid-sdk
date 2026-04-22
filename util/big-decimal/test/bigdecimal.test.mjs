import { createRequire } from 'module'
import { test, expect } from 'vitest'

const require = createRequire(import.meta.url)
const { BigDecimal } = require('../bigdecimal')

test('plus: float + decimal pair', () => {
    expect(BigDecimal(0.1).plus(BigDecimal(2n, 1)).toString()).toBe('0.3')
})

test('plus: string + bigint', () => {
    expect(BigDecimal('0.0005').plus(6n).toString()).toBe('6.0005')
})

test('toJSON', () => {
    expect(JSON.stringify(BigDecimal(1))).toBe('"1"')
})
