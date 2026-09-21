import {
    ANY,
    ANY_OBJECT,
    array,
    BIG_NAT,
    BOOLEAN,
    BYTES,
    constant,
    NAT,
    nullable,
    object,
    oneOf,
    option,
    STRING,
    withDefault,
} from '@subsquid/util-internal-validation'
import {isEmpty, project} from '../util'
import type {FieldSelection} from './fields'

export function patchQueryFields(fields: FieldSelection): FieldSelection {
    fields = {...fields}

    let {number, hash, ...block} = (fields.block as any) ?? {}
    fields.block = {
        ...block,
        number: true,
        hash: true,
    }

    return fields
}

export function getBlockSchema(fields: FieldSelection) {
    return object({
        header: getBlockHeaderSchema(fields.block),
        extrinsics: withDefault([], array(getExtrinsicSchema(fields.extrinsic))),
        calls: withDefault([], array(getCallSchema(fields.call))),
        events: withDefault([], array(getEventSchema(fields.event))),
    })
}

function getBlockHeaderSchema(fields: FieldSelection['block']) {
    return object({
        number: NAT,
        hash: BYTES,
        ...project(fields, {
            parentHash: BYTES,
            stateRoot: BYTES,
            extrinsicsRoot: BYTES,
            digest: object({
                logs: array(BYTES),
            }),
            specName: STRING,
            specVersion: NAT,
            implName: STRING,
            implVersion: NAT,
            timestamp: option(NAT),
            validator: option(BYTES),
        }),
    })
}

const ExtrinsicSignature = object({
    address: BYTES,
    signature: ANY_OBJECT,
    signedExtensions: ANY_OBJECT,
})

function getExtrinsicSchema(fields: FieldSelection['extrinsic']) {
    return object(
        project(fields, {
            index: NAT,
            version: NAT,
            signature: option(ExtrinsicSignature),
            fee: option(BIG_NAT),
            tip: option(BIG_NAT),
            error: nullable(ANY),
            success: option(BOOLEAN),
            hash: option(BYTES),
        })
    )
}

function getCallSchema(fields: FieldSelection['call']) {
    return object(
        project(fields, {
            extrinsicIndex: NAT,
            address: array(NAT),
            name: STRING,
            args: ANY,
            origin: option(ANY),
            error: nullable(ANY),
            success: option(BOOLEAN),
        })
    )
}

function getEventSchema(fields: FieldSelection['event']) {
    return object(
        project(fields, {
            index: NAT,
            name: STRING,
            args: ANY,
            phase: oneOf({
                Initialization: constant('Initialization'),
                ApplyExtrinsic: constant('ApplyExtrinsic'),
                Finalization: constant('Finalization'),
            }),
            extrinsicIndex: option(NAT),
            callAddress: option(array(NAT)),
            topics: array(BYTES),
        })
    )
}
