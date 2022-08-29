const assert = require('assert')
const Big = require('big.js').Big

// fresh Big class
const Base = Big()


// adjust settings
Base.DP = 80


function BigDecimal(value, decimals) {
    if (this instanceof BigDecimal) {
        Base.call(this, value)
        this.constructor = BigDecimal
        if (decimals) {
            const e = Number(decimals) // bigint case
            assert(Number.isSafeInteger(e))
            return this.div(BigDecimal(10).pow(e))
        }
    } else {
        return new BigDecimal(value, decimals)
    }
}


BigDecimal.prototype = Base.prototype


module.exports.BigDecimal = BigDecimal