import assert from 'assert'
import { describe, test } from 'vitest'
import { decode, encode } from './index'


test('decode ALICE', () => {
    assert.deepEqual(decode('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'), {
        prefix: 42,
        bytes: Buffer.from('d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d', 'hex')
    })
})


function de(prefix: number, s: string): void {
    let a = decode(s)
    assert.strictEqual(a.prefix, prefix)
    assert.strictEqual(encode(a), s)
}


describe('decode+encode round-trip fixtures', () => {
    test('kusama EXt', () => de(2, 'EXtQYFeY2ivDsfazZvGC9aG87DxnhWH2f9kjUUq2pXTZKF5'))
    test('kusama H9S', () => de(2, 'H9Sa5qnaiK1oiLDstHRvgH9G6p9sMZ2j82hHMdxaq2QeAKk'))
    test('kusama FXC', () => de(2, 'FXCgfz7AzQA1fNaUqubSgXxGh77sjWVVkypgueWLmAcwv79'))
    test('polkadot', () => de(0, '1zugcag7cJVBtVRnFxv5Qftn7xKAnR6YJ9x4x3XLgGgmNnS'))
    test('robonomics', () => de(32, '4HMMaWUW7McTGrmo9hSe9mkyKHpd9pzKGqkAFrCWnTFdwHpY'))
    test('hydradx', () => de(63, '7LKANFqnxGZ5zVyQNsiNZM2n9dSVLNzmkwKoUKR7AALea3vN'))
    test('crust', () => de(66, 'cTMxUeDi2HdYVpedqu5AFMtyDcn4djbBfCKiPDds6k1fuFYXL'))
    test('subspace testnet', () => de(2254, 'st6v8nztLTbiqY5Hw97L5FWCBmpzMsrAh5qXZ1tJs1epNvoFA'))
    test('basilisk', () => de(10041, 'bXn5CfJB2qHvqnuMqTpXn6un9Fjch8mwkb9i3JUsGVD4ChLoe'))
})


function ed(prefix: number, bytes: Uint8Array): void {
    let s = encode({ prefix, bytes })
    let a = decode(s)
    assert.deepEqual(a, { prefix, bytes })
}


describe('encode+decode round-trip', () => {
    test('prefix=0, 4 bytes', () => ed(0, new Uint8Array([1, 2, 3, 4])))
    test('prefix=64, 2 bytes', () => ed(64, new Uint8Array([1, 2])))
    test('prefix=16383, 1 byte', () => ed(16383, new Uint8Array([2])))

    test('random prefixes', () => {
        for (let len of [1, 2, 4, 8, 32, 33]) {
            let prefix = Math.floor(Math.random() * 16384)
            ed(prefix, Buffer.alloc(len, len))
        }
    })
})
