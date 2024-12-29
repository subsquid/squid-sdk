import {FieldSelection} from '../interfaces/data.js'
import {object, option, BOOLEAN} from '@subsquid/util-internal-validation'


type GetFieldSelectionSchema<T> = {[K in keyof T]-?: typeof FIELD}


const FIELD = option(BOOLEAN)


export function getBlockHeaderSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['block']> = {
        nonce: FIELD,
        difficulty: FIELD,
        size: FIELD,
        timestamp: FIELD,
    }
    return object(fields)
}


export function getTxSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['transaction']> = {
        hash: FIELD,
        inputs: FIELD,
        locktime: FIELD,
        outputs: FIELD,
        version: FIELD,
        size: FIELD,
        sourceOutputs: FIELD,
        fee: FIELD,
    }
    return object(fields)
}


export function getFieldSelectionValidator() {
    return object({
        block: option(getBlockHeaderSelectionValidator()),
        transaction: option(getTxSelectionValidator()),
    })
}