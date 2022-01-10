import assert from "assert"
import {decode, encode} from "./index"


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

console.log('ok')

