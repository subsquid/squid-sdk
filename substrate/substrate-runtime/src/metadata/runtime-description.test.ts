import {describe, expect, it} from 'vitest'
import {Runtime} from '../runtime'
import type {
    Metadata_V14,
    Metadata_V15,
    Metadata_V16,
    PalletMetadataV14,
    PortableTypeV14,
    Si1Field,
    Si1Type,
    Si1TypeDef,
} from './interfaces'
import {getRuntimeDescription} from './runtime-description'

// V15 and V16 runtimes are built by converting their metadata to the V14 shape. These tests
// describe one tiny runtime in V14, V15 and V16 metadata and check that all three agree.

// The metadata decoder returns byte fields as hex strings, even where the interfaces say Uint8Array.
const bytes = (hex: string) => hex as unknown as Uint8Array

const field = (type: number, name?: string): Si1Field => ({name, type, typeName: undefined, docs: []})

function ty(def: Si1TypeDef, path: string[] = [], params: Si1Type['params'] = []): Si1Type {
    return {path, params, def, docs: []}
}

const types: Si1Type[] = [
    /* 0 */ ty({__kind: 'Primitive', value: {__kind: 'U8'}}),
    /* 1 */ ty({__kind: 'Primitive', value: {__kind: 'U128'}}),
    /* 2 */ ty({__kind: 'Sequence', value: {type: 0}}),
    /* 3 */ ty({__kind: 'Variant', value: {variants: [{name: 'Other', fields: [field(2)], index: 0, docs: []}]}}, [
        'DigestItem',
    ]),
    /* 4 */ ty({__kind: 'Sequence', value: {type: 3}}),
    /* 5 */ ty({__kind: 'Composite', value: {fields: [field(4, 'logs')]}}, ['Digest']),
    /* 6 */ ty({__kind: 'Variant', value: {variants: [{name: 'System', fields: [field(12)], index: 0, docs: []}]}}, [
        'RuntimeEvent',
    ]),
    /* 7 */ ty({__kind: 'Composite', value: {fields: [field(6, 'event')]}}, ['EventRecord']),
    /* 8 */ ty({__kind: 'Sequence', value: {type: 7}}),
    /* 9 */ ty({__kind: 'Variant', value: {variants: [{name: 'System', fields: [field(13)], index: 0, docs: []}]}}, [
        'RuntimeCall',
    ]),
    /* 10 */ ty({__kind: 'Tuple', value: []}),
    /* 11 */ ty(
        {__kind: 'Composite', value: {fields: [field(2)]}},
        ['sp_runtime', 'generic', 'unchecked_extrinsic', 'UncheckedExtrinsic'],
        [
            {name: 'Address', type: 0},
            {name: 'Call', type: 9},
            {name: 'Signature', type: 0},
            {name: 'Extra', type: 10},
        ],
    ),
    /* 12 */ ty({__kind: 'Variant', value: {variants: [{name: 'Pinged', fields: [], index: 0, docs: []}]}}, [
        'SystemEvent',
    ]),
    /* 13 */ ty({__kind: 'Variant', value: {variants: [{name: 'ping', fields: [], index: 0, docs: []}]}}, [
        'SystemCall',
    ]),
]
const lookup = {types: types.map((type, id): PortableTypeV14 => ({id, type}))}

const plain = (name: string, value: number) => ({
    name,
    modifier: {__kind: 'Default' as const},
    type: {__kind: 'Plain' as const, value},
    fallback: bytes('0x00'),
    docs: [],
})

const system = {
    name: 'System',
    index: 0,
    storage: {prefix: 'System', items: [plain('Digest', 5), plain('Events', 8)]},
}

const balances = {
    name: 'Balances',
    index: 1,
    storage: undefined,
    constants: [
        // 500 as a little-endian u128
        {name: 'ExistentialDeposit', type: 1, value: bytes('0xf4010000000000000000000000000000'), docs: ['ED']},
        {name: 'MaxLocks', type: 0, value: bytes('0x32'), docs: []},
    ],
}

const v14: Metadata_V14 = {
    __kind: 'V14',
    value: {
        lookup,
        pallets: [
            {...system, constants: [], calls: undefined, events: undefined, errors: undefined},
            {...balances, calls: undefined, events: undefined, errors: undefined},
        ] satisfies PalletMetadataV14[],
        extrinsic: {type: 11, version: 4, signedExtensions: []},
        type: 0,
    },
}

const v15: Metadata_V15 = {
    __kind: 'V15',
    value: {
        lookup,
        pallets: [system, balances].map((p) => ({
            constants: [],
            ...p,
            calls: undefined,
            event: undefined,
            error: undefined,
            docs: [],
        })),
        extrinsic: {version: 4, addressTy: 0, callTy: 9, signatureTy: 0, extraTy: 10, signedExtensions: []},
        ty: 0,
        apis: [],
        outerEnums: {callEnumTy: 9, eventEnumTy: 6, errorEnumTy: 6},
        custom: {map: []},
    },
}

const v16: Metadata_V16 = {
    __kind: 'V16',
    value: {
        lookup,
        pallets: [system, balances].map((p) => ({
            ...p,
            constants: ('constants' in p ? p.constants : []).map(({type, ...c}) => ({
                ...c,
                ty: type,
                deprecationInfo: {__kind: 'NotDeprecated'},
            })),
            calls: undefined,
            event: undefined,
            error: undefined,
            associatedTypes: [],
            viewFunctions: [],
            docs: [],
            deprecationInfo: {__kind: 'NotDeprecated'},
        })),
        extrinsic: {
            versions: [4, 5],
            addressTy: 0,
            callTy: 9,
            signatureTy: 0,
            transactionExtensionsByVersion: [[0, []]],
            transactionExtensions: [],
        },
        apis: [],
        outerEnums: {callEnumTy: 9, eventEnumTy: 6, errorEnumTy: 6},
        custom: {map: []},
    },
}

const version = {specName: 'test', specVersion: 1, implName: 'test', implVersion: 1}

describe.each([
    ['V15', v15],
    ['V16', v16],
])('runtime description from %s metadata', (_, metadata) => {
    it('has the constants and storage of V14 metadata', () => {
        let expected = getRuntimeDescription(v14)
        let actual = getRuntimeDescription(metadata)
        expect(actual.constants).toEqual(expected.constants)
        expect(actual.storage).toEqual(expected.storage)
    })

    it('decodes constants', () => {
        let runtime = new Runtime(version, v14, undefined, undefined, metadata)
        expect(runtime.description.constants.Balances.ExistentialDeposit.type).toBe(1)
        expect(runtime.getConstant('Balances.ExistentialDeposit')).toBe(500n)
        expect(runtime.getConstant('Balances.MaxLocks')).toBe(50)
    })
})
