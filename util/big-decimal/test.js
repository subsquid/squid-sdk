const {BigDecimal} = require('./bigdecimal')
const assert = require('assert')

assert.strictEqual(BigDecimal(0.1).plus(BigDecimal(2n, 1)).toString(), '0.3')
assert.strictEqual(BigDecimal('0.0005').plus(6n).toString(), '6.0005')
assert.strictEqual(JSON.stringify(BigDecimal(1)), '"1"')

console.log('ok')
