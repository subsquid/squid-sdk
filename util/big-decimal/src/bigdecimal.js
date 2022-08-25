import BigDecimal from 'big.js'

BigDecimal.fromBigInt = (n, d) => {
    let decimals = 1n
    for (let i = 0; i < d; i++) decimals *= 10n
    return BigDecimal(n).div(decimals)
}

export {BigDecimal}