import {ValueTransformer} from 'typeorm'

export const bigintTransformer: ValueTransformer = {
    to(x?: bigint) {
        return x?.toString()
    },
    from(s?: string): bigint | undefined {
        return s == null ? undefined : BigInt(s)
    },
}

export const floatTransformer: ValueTransformer = {
    to(x?: number) {
        return x?.toString()
    },
    from(s?: string): number | undefined {
        return s == null ? undefined : Number(s)
    },
}

const decimal = {
    get BigDecimal(): any {
        throw new Error('Package `@subsquid/big-decimal` is not installed')
    },
}

try {
    Object.defineProperty(decimal, 'BigDecimal', {
        value: require('@subsquid/big-decimal').BigDecimal,
    })
} catch (e) {}

export const bigdecimalTransformer: ValueTransformer = {
    to(x?: any) {
        return x?.toString()
    },
    from(s?: any): any | undefined {
        return s == null ? undefined : decimal.BigDecimal(s)
    },
}
