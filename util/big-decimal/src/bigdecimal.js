import {Big} from 'big.js'
import assert from 'assert'

Big.DP = 1E6
Big.NE = 0
Big.PE = 0

const BigDecimal = (n, d) => {
    if (d != null) {
        assert(typeof n === 'bigint')
        let decimals = 1n
        for (let i = 0; i < d; i++) decimals *= 10n
        return Big(n).div(decimals)
    } else {
        return Big(n)
    }
}

export {BigDecimal}