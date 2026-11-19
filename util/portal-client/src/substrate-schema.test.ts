import {cast} from '@subsquid/util-internal-validation'
import {describe, expect, it} from 'vitest'
import {getBlockSchema, patchQueryFields} from './query/substrate/schema'

describe('substrate block schema', () => {
    it('accepts non-hex extrinsic signer addresses', () => {
        let schema = getBlockSchema(patchQueryFields({extrinsic: {index: true, signature: true}}))
        let signature = {
            address: {__kind: 'Id', value: '0xdcc9b747fee4d055db6ce8faf6a330cbd61acfd324098ed679d04718ceab9f53'},
            signature: {__kind: 'Sr25519', value: '0x01'},
            signedExtensions: {},
        }
        let block = cast(schema, {
            header: {number: 1, hash: '0x01'},
            extrinsics: [{index: 0, signature}],
        })
        expect(block.extrinsics[0].signature).toEqual(signature)
    })
})
