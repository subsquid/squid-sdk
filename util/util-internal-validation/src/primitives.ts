import {ValidationFailure} from './error'
import {Validator} from './interface'


export const STRING: Validator<string> = {
    cast(value: unknown): ValidationFailure | string {
        if (typeof value == 'string') {
            return value
        } else {
            return new ValidationFailure(value, '{value} is not a string')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (typeof value == 'string') return
        return new ValidationFailure(value, '{value} is not a string')
    },
    phantom(): string {
        return ''
    }
}


/**
 * Safe integer
 */
export const INT: Validator<number> = {
    cast(value: unknown): number | ValidationFailure {
        if (isInteger(value)) {
            return value
        } else {
            return new ValidationFailure(value, '{value} is not an integer')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isInteger(value)) return
        return new ValidationFailure(value, '{value} is not an integer')
    },
    phantom(): number {
        return 0
    }
}


function isInteger(value: unknown): value is number {
    return typeof value == 'number' && Number.isSafeInteger(value)
}


/**
 * Safe integer greater or equal to 0
 */
export const NAT: Validator<number> = {
    cast(value: unknown): number | ValidationFailure {
        if (isInteger(value) && value >= 0) {
            return value
        } else {
            return new ValidationFailure(value, '{value} is not a safe natural number')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isInteger(value) && value >= 0) return
        return new ValidationFailure(value, '{value} is not a safe natural number')
    },
    phantom(): number {
        return 0
    }
}


/**
 * Hex encoded binary string or natural number
 */
type Bytes = string


function isBytes(value: unknown): value is Bytes {
    return typeof value == 'string' && /^0x[0-9a-f]*$/.test(value)
}


/**
 * Hex encoded natural number of an arbitrary size
 */
export const QTY: Validator<bigint, Bytes> = {
    cast(value: unknown): ValidationFailure | bigint {
        if (isBytes(value)) {
            return BigInt(value)
        } else {
            return new ValidationFailure(value, `{value} is not a hex encoded natural number`)
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isBytes(value)) return
        return new ValidationFailure(value, `{value} is not a hex encoded natural number`)
    },
    phantom(): string {
        return '0x0'
    }
}


/**
 * Hex encoded safe natural number
 */
export const SMALL_QTY: Validator<number, Bytes> = {
    cast(value: unknown): number | ValidationFailure {
        if (isBytes(value)) {
            let val = parseInt(value)
            if (Number.isSafeInteger(val)) {
                return val
            } else {
                return new ValidationFailure(value, `{value} is not a safe integer`)
            }
        } else {
            return new ValidationFailure(value, `{value} is not a hex encoded natural number`)
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        let i = this.cast(value)
        if (i instanceof ValidationFailure) return i
    },
    phantom(): string {
        return '0x0'
    }
}


/**
 * Hex encoded binary string
 */
export const BYTES: Validator<Bytes> = {
    cast(value: unknown): string | ValidationFailure {
        return this.validate(value) || value as Bytes
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isBytes(value)) return
        return new ValidationFailure(value, `{value} is not a hex encoded binary string`)
    },
    phantom(): Bytes {
        return '0x'
    }
}
