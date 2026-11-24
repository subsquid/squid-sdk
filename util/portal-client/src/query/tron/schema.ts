import {NAT, STRING, ValidationFailure, type Validator} from '@subsquid/util-internal-validation'
import type {Block, FieldSelection} from './query'

export function patchQueryFields(fields: FieldSelection): FieldSelection {
    return {
        ...fields,
        block: {...fields.block, number: true, hash: true},
    }
}

/**
 * Checks the block number and hash and passes the rest of the block through unchanged.
 */
export function getBlockSchema(_fields: FieldSelection): Validator<Block, unknown> {
    return {
        cast(value: any) {
            let err = checkBlock(value)
            return err ?? value
        },
        validate(value: any) {
            return checkBlock(value)
        },
        phantom(): unknown {
            return {header: {number: 0, hash: ''}}
        },
    }
}

function checkBlock(value: any): ValidationFailure | undefined {
    if (value == null || typeof value != 'object' || value.header == null || typeof value.header != 'object') {
        return new ValidationFailure(value, '{value} is not a block')
    }
    let err = NAT.validate(value.header.number) ?? STRING.validate(value.header.hash)
    if (err) {
        err.path.unshift('header')
        return err
    }
    return undefined
}
