import {ValidationFailure} from './error'
import {Validator} from './interface'


export const ANY: Validator<any> = {
    cast(value: unknown): any {
        return value
    },
    validate(value: unknown): ValidationFailure | undefined {
        return
    },
    phantom(): any {
        throw new Error('Function not implemented.')
    }
}


export const ANY_OBJECT: Validator<object> = {
    cast(value: unknown): object | ValidationFailure {
        return this.validate(value) || (value as object)
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (value && typeof value == 'object') return
        return new ValidationFailure(value, '{value} is not an object')
    },
    phantom(): object {
        return {}
    }
}


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
        if (isSafeInteger(value)) {
            return value
        } else {
            return new ValidationFailure(value, '{value} is not an integer')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isSafeInteger(value)) return
        return new ValidationFailure(value, '{value} is not an integer')
    },
    phantom(): number {
        return 0
    }
}


export const ANY_INT: Validator<bigint, number | string> = {
    cast(value: unknown): bigint | ValidationFailure {
        if (isSafeInteger(value) || isBigNat(value)) {
            return BigInt(value)
        } else {
            return new ValidationFailure(value, '{value} is not an integer')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isSafeInteger(value) || isBigNat(value)) return
        return new ValidationFailure(value, '{value} is not an integer')
    },
    phantom(): number {
        return 0
    }
}


function isSafeInteger(value: unknown): value is number {
    return typeof value == 'number' && Number.isSafeInteger(value)
}


function isBigNat(value: unknown): value is string {
    return typeof value == 'string' && /^\d+$/.test(value)
}


/**
 * Safe integer greater or equal to 0
 */
export const NAT: Validator<number> = {
    cast(value: unknown): number | ValidationFailure {
        if (isSafeInteger(value) && value >= 0) {
            return value
        } else {
            return new ValidationFailure(value, '{value} is not a safe natural number')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isSafeInteger(value) && value >= 0) return
        return new ValidationFailure(value, '{value} is not a safe natural number')
    },
    phantom(): number {
        return 0
    }
}


export const BIG_NAT: Validator<bigint, string> = {
    cast(value: unknown): bigint | ValidationFailure {
        if (isBigNat(value)) {
            return BigInt(value)
        } else {
            return new ValidationFailure(value, '{value} is not a string representing natural number')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isBigNat(value)) return
        return new ValidationFailure(value, '{value} is not a string representing natural number')
    },
    phantom(): string {
        return '0'
    }
}


export const ANY_NAT: Validator<bigint, number | string> = {
    cast(value: unknown): bigint | ValidationFailure {
        if (isSafeInteger(value) && value >= 0 || isBigNat(value)) {
            return BigInt(value)
        } else {
            return new ValidationFailure(value, '{value} is not a natural number')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isSafeInteger(value) && value >= 0 || isBigNat(value)) return
        return new ValidationFailure(value, '{value} is not a natural number')
    },
    phantom(): number | string {
        return 0
    }
}


export const STRING_NAT: Validator<number, string> = {
    cast(value: unknown): number | ValidationFailure {
        if (typeof value == 'string') {
            let val = parseInt(value)
            if (Number.isSafeInteger(val)) {
                return val
            } else {
                return new ValidationFailure(value, `{value} is not a safe integer`)
            }
        } else {
            return new ValidationFailure(value, '{value} is not a string natural number')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        let i = this.cast(value)
        if (i instanceof ValidationFailure) return i
    },
    phantom(): string {
        return '0'
    }
}


export const STRING_FLOAT: Validator<number, string> = {
    cast(value: unknown): number | ValidationFailure {
        if (typeof value == 'string') {
            let val = parseFloat(value)
            if (Number.isNaN(val)) {
                return new ValidationFailure(value, `{value} is not a number`)
            } else {
                return val
            }
        } else {
            return new ValidationFailure(value, '{value} is not a string float number')
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        let i = this.cast(value)
        if (i instanceof ValidationFailure) return i
    },
    phantom(): string {
        return '0'
    }
}


/**
 * Hex encoded binary string or natural number
 */
type Bytes = string


function isBytes(value: unknown): value is Bytes {
    return typeof value == 'string' && /^0x[0-9a-fA-F]*$/.test(value)
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
    cast(value: unknown): Bytes | ValidationFailure {
        return this.validate(value) || (value as Bytes).toLowerCase()
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isBytes(value)) return
        return new ValidationFailure(value, `{value} is not a hex encoded binary string`)
    },
    phantom(): Bytes {
        return '0x'
    }
}


type Base58Bytes = string
type Base64Bytes = string


/**
 * Base58 encoded binary string
 */
export const B58: Validator<Base58Bytes> = {
    cast(value: unknown): Base58Bytes | ValidationFailure {
        if (isBase58(value)) return value
        return new ValidationFailure(value, `{value} is not a base58 string`)
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isBase58(value)) return
        return new ValidationFailure(value, `{value} is not a base58 string`)
    },
    phantom(): string {
        throw new Error('Function not implemented.')
    }
}


function isBase58(value: unknown): value is Base58Bytes {
    return typeof value == 'string' &&
        /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]*$/.test(value)
}


/**
 * Base64 encoded binary string
 */
export const B64: Validator<Base64Bytes> = {
    cast(value: unknown): Base58Bytes | ValidationFailure {
        if (isBase64(value)) return value
        return new ValidationFailure(value, `{value} is not a base64 string`)
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (isBase64(value)) return
        return new ValidationFailure(value, `{value} is not a base64 string`)
    },
    phantom(): string {
        throw new Error('Function not implemented.')
    }
}


function isBase64(value: unknown): value is Base64Bytes {
    return typeof value == 'string' &&
        /^[0-9a-zA-Z+\/]*={0,2}$/.test(value)
}


export const BOOLEAN: Validator<boolean> = {
    cast(value: unknown): boolean | ValidationFailure {
        return this.validate(value) || value as boolean
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (typeof value === 'boolean') return
        return new ValidationFailure(value, `{value} is not a boolean`)
    },
    phantom(): boolean {
        return false
    }
}
