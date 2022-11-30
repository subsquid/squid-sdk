import assert, {deepEqual} from "assert"
import {decode, encode} from "./index"


// ALICE
assert.deepEqual(decode('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'), {
    prefix: 42,
    bytes: Buffer.from('d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d', 'hex')
})


function de(prefix: number, s: string): void {
    let a = decode(s)
    assert.strictEqual(a.prefix, prefix)
    assert.strictEqual(encode(a), s)
}


// kusama
de(2, 'EXtQYFeY2ivDsfazZvGC9aG87DxnhWH2f9kjUUq2pXTZKF5')
de(2, 'H9Sa5qnaiK1oiLDstHRvgH9G6p9sMZ2j82hHMdxaq2QeAKk')
de(2, 'FXCgfz7AzQA1fNaUqubSgXxGh77sjWVVkypgueWLmAcwv79')

// polkadot
de(0, '1zugcag7cJVBtVRnFxv5Qftn7xKAnR6YJ9x4x3XLgGgmNnS')

// robonomics
de(32, '4HMMaWUW7McTGrmo9hSe9mkyKHpd9pzKGqkAFrCWnTFdwHpY')

// hydradx
de(63, '7LKANFqnxGZ5zVyQNsiNZM2n9dSVLNzmkwKoUKR7AALea3vN')

// crust
de(66, 'cTMxUeDi2HdYVpedqu5AFMtyDcn4djbBfCKiPDds6k1fuFYXL')

// subspace testnet
de(2254, 'st6v8nztLTbiqY5Hw97L5FWCBmpzMsrAh5qXZ1tJs1epNvoFA')

// basilisk
de(10041, 'bXn5CfJB2qHvqnuMqTpXn6un9Fjch8mwkb9i3JUsGVD4ChLoe')


function ed(prefix: number, bytes: Uint8Array): void {
    let s = encode({prefix, bytes})
    let a = decode(s)
    assert.deepEqual(a, {prefix, bytes})
}


ed(0, new Uint8Array([1, 2, 3, 4]))
ed(64, new Uint8Array([1, 2]))
ed(16383, new Uint8Array([2]))


for (let len of [1, 2, 4, 8, 32, 33]) {
    let prefix = getRandomInt(16384)
    ed(prefix, Buffer.alloc(len, len))
}


function getRandomInt(max: number) {
    return Math.floor(Math.random() * max); //The maximum is exclusive
}


console.log('ok')

