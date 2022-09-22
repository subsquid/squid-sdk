const assert = require('assert')
const Big = require('big.js').Big


// fresh Big class
const Base = Big()


// adjust settings
Base.DP = 80
Base.NE = -19


function BigDecimal(value, decimals) {
    if (this instanceof BigDecimal) {
        if (isBigDecimal(value)) {
            // `Base` constructor has analogous check, but via `instanceof` statement.
            // `isBigDecimal()` performs structural check to handle the case when value comes
            // from a different package version.
            // Such version mismatches can practically occur, but most of the time should be benign.
            this.s = value.s
            this.e = value.e
            this.c = value.c.slice()
        } else {
            Base.call(this, value)
        }
        this.constructor = BigDecimal
        if (decimals) {
            const e = Number(decimals) // bigint case
            assert(Number.isSafeInteger(e))
            return this.div(BigDecimal(10).pow(e))
        }
    } else if (value instanceof BigDecimal && decimals == null) {
        return value
    } else {
        return new BigDecimal(value, decimals)
    }
}


Object.assign(BigDecimal, Base)
BigDecimal.isBigDecimal = isBigDecimal
BigDecimal.prototype = Object.create(Base.prototype)
BigDecimal.prototype.__is_squid_big_decimal = true


function isBigDecimal(value) {
    return value != null && !!value.__is_squid_big_decimal
}


module.exports.BigDecimal = BigDecimal
