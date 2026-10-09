import {type CompositeType, type Type as ScaleType, TypeKind} from '@subsquid/scale-codec'
import assert from 'node:assert'
import {describe, test} from 'vitest'
import * as sts from './index'

// Bucket v1 has `owner`, Bucket v2 adds `isPublic` (subsquid/squid-sdk#334)
const BucketV1 = {owner: sts.number()}
const BucketV2 = {owner: sts.number(), isPublic: sts.boolean()}

function runtimeTypes(wrap: (bucket: CompositeType) => ScaleType): ScaleType[] {
    return [
        {kind: TypeKind.Primitive, primitive: 'U32'},
        {kind: TypeKind.Primitive, primitive: 'Bool'},
        wrap({
            kind: TypeKind.Composite,
            fields: [
                {name: 'owner', type: 0},
                {name: 'isPublic', type: 1},
            ],
        }),
    ]
}

const structTypes = runtimeTypes((c) => c)

const variantTypes = runtimeTypes((c) => ({
    kind: TypeKind.Variant,
    variants: [{index: 0, name: 'Created', fields: c.fields}],
}))

describe('struct', () => {
    test('matches a runtime struct with extra fields', () => {
        assert.strictEqual(sts.match(structTypes, 2, sts.struct(BucketV1)), true)
    })
})

describe('closedStruct', () => {
    test('rejects a runtime struct with extra fields', () => {
        assert.strictEqual(sts.match(structTypes, 2, sts.closedStruct(BucketV1)), false)
    })

    test('matches a runtime struct with the same fields', () => {
        assert.strictEqual(sts.match(structTypes, 2, sts.closedStruct(BucketV2)), true)
    })
})

describe('closedEnumStruct', () => {
    test('rejects a variant with extra fields', () => {
        let ty = sts.closedEnum({Created: sts.closedEnumStruct(BucketV1)})
        assert.strictEqual(sts.match(variantTypes, 2, ty), false)
    })

    test('matches a variant with the same fields', () => {
        let ty = sts.closedEnum({Created: sts.closedEnumStruct(BucketV2)})
        assert.strictEqual(sts.match(variantTypes, 2, ty), true)
    })
})
