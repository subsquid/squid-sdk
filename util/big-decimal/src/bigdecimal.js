import {Big} from 'big.js'

Big.DP = 34
Big.NE = -6144
Big.PE = 6144

const BigDecimal = (n, d) => {
    if (d != null) {
        d = BigInt(d)
        let decimals = 1n
        for (let i = 0n; i < d; i++) decimals *= 10n
        return Big(n).div(decimals)
    } else {
        return Big(n)
    }
}

export {BigDecimal}