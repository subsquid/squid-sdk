import {FieldSelection} from './interfaces/data'
import {object, option, BOOLEAN} from '@subsquid/util-internal-validation'


type GetFieldSelectionSchema<T> = {[K in keyof T]-?: typeof FIELD}


const FIELD = option(BOOLEAN)


export function getBlockHeaderSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['block']> = {
        digest: FIELD,
        extrinsicsRoot: FIELD,
        stateRoot: FIELD,
        timestamp: FIELD,
        validator: FIELD,
    }
    return object(fields)
}


export function getExtrinsicSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['extrinsic']> = {
        hash: FIELD,
        error: FIELD,
        fee: FIELD,
        signature: FIELD,
        success: FIELD,
        tip: FIELD,
        version: FIELD,
    }
    return object(fields)
}


export function getEventSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['event']> = {
        args: FIELD,
        name: FIELD,
        phase: FIELD,
        topics: FIELD,
    }
    return object(fields)
}


export function getCallSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['call']> = {
        args: FIELD,
        error: FIELD,
        name: FIELD,
        origin: FIELD,
        success: FIELD
    }
    return object(fields)
}


export function getFieldSelectionValidator() {
    return object({
        block: option(getBlockHeaderSelectionValidator()),
        extrinsic: option(getExtrinsicSelectionValidator()),
        call: option(getCallSelectionValidator()),
        event: option(getEventSelectionValidator()),
    })
}


type Selector<Keys extends string> = {
    [K in Keys]?: boolean
}


export function mergeFields<Keys extends string>(def: Selector<Keys>, requested?: Selector<Keys>, required?: Selector<Keys>): Selector<Keys> {
    let fields: Selector<Keys> = {...def}
    for (let key in requested) {
        fields[key] = requested[key]
    }
    Object.assign(fields, required)
    return fields
}