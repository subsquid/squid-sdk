import { Validator, ValidationFailure } from "@subsquid/util-internal-validation"


export type BareHex = string

export function isBareHex(value: unknown): value is BareHex {
    return typeof value == 'string' && /^[0-9a-fA-F]+$/.test(value)
}

export const BAREHEX: Validator<BareHex> = {
    cast(value: unknown): BareHex | ValidationFailure {
        return this.validate(value) || (value as BareHex).toLowerCase()
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (!isBareHex(value)) {
            return new ValidationFailure(value, `{value} is not a hex encoded binary string`)
        }
        if (value.length % 2 != 0) {
            return new ValidationFailure(value, `{value} is not a valid hex string (should have even length)`)
        }
    },
    phantom(): BareHex {
        return ''
    }
}

export const BAREHEX32: Validator<BareHex> = {
    cast(value: unknown): BareHex | ValidationFailure {
        return this.validate(value) || (value as BareHex).toLowerCase()
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (!isBareHex(value)) {
            return new ValidationFailure(value, `{value} is not a hex encoded binary string`)
        }
        if (value.length != 64) {
            return new ValidationFailure(value, `{value} is not 32 bytes hex string`)
        }
    },
    phantom(): BareHex {
        return ''
    }
}

export const BTC_AMOUNT: Validator<number> = {
    cast(value: unknown): number | ValidationFailure {
        return this.validate(value) || (value as number)
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (typeof value != 'number') {
            return new ValidationFailure(value, `{value} is not a number`)
        }
        if (value < 0) {
            return new ValidationFailure(value, `{value} is not a positive number`)
        }
        if (parseFloat(value.toFixed(8)) !== value) {
            return new ValidationFailure(value, `{value} has more than 8 decimal places`)
        }
    },
    phantom(): number {
        return 0
    }
}

export const FLOAT: Validator<number> = {
    cast(value: unknown): number | ValidationFailure {
        return this.validate(value) || (value as number)
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (typeof value != 'number' || !Number.isFinite(value)) {
            return new ValidationFailure(value, `{value} is not a finite number`)
        }
    },
    phantom(): number {
        return 0
    },
}
