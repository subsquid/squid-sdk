import type {BigDecimalConstructor} from '@subsquid/big-decimal'


export const bigDecimal = {
    get BigDecimal(): BigDecimalConstructor {
        throw new Error('Package `@subsquid/big-decimal` is not installed')
    }
}


try {
    Object.defineProperty(bigDecimal, "BigDecimal", {
        value: require('@subsquid/big-decimal').BigDecimal
    })
} catch (e: any) {}
