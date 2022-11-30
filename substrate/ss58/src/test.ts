import assert from "assert"
import * as ss58 from "./index"


// registry.get()
assert.strictEqual(ss58.registry.get('kusama'), ss58.registry.get(2))
assert.deepEqual(ss58.registry.get('kusama'), {
    "prefix": 2,
    "network": "kusama",
    "displayName": "Kusama Relay Chain",
    "symbols": ["KSM"],
    "decimals": [12],
    "standardAccount": "*25519",
    "website": "https://kusama.network"
})
assert.throws(() => ss58.registry.get('fakefoo'))
assert.throws(() => ss58.registry.get(500000))


// registry.find()
assert.strictEqual(ss58.registry.find('kusama'), ss58.registry.get('kusama'))
assert.strictEqual(ss58.registry.find('fakefoo'), undefined)


// codec (ALICE)
assert.deepEqual(
    ss58.codec(42).decode('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'),
    Buffer.from('d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d', 'hex')
)
assert.strictEqual(
    ss58.codec(42).encode(Buffer.from('d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d', 'hex')),
    '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
)
assert.throws(() => ss58.codec(2).decode('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'))


console.log('ok')
